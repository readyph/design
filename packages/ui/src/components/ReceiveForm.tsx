import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check } from '@phosphor-icons/react';
import { Button } from './Button';
import { QuantityStepper } from './QuantityStepper';
import { SegmentedControl } from './SegmentedControl';
import { Select } from './Select';
import { cn } from '../utils/cn';

/*
 * RDY-395 I11 Receive form. Transcribed from inventory-home FINAL/purchase-orders.css 14-15 (.rtally), 120-171 (.rl*, .rform, .rsum),
 * 172-179 (sticky bar), 195 (tablet columns), 259-285 (phone), 295-320 (print tally sheet); purchase-orders.js 395-476
 * (SHORTW/EXTRAW/BADW, newForm, lnState, totals, effect, resText, whyHTML, lineRecv, sumHTML, restHTML, receiveHTML, btnLabel),
 * 532-537, 539-600 (live parts, setGot, confirmReceipt); receiving.js 71-95 (RCV.rule), 118 (goesInL).
 * The page header (title, state, facts, steps) belongs to the page, not to this form.
 */

/** purchase-orders.js 396-398 */
export const SHORT_REASONS = [
  ['later', 'The rest is coming later'],
  ['never', 'The supplier will not send the rest'],
  ['ask', 'Not sure yet, ask the supplier'],
] as const;
export const EXTRA_REASONS = [
  ['keep', 'Supplier sent extra, we keep it'],
  ['back', 'The extra goes back to the supplier'],
] as const;
export const DAMAGED_REASONS = ['Broken or leaking', 'Wrong item', 'Expired or close to expiry', 'Other'] as const;

/** receiving.js 71-95 (RCV.rule): the one number rule. */
export function receiveRule(ordered: number, good: number) {
  const g = Math.max(0, Math.round(+good || 0));
  const o = Math.max(0, Math.round(+ordered || 0));
  return { ordered: o, good: g, received: Math.min(g, o), extra: Math.max(g - o, 0), due: Math.max(o - g, 0) };
}

export interface ReceiveLineData {
  /** Product id. */
  id: string;
  name: string;
  sku: string;
  /** Location name, "Aisle 3". */
  location: string;
  /** Unit word, singular ("bottle", "pc"). */
  unit: string;
  onHand: number;
  /** Reorder level, for the "Low stock 9 to 8" effect. */
  reorder: number;
  ordered: number;
  /** Units still due before this receipt. 0 shows the line as done. */
  stillDue: number;
  /** Unit cost in pesos. Leave out for a clerk: no costs anywhere. */
  cost?: number;
}

export interface ReceivePerson {
  id: string;
  /** Short name ("Berto"); the viewer gets " (you)". */
  name: string;
}

export interface ReceiveStock {
  id: string;
  onHand: number;
  reorder: number;
}

export interface ReceiveLineResult {
  id: string;
  /** Arrived, extra going back to the supplier taken off. */
  got: number;
  damaged: number;
  /** Label of the reason chosen, '' when none applies. */
  why: string;
  damagedWhy: string;
  extraBack: number;
}

export interface ReceiveResult {
  lines: ReceiveLineResult[];
  receivedBy: string;
  deliveryNote: string;
  note: string;
  /** True when the order closes as short. */
  close: boolean;
}

export interface ReceiveFormProps {
  /** "PO-0221"; used in the summary. */
  poNo: string;
  lines: ReceiveLineData[];
  /** Every product's stock level, for the effect on Low stock and Out of stock counts. */
  stock: ReceiveStock[];
  people: ReceivePerson[];
  /** The signed-in person; "Received by" starts here. */
  viewerId: string;
  /** can('accept_variance'): the manager may close an order as short. A clerk sees who does it. */
  canCloseShort?: boolean;
  /** Manager's first name, for the clerk's note ("Berto closes an order as short..."). */
  managerName?: string;
  /** Shown beside the buttons as an alert. The form sets "Nothing is counted yet..." itself when Confirm is pressed with nothing counted. */
  error?: string;
  onConfirm?: (result: ReceiveResult) => void;
  onCancel?: () => void;
  className?: string;
}

const NOTHING = 'Nothing is counted yet. Type how many of each product arrived, or press Cancel if nothing came.';
const peso = (n: number) => '₱' + Math.round(n).toLocaleString('en-PH');
const plural = (n: number, one: string, many?: string) => `${n} ${n === 1 ? one : many || one + 's'}`;
const unitOf = (u: string, n: number) => (u === 'pc' ? 'pc' : n === 1 ? u : u + 's');
const unitWords = (rows: { unit: string; n: number }[]) => {
  const g = new Map<string, number>();
  rows.forEach((r) => g.set(r.unit, (g.get(r.unit) || 0) + r.n));
  const parts = [...g].map(([u, n]) => `${n.toLocaleString('en-PH')} ${u === 'pc' ? 'pc' : n === 1 ? u : u + 's'}`);
  return parts.length < 3 ? parts.join(' and ') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
};

interface LineState {
  got: number;
  bad: number;
  why: string;
  badWhy: string;
}
interface FormState {
  lines: Record<string, LineState>;
  by: string;
  note: string;
  ref: string;
  rest: 'wait' | 'close';
  open: Record<string, boolean>;
}

/** purchase-orders.js 405: one line of a receipt. */
function lnState(l: ReceiveLineData, e: LineState) {
  const out = l.stillDue;
  const got = e.got;
  const bad = Math.min(e.bad || 0, got);
  const r = receiveRule(out, got - bad);
  return { out, got, bad, good: got - bad, short: Math.max(0, out - got), extra: r.extra, due: r.due };
}

function totals(lines: ReceiveLineData[], f: FormState) {
  let units = 0;
  let extra = 0;
  let back = 0;
  let bad = 0;
  let val = 0;
  let left = 0;
  const out = lines.map((l) => {
    const e = f.lines[l.id];
    const s = lnState(l, e);
    const gb = s.extra && e.why === 'back' ? s.extra : 0;
    const kept = s.good - gb;
    const r = receiveRule(s.out, kept);
    units += kept;
    extra += r.extra;
    back += gb;
    bad += s.bad;
    val += kept * (l.cost ?? 0);
    left += r.due;
    return { l, s, e, got: s.got - gb, back: gb, r };
  });
  return { units, extra, back, bad, val, left, lines: out, any: out.some((x) => x.s.got > 0) };
}
type Totals = ReturnType<typeof totals>;

const stockCounts = (ps: ReceiveStock[]) => ({ low: ps.filter((p) => p.onHand > 0 && p.onHand <= p.reorder).length, out: ps.filter((p) => p.onHand <= 0).length });

/** receiving.js RCV.rule.tally (118-124 in the workshop file family): "6 of 9 in, 3 still due"; unlike units are never added. */
function tally(rows: { unit: string; name: string; ordered: number; got: number }[], word: string) {
  const ord = rows.reduce((s, r) => s + r.ordered, 0);
  const rec = rows.reduce((s, r) => s + Math.min(r.got, r.ordered), 0);
  const due = ord - rec;
  if (new Set(rows.map((r) => r.unit)).size <= 1) return `${rec} of ${ord} in${due ? `, ${due} ${word}` : ''}`;
  const full = rows.filter((r) => r.got >= r.ordered);
  const part = rows.filter((r) => r.got < r.ordered);
  const out: string[] = [];
  if (full.length) out.push(`${unitWords(full.map((r) => ({ unit: r.unit, n: r.ordered })))} in`);
  part.forEach((r) => {
    const g = Math.min(r.got, r.ordered);
    const u = unitWords([{ unit: r.unit, n: r.ordered }]).replace(/^[\d,]+ /, '');
    const sw = word === 'short' ? 'short' : 'still due';
    out.push(g > 0 ? `${g} of ${r.ordered} ${u} in, ${r.ordered - g} ${sw} on ${r.name}` : `${r.ordered - g} ${sw} on ${r.name}`);
  });
  return out.join(', ');
}

const fl = 'text-[12px] text-muted';
const tin =
  'block w-full max-w-[480px] h-[34px] px-[10px] border border-control rounded-control bg-surface text-text text-[14px] placeholder:text-muted placeholder:opacity-100 hover:border-muted outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent focus-visible:border-accent max-[640px]:h-[44px] max-[640px]:max-w-none max-[640px]:text-[16px]';
const fr = 'grid grid-cols-[148px_minmax(0,1fr)] items-center gap-x-4 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-y-[6px]';
const frl = 'text-[13px] text-text';
const COLS =
  'grid grid-cols-[minmax(0,1.7fr)_76px_76px_236px_150px] items-center gap-x-5 max-[1099px]:grid-cols-[minmax(0,1.4fr)_64px_64px_220px_130px] max-[1099px]:gap-x-[14px] print:grid-cols-[minmax(0,1fr)_80px_80px_160px]';
const dd = 'max-w-[300px] max-[640px]:max-w-none';
const ddCls = '[&>button]:pl-[10px] [&>button]:pr-2 [&>button]:text-[13px]';

/**
 * Receive form (I11): count what arrived against the order, line by line, with the one number rule, then Confirm.
 * Desktop: the summary and buttons sit in a bar pinned to the bottom of the sheet. Phone: one product per block,
 * 48px steppers, Confirm and Cancel in a bar pinned to the bottom of the screen. Prints as a tally sheet.
 */
export function ReceiveForm({ poNo, lines, stock, people, viewerId, canCloseShort = false, managerName = 'Your manager', error = '', onConfirm, onCancel, className }: ReceiveFormProps) {
  const [f, setF] = useState<FormState>(() => ({
    lines: Object.fromEntries(lines.map((l) => [l.id, { got: l.stillDue, bad: 0, why: '', badWhy: DAMAGED_REASONS[0] }])),
    by: viewerId,
    note: '',
    ref: '',
    rest: 'wait',
    open: {},
  }));
  const [err, setErr] = useState(error);
  useEffect(() => setErr(error), [error]);
  const t = totals(lines, f);
  const mg = canCloseShort;
  const closing = f.rest === 'close' && mg && t.left > 0;

  const patchLine = (id: string, p: Partial<LineState>) => setF((s) => ({ ...s, lines: { ...s.lines, [id]: { ...s.lines[id], ...p } } }));

  /** purchase-orders.js 585-596 (setGot) */
  const setGot = (l: ReceiveLineData, v: number) => {
    setF((s) => {
      const e = { ...s.lines[l.id] };
      e.got = Math.max(0, Math.min(99999, Math.round(v) || 0));
      if (e.bad > e.got) e.bad = e.got;
      const st = lnState(l, e);
      if (!st.short && !st.extra) e.why = '';
      else if (st.short && !SHORT_REASONS.some((o) => o[0] === e.why)) e.why = 'later';
      else if (st.extra && !EXTRA_REASONS.some((o) => o[0] === e.why)) e.why = 'keep';
      return { ...s, rest: st.short && e.why === 'never' && mg ? 'close' : s.rest, lines: { ...s.lines, [l.id]: e } };
    });
    setErr((x) => (x && v > 0 ? '' : x));
  };

  /** purchase-orders.js 726 (why changed) */
  const setWhy = (id: string, why: string) =>
    setF((s) => {
      let rest = s.rest;
      if (why === 'never' && mg) rest = 'close';
      else if ((why === 'later' || why === 'ask') && s.rest === 'close') rest = 'wait';
      return { ...s, rest, lines: { ...s.lines, [id]: { ...s.lines[id], why } } };
    });

  /** purchase-orders.js 551-556 (syncRest): "Close as short" means the rest will not come. */
  const setRest = (v: 'wait' | 'close') =>
    setF((s) => {
      const close = v === 'close' && mg;
      const next = { ...s.lines };
      lines.forEach((l) => {
        const e = next[l.id];
        const st = lnState(l, e);
        if (!st.short) return;
        if (close && e.why !== 'never') next[l.id] = { ...e, why: 'never' };
        else if (!close && e.why === 'never') next[l.id] = { ...e, why: 'later' };
      });
      return { ...s, rest: v, lines: next };
    });

  const stay = (tt: Totals) => {
    const w = tally(
      tt.lines.map((x) => ({ unit: x.l.unit, name: x.l.name, ordered: x.l.ordered, got: x.l.ordered - x.r.due })),
      closing ? 'short' : 'still due',
    );
    return tt.left ? (closing ? `${poNo} is closed as short: ${w}.` : `${poNo} stays Part in: ${w}.`) : tt.any ? `${poNo} becomes Received: ${w}.` : '';
  };

  const confirm = () => {
    if (!t.any) {
      setErr(NOTHING);
      return;
    }
    const why = (e: LineState) => ([...SHORT_REASONS, ...EXTRA_REASONS].find((o) => o[0] === e.why) || [0, ''])[1] as string;
    onConfirm?.({
      lines: t.lines.map((x) => ({ id: x.l.id, got: x.got, damaged: x.s.bad, why: x.s.short || x.s.extra ? why(x.e) : '', damagedWhy: x.s.bad ? x.e.badWhy || DAMAGED_REASONS[0] : '', extraBack: x.back })),
      receivedBy: f.by,
      deliveryNote: f.ref.trim(),
      note: f.note.trim(),
      close: closing,
    });
  };

  const btnLabel = closing ? 'Confirm and close as short' : t.any && t.units > 0 ? (new Set(lines.map((l) => l.unit)).size > 1 ? 'Confirm: add to stock' : `Confirm: add ${t.units} to stock`) : 'Confirm receipt';

  const add = Object.fromEntries(t.lines.map((x) => [x.l.id, x.got - x.s.bad]));
  const before = stockCounts(stock);
  const after = stockCounts(stock.map((p) => ({ ...p, onHand: p.onHand + (add[p.id] || 0) })));
  const money = lines.some((l) => l.cost != null);

  const summary = (): ReactNode => {
    const parts: string[] = [];
    const goes = (() => {
      const rows = t.lines.map((x) => ({ unit: x.l.unit, n: x.got - x.s.bad - x.back })).filter((r) => r.n > 0);
      const one = rows.length === 1 && rows[0].n === 1;
      return `${unitWords(rows)} ${one ? 'goes' : 'go'} into stock`;
    })();
    const head = t.any ? (
      <>
        <b>{goes}</b>
        {t.bad ? `, ${t.bad} damaged and not added` : ''}
        {money && t.val ? ` (${peso(t.val)} at cost)` : ''}.
      </>
    ) : (
      <>
        <b>Nothing counted yet.</b> Type what arrived next to each product.
      </>
    );
    if (t.extra) parts.push(`${plural(t.extra, 'extra unit')} ${t.extra === 1 ? 'is' : 'are'} kept and not counted in the order.`);
    if (t.back) parts.push(`${plural(t.back, 'extra unit')} ${t.back === 1 ? 'goes' : 'go'} back to the supplier.`);
    const ch = [before.low !== after.low && `Low stock ${before.low} to ${after.low}`, before.out !== after.out && `out of stock ${before.out} to ${after.out}`].filter(Boolean) as string[];
    if (t.any && ch.length) parts.push(`${ch.join(', ').replace(/^./, (c) => c.toUpperCase())}.`);
    const s = stay(t);
    return (
      <>
        <p className="[&_b]:font-semibold">
          {head}
          {parts.length ? ` ${parts.join(' ')}` : ''}
        </p>
        {s ? <p className="mt-1 text-muted">{s}</p> : null}
      </>
    );
  };

  const whyBlocks = (x: Totals['lines'][number]): ReactNode => {
    const { s, e, l } = x;
    const id = l.id;
    const out: ReactNode[] = [];
    if (s.short)
      out.push(
        <div key="s" className="flex min-w-0 flex-col gap-1">
          <span className={fl} id={`lw-${id}`}>Why is it short?</span>
          <div className="min-w-[250px] max-[640px]:w-full max-[640px]:min-w-0">
            <Select size="sm" className={ddCls} aria-labelledby={`lw-${id}`} value={e.why && SHORT_REASONS.some((o) => o[0] === e.why) ? e.why : 'later'} onValueChange={(v) => setWhy(id, v)} options={SHORT_REASONS.map(([value, label]) => ({ value, label }))} />
          </div>
        </div>,
      );
    if (s.extra)
      out.push(
        <div key="e" className="flex min-w-0 flex-col gap-1">
          <span className={fl} id={`lw-${id}`}>What about the extra?</span>
          <div className="min-w-[250px] max-[640px]:w-full max-[640px]:min-w-0">
            <Select size="sm" className={ddCls} aria-labelledby={`lw-${id}`} value={e.why && EXTRA_REASONS.some((o) => o[0] === e.why) ? e.why : 'keep'} onValueChange={(v) => setWhy(id, v)} options={EXTRA_REASONS.map(([value, label]) => ({ value, label }))} />
          </div>
        </div>,
      );
    if (s.got > 0 && (f.open[id] || e.bad))
      out.push(
        <div key="b" data-damaged={id} className="flex min-w-0 scroll-mb-24 flex-row flex-wrap items-center gap-x-3 gap-y-2">
          <span className={cn(fl, 'flex-[0_0_100%]')} id={`lb-${id}`}>How many are damaged?</span>
          <QuantityStepper look="damaged" min={0} max={s.got} productName={`damaged ${l.name}`} value={e.bad || 0} onValueChange={(v) => patchLine(id, { bad: v })} />
          {e.bad ? (
            <span className="min-w-[220px] max-[640px]:w-full max-[640px]:min-w-0">
              <Select size="sm" className={ddCls} aria-label="What is wrong with them" value={e.badWhy || DAMAGED_REASONS[0]} onValueChange={(v) => patchLine(id, { badWhy: v })} options={DAMAGED_REASONS.map((value) => ({ value, label: value }))} />
            </span>
          ) : null}
          <span className="text-[12px] text-muted">Damaged ones are not added to stock.</span>
        </div>,
      );
    return out;
  };

  const resText = (x: Totals['lines'][number]): ReactNode => {
    const { s, back } = x;
    if (s.out === 0 && s.got === 0) return <span className="text-muted">Already in</span>;
    if (s.got === 0) return <span className="text-muted">Not arrived</span>;
    const main = s.short ? (
      <span className="font-semibold">{s.due} still due</span>
    ) : s.extra ? (
      <span className="font-semibold">{s.extra} extra{back ? ', going back' : ''}</span>
    ) : s.due ? (
      <span className="font-semibold">{s.due} still due</span>
    ) : (
      <span className="text-text">All in</span>
    );
    return (
      <>
        {main}
        {s.bad ? <span className="mt-[2px] block text-[13px] font-normal leading-[18px] text-muted">{s.bad} damaged, not added</span> : null}
      </>
    );
  };

  // Phone: a control that opens under the finger must not end up behind the pinned bar.
  const needKey = t.lines.map((x) => `${x.s.short ? 's' : x.s.extra ? 'e' : ''}${x.s.got > 0 && (f.open[x.l.id] || x.e.bad) ? 'b' : ''}`).join('|');
  const rootRef = useRef<HTMLDivElement>(null);
  const firstKey = useRef(needKey);
  useEffect(() => {
    if (firstKey.current === needKey) return;
    firstKey.current = needKey;
    if (typeof window === 'undefined' || !window.matchMedia?.('(max-width: 640px)').matches) return;
    rootRef.current?.querySelectorAll<HTMLElement>('[data-damaged]').forEach((el) => el.scrollIntoView?.({ block: 'nearest' }));
  }, [needKey]);

  const whoOptions = people.map((p) => ({ value: p.id, label: p.name + (p.id === viewerId ? ' (you)' : '') }));

  const btns = (cls?: string) => (
    <>
      <Button variant="primary" leftIcon={Check} actionBar className={cls} onClick={confirm}>
        {btnLabel}
      </Button>
      <Button variant="secondary" actionBar className={cls} onClick={onCancel}>
        Cancel
      </Button>
    </>
  );

  return (
    <div ref={rootRef} className={cn('text-[14px] max-[640px]:pb-28', className)}>
      <div role="group" aria-label="Lines to receive" className="mt-5 min-[641px]:mt-0">
        <div aria-hidden="true" className={cn(COLS, '-mx-2 border-b border-border px-2 pb-[10px] text-[12px] text-muted max-[640px]:hidden [&>span:nth-child(2)]:text-right [&>span:nth-child(3)]:text-right [&>span:nth-child(5)]:text-right print:[&>span:nth-child(4)]:text-left')}>
          <span>Product</span>
          <span>Ordered</span>
          <span>Still due</span>
          <span>
            <i className="not-italic print:hidden">Arrived</i>
            <i className="hidden not-italic print:inline">Counted</i>
          </span>
          <span className="print:hidden">Result</span>
        </div>
        {t.lines.map((x, i) => {
          const { l, s, e } = x;
          const id = l.id;
          const row = cn(COLS, 'mx-[-8px] px-2 py-4 max-[640px]:mx-0 max-[640px]:grid-cols-2 max-[640px]:gap-y-3 max-[640px]:px-0 max-[640px]:py-5 print:break-inside-avoid print:py-[10px]', i > 0 && 'border-t border-rule');
          const prod = (
            <div className="max-[640px]:col-span-full">
              <span className="block text-[14px] font-medium leading-5">{l.name}</span>
              <span className="mt-[3px] block text-[13px] font-normal leading-[18px] text-muted">
                <span className="font-mono text-[12px] tracking-normal">{l.sku}</span> · {l.location}
                {s.out === 0 ? '' : ` · ${l.onHand} on hand`}
              </span>
            </div>
          );
          const num = (k: string, v: number) => (
            <div className="text-right text-[14px] tabular-nums max-[640px]:text-left">
              <span className="hidden text-[12px] text-muted max-[640px]:block">{k}</span>
              <b className="font-semibold">{v}</b>
            </div>
          );
          if (s.out === 0)
            return (
              <div key={id} data-rl={id} className={row}>
                <div className="max-[640px]:col-span-full">
                  <span className="block text-[14px] font-normal leading-5 text-muted">{l.name}</span>
                  <span className="mt-[3px] block text-[13px] font-normal leading-[18px] text-muted">
                    <span className="font-mono text-[12px] tracking-normal">{l.sku}</span> · {l.location}
                  </span>
                </div>
                {num('Ordered', l.ordered)}
                {num('Still due', 0)}
                <div className="col-[4/6] text-[13px] text-muted max-[640px]:col-span-full print:col-[3/5]">All {l.ordered} are in already. Nothing to count.</div>
              </div>
            );
          return (
            <div key={id} data-rl={id} className={row}>
              {prod}
              {num('Ordered', l.ordered)}
              {num('Still due', s.out)}
              <div className="flex items-center gap-[10px] max-[640px]:col-span-full max-[640px]:flex-wrap print:hidden">
                <label className="hidden text-[12px] text-muted max-[640px]:block max-[640px]:flex-[0_0_100%]" htmlFor={`g-${id}`}>
                  Arrived<span className="hidden max-[640px]:inline">, {unitOf(l.unit, e.got)}</span>
                </label>
                <QuantityStepper look="receive" min={0} max={99999} productName={l.name} value={e.got} onValueChange={(v) => setGot(l, v)} className="max-[640px]:w-full" />
                <span className="text-[13px] text-muted max-[640px]:hidden">{unitOf(l.unit, e.got)}</span>
              </div>
              <div id={`res-${id}`} aria-live="polite" className="text-right text-[14px] font-medium max-[640px]:col-span-full max-[640px]:text-left max-[640px]:text-[15px] print:hidden">
                {resText(x)}
              </div>
              <div aria-hidden="true" className="hidden print:col-[4] print:block">
                <span className="block h-7 border-b border-black" />
              </div>
              <div id={`why-${id}`} className="col-[1/4] row-start-2 mt-3 flex flex-wrap gap-x-6 gap-y-3 empty:hidden max-[640px]:col-span-full max-[640px]:row-auto max-[640px]:mt-0 max-[640px]:flex-col print:hidden">
                {whyBlocks(x)}
              </div>
              <div className="col-[4/6] row-start-2 mt-2 text-[13px] empty:hidden max-[640px]:col-span-full max-[640px]:row-auto max-[640px]:mt-0 print:hidden">
                {s.got === 0 || f.open[id] || e.bad ? null : (
                  <button type="button" className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-[4px] px-1 text-[12px] font-semibold text-accent max-[640px]:min-h-[44px]" onClick={() => setF((st) => ({ ...st, open: { ...st.open, [id]: true } }))}>
                    Some are damaged
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex max-w-[720px] flex-col gap-4 print:hidden">
        <div className={fr}>
          <span className={frl} id="rcv-by">Received by</span>
          <div className={dd}>
            <Select size="sm" className={ddCls} aria-labelledby="rcv-by" value={f.by} onValueChange={(v) => setF((s) => ({ ...s, by: v }))} options={whoOptions} />
          </div>
        </div>
        <div className={fr}>
          <label className={frl} htmlFor="rcv-ref">Delivery note no.</label>
          <input className={tin} id="rcv-ref" type="text" maxLength={30} value={f.ref} placeholder="Optional, from the supplier's paper" autoComplete="off" onChange={(e) => setF((s) => ({ ...s, ref: e.target.value }))} />
        </div>
        <div className={cn(fr, 'items-start')}>
          <label className={frl} htmlFor="rcv-note">Receiving note</label>
          <textarea
            className={cn(tin, 'h-auto min-h-16 resize-y px-[10px] py-2 font-[inherit] text-[14px] leading-5 max-[640px]:text-[14px]')}
            id="rcv-note"
            rows={2}
            maxLength={240}
            value={f.note}
            placeholder="For example: two boxes dented, driver left at 8:40."
            onChange={(e) => setF((s) => ({ ...s, note: e.target.value }))}
          />
        </div>
        {t.left ? (
          <div className={cn(fr, 'items-start')}>
            <span className={frl}>What about the rest?</span>
            <div className="justify-self-start max-[640px]:w-full">
              <SegmentedControl
                aria-label="What about the rest"
                value={mg ? f.rest : 'wait'}
                onChange={(v) => setRest(v as 'wait' | 'close')}
                options={[
                  { value: 'wait', label: 'Wait for the rest' },
                  { value: 'close', label: 'Close as short', disabled: !mg },
                ]}
              />
            </div>
            {mg ? null : <span className="col-start-2 mt-2 text-[13px] text-muted max-[640px]:col-start-1">{managerName} closes an order as short. Until then it stays Part in.</span>}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          'mt-9 max-w-[720px] border-t border-text pt-4 text-[14px] leading-[21px] max-[640px]:mt-7 print:hidden',
          'min-[641px]:sticky min-[641px]:bottom-0 min-[641px]:z-[4] min-[641px]:-mx-pad min-[641px]:mb-[-32px] min-[641px]:mt-8 min-[641px]:flex min-[641px]:max-w-none min-[641px]:items-center min-[641px]:justify-between min-[641px]:gap-x-8 min-[641px]:gap-y-4 min-[641px]:bg-surface min-[641px]:px-pad min-[641px]:pb-4 min-[641px]:pt-[14px]',
        )}
      >
        <div className="min-w-0 max-w-[780px]">
          <h2 className="m-0 pb-[6px] text-[13px] font-semibold min-[641px]:text-[12px] min-[641px]:font-normal min-[641px]:text-muted">This receipt</h2>
          <div role="status">{summary()}</div>
          <p role="alert" hidden={!err} className="mt-[10px] font-medium text-bad min-[641px]:mt-[6px]">{err}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 max-[640px]:hidden min-[641px]:m-0 min-[641px]:flex-none min-[641px]:flex-nowrap">{btns()}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[25] hidden gap-2 bg-frame px-4 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] max-[640px]:flex print:hidden">{btns('flex-1 text-[14px]')}</div>
    </div>
  );
}
