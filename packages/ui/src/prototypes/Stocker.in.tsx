import { useState, type ReactNode } from 'react';
import { ArrowCounterClockwise, Barcode, Check, CheckCircle, CaretRight, Minus, Plus, Truck } from '@phosphor-icons/react';
import { StockerRow, StockerId, StockerStatus } from '../components/StockerRow';
import { BarcodeSheet, type BarcodeProduct } from '../components/BarcodeSheet';
import { cn } from '../utils/cn';
import { StockerActs, StockerButton, StockerEmpty, StockerPageFrame, StockerSection, StockerSkeleton, StockerError } from './Stocker.frame';
import { stockerData, type Stocker, type StockerParams, type SProduct } from './Stocker.data';

/*
 * RDY-431. Stocker Stock in (3/6 c). Transcribed from inventory-home round-1/final stocker.js 447-616 (inPage 449, inOther 470, lineHTML 508, lineCalc 520, noteHTML 524,
 * counter 532, receiveView 554, checkInView 591), 99-100 + 131-133 (rows), 159-170 (scanBtn, likely, pickRow, selected), 179 (stepper), 182-196 (doneView);
 * stocker.css 77-83 (.paths .path), 92-95 (.sb disabled, .va), 105-111 (.tin .lbl), 136-143 (.rs .r), 146-153 (.stp .stp-w), 165-175 (.ln), 180-184 (.bar .sum), 201-202 (.done), 208 (<=360px).
 * GAP: the workshop keeps the receipt, the "told your manager" note and the Undo snapshot in browser state (R.add, R.tell, R.restore, sessionStorage flash). The sample here
 *      keeps the counting live but the confirm button only shows the done screen (?done=1) with the workshop's wording; Undo does nothing in a story.
 * GAP: ?done=1 with no saved flash shows nothing in the workshop; the story shows the "something else arrived" done screen with the first low-stock product.
 * GAP: the workshop stepper (.stp, min 0, 56px tap) differs from I9 QuantityStepper (min 1); built locally with the .stp values.
 */

const BADW = ['Broken or leaking', 'Wrong item', 'Expired or close to expiry', 'Other'];
const MAXQ = 9999;
const clampQty = (n: number, raw: string) => (raw === '' || !Number.isFinite(n) || n < 1 ? 1 : n > MAXQ ? MAXQ : n);
const rule = (ordered: number, good: number) => { const g = Math.max(0, Math.round(+good || 0)), o = Math.max(0, Math.round(+ordered || 0)); return { ordered: o, good: g, received: Math.min(g, o), extra: Math.max(g - o, 0), due: Math.max(o - g, 0) }; };

type Mode = 'unset' | 'all' | 'count';
interface LineState { mode: Mode; got: number; bad: number; badWhy: string }
const fresh = (): LineState => ({ mode: 'unset', got: 0, bad: 0, badWhy: BADW[0] });
interface CLine { p: string; product: SProduct; ordered?: number; received?: number; out?: number; qty?: number }

const sbBase = 'inline-flex min-h-[var(--tap-big)] w-full items-center justify-center gap-2.5 rounded-[8px] px-5 text-center text-[16px] font-semibold leading-[22px] transition-colors duration-[120ms] [&_svg]:h-5 [&_svg]:w-5';
const sbPrimary = 'bg-accent text-accent-ink hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-raised-2 disabled:text-muted disabled:hover:bg-raised-2';
const sbSecondary = 'border-[1.5px] border-control bg-surface text-text hover:border-muted';
const ring = 'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
function Sb({ primary, className, children, ...rest }: { primary?: boolean; className?: string; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...rest} className={cn(sbBase, primary ? sbPrimary : sbSecondary, ring, className)}>{children}</button>;
}
/** .va: an accent text button. */
function Va({ className, children, ...rest }: { className?: string; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...rest} className={cn('inline-flex min-h-[var(--tap)] items-center gap-1.5 rounded-[4px] px-1 text-[15px] font-semibold text-accent hover:text-lk-hover [&_svg]:h-3.5 [&_svg]:w-3.5', ring, className)}>{children}</button>;
}
/** shell.css:70 .id (13px) as used in the page lead, where stocker.css has no 12px override. */
const LeadId = ({ children }: { children: ReactNode }) => <span className="font-mono text-[13px] tracking-[0]">{children}</span>;
const Note = ({ children }: { children: ReactNode }) => <p className="mt-2 text-[13px] leading-[19px] text-muted [&_b]:font-semibold [&_b]:text-text">{children}</p>;
const Lbl = ({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) => <label htmlFor={htmlFor} className="mt-5 block text-[15px] font-semibold [&_small]:text-[13px] [&_small]:font-normal [&_small]:text-muted">{children}</label>;
const tin = 'min-h-[var(--tap-big)] w-full rounded-[8px] border-[1.5px] border-control bg-surface px-[14px] text-[16px] text-text placeholder:text-faint focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';

/** .stp: minus, number, plus (stocker.css 146-151). */
function Stepper({ id, value, label, onValue }: { id: string; value: number | ''; label: string; onValue: (v: number | '') => void }) {
  const step = (by: number) => onValue(Math.max(0, Math.min(99999, (+value || 0) + by)));
  const sb = 'grid place-items-center bg-raised text-[20px] text-text hover:bg-raised-2 ' + ring;
  return (
    <span className="inline-grid h-[var(--tap-big)] grid-cols-[var(--tap-big)_88px_var(--tap-big)] overflow-hidden rounded-[8px] border-[1.5px] border-control bg-surface max-[360px]:grid-cols-[var(--tap-big)_76px_var(--tap-big)]">
      <button type="button" aria-label={`One less ${label}`} onClick={() => step(-1)} className={sb}><Minus aria-hidden="true" /></button>
      <input id={id} type="number" inputMode="numeric" min={0} step={1} value={value} placeholder="0" aria-label={label} onChange={(e) => onValue(e.target.value === '' ? '' : Math.max(0, Math.min(99999, Math.round(+e.target.value) || 0)))}
        className="w-full appearance-none border-0 bg-surface p-0 text-center text-[20px] font-semibold tabular-nums text-text [-moz-appearance:textfield] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-[3px] focus-visible:outline-accent [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      <button type="button" aria-label={`One more ${label}`} onClick={() => step(1)} className={sb}><Plus aria-hidden="true" /></button>
    </span>
  );
}
const StpW = ({ children }: { children: ReactNode }) => <div className="mt-2 flex flex-wrap items-center gap-3">{children}</div>;
const Unit = ({ children, id }: { children: ReactNode; id?: string }) => <span id={id} className="text-[15px] text-muted">{children}</span>;

/** .rs / .r: the radio rows of "what is wrong". */
function Radios({ name, value, onValue }: { name: string; value: string; onValue: (w: string) => void }) {
  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const n = (i + (/Down|Right/.test(e.key) ? 1 : BADW.length - 1)) % BADW.length;
    onValue(BADW[n]);
    requestAnimationFrame(() => (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus());
  };
  return (
    <div role="radiogroup" aria-label={name} className="mt-2 border-t border-border">
      {BADW.map((w, i) => (
        <button key={w} type="button" role="radio" aria-checked={value === w} tabIndex={value === w ? 0 : -1} onClick={() => onValue(w)} onKeyDown={(e) => onKey(e, i)}
          className={cn('group/r grid min-h-[48px] w-full grid-cols-[22px_minmax(0,1fr)] items-start gap-x-3 border-b border-rule py-2 text-left hover:bg-raised', ring)}>
          <span className={cn('relative mt-px h-5 w-5 rounded-full border-2 bg-surface', value === w ? 'border-accent after:absolute after:inset-[3px] after:rounded-full after:bg-accent' : 'border-control')} />
          <span><b className="block text-[15px] font-semibold leading-[22px]">{w}</b></span>
        </button>
      ))}
    </div>
  );
}

function calc(l: CLine, st: LineState, kind: 'po' | 'tr') {
  const out = (kind === 'po' ? l.out : l.qty) as number;
  const got = st.mode === 'all' ? out : st.mode === 'count' ? st.got : 0;
  const bad = kind === 'po' && st.mode === 'count' ? Math.min(st.bad, got) : 0;
  return { out, got, bad, ...rule(out, got - bad) };
}
function LineNote({ l, st, kind }: { l: CLine; st: LineState; kind: 'po' | 'tr' }) {
  const c = calc(l, st, kind), bits: string[] = [];
  if (c.bad) bits.push(`${c.bad} damaged, not added`);
  if (kind === 'po') { if (c.due) bits.push(`${c.due} still due`); if (c.extra) bits.push(`${c.extra} extra, kept in stock`); } else if (c.due) bits.push(`${c.due} short`);
  return bits.length ? <><b>{c.got} arrived.</b> {bits.join('. ')}.</> : <><b>{c.got} arrived.</b> All here.</>;
}

function Line({ s, l, st, kind, set }: { s: Stocker; l: CLine; st: LineState; kind: 'po' | 'tr'; set: (n: LineState) => void }) {
  const p = l.product, out = (kind === 'po' ? l.out : l.qty) as number;
  const sub = kind === 'po' ? `Ordered ${l.ordered}${l.received ? `, ${l.received} in already` : ', none in yet'}` : `Sent ${l.qty}`;
  const goCount = () => { if (st.mode !== 'count') set({ ...st, got: calc(l, { ...fresh(), mode: 'all' }, kind).out, mode: 'count' }); };
  const setField = (which: 'got' | 'bad', v: number | '') => { const n = { ...st, [which]: v === '' ? 0 : v } as LineState; if (n.bad > n.got) n.bad = n.got; set(n); };
  return (
    <section aria-label={p.name} className="border-b border-rule py-[14px]">
      <div className="text-[16px] font-semibold leading-[22px]">{p.name}</div>
      <div className="mt-px text-[13px] leading-[19px] text-muted"><span className="font-mono text-[12px]">{p.sku}</span> · {kind === 'po' ? 'Put in ' + s.loc(p) : s.loc(p)}</div>
      <div className="mt-px text-[13px] leading-[19px] text-muted">{sub}{kind === 'po' ? <>, <b>{out} still due</b></> : null}</div>
      {st.mode === 'unset' ? (
        <div className="mt-2.5 grid grid-cols-[2fr_1fr] gap-2.5">
          <Sb primary onClick={() => set({ mode: 'all', got: 0, bad: 0, badWhy: BADW[0] })}>All {out} here</Sb>
          <Sb onClick={goCount}>Not all</Sb>
        </div>
      ) : st.mode === 'all' ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="inline-flex min-h-[var(--tap)] items-center gap-2 text-[16px] font-semibold"><CheckCircle aria-hidden="true" className="h-5 w-5 text-accent" />{out} here</span>
          <Va onClick={goCount}>Change</Va>
        </div>
      ) : (
        <div>
          <label htmlFor={`got-${l.p}`} className="mt-2.5 block text-[15px] font-semibold">How many arrived?</label>
          <StpW><Stepper id={`got-${l.p}`} value={st.got} label="How many arrived" onValue={(v) => setField('got', v)} /><Unit>{s.unitOf(p, st.got || 2)}</Unit></StpW>
          {kind === 'po' ? (
            <>
              <label htmlFor={`bad-${l.p}`} className="mt-2.5 block text-[15px] font-semibold">How many of those are damaged?</label>
              <StpW><Stepper id={`bad-${l.p}`} value={st.bad} label="How many are damaged" onValue={(v) => setField('bad', v)} /></StpW>
              {st.bad > 0 ? <Radios name="What is wrong with them" value={st.badWhy} onValue={(w) => set({ ...st, badWhy: w })} /> : null}
            </>
          ) : null}
          <p className="mt-2 text-[13px] leading-[19px] text-muted [&_b]:font-semibold [&_b]:text-text"><LineNote l={l} st={st} kind={kind} /></p>
          <Va onClick={() => set(fresh())}>Clear, count later</Va>
        </div>
      )}
    </section>
  );
}

/** receiving.js 100 (goesInL). */
const goesInL = (s: Stocker, rows: { product: SProduct; n: number }[]) => { const ls = rows.filter((r) => r.n > 0), one = ls.length === 1 && ls[0].n === 1; return `${s.unitWords(ls)} ${one ? 'goes' : 'go'} into stock`; };

/** .bar contents: the plain sentence and the one button. */
function BarBody({ sum, label, disabled, onClick, span }: { sum: ReactNode; label: ReactNode; disabled: boolean; onClick: () => void; span?: boolean }) {
  return (
    <>
      <p role="status" aria-live="polite" className="mb-2 text-[14px] leading-5 text-text [&_.mut]:text-muted [&_b]:font-semibold [&_.bad]:text-bad">{sum}</p>
      <Sb primary disabled={disabled} onClick={onClick}><Check aria-hidden="true" />{span ? <span>{label}</span> : label}</Sb>
    </>
  );
}

const asBarcode = (s: Stocker, p: SProduct): BarcodeProduct => ({ id: p.id, name: p.name, sku: p.sku, barcode: p.barcode, unit: p.unit, onHand: p.onHand, location: s.loc(p) });

function PickRow({ s, p, onPick }: { s: Stocker; p: SProduct; onPick: (id: string) => void }) {
  const st = s.stOf(p);
  return <StockerRow onClick={() => onPick(p.id)} what={p.name} where={<><StockerId>{p.sku}</StockerId> · {s.loc(p)}{st ? <> · <StockerStatus state={st === 'Out of stock' ? 'out' : 'low'} /></> : null}</>} qty={{ value: p.onHand, unit: s.unitOf(p, p.onHand) }} />;
}
function Likely({ s, onPick }: { s: Stocker; onPick: (id: string) => void }) {
  const out = s.d.products.filter((p) => p.onHand === 0);
  const low = s.d.products.filter((p) => p.onHand > 0 && p.onHand <= p.reorder).sort((a, b) => a.onHand / a.reorder - b.onHand / b.reorder);
  const l = out.concat(low).slice(0, 5);
  return l.length ? <><p className="mt-4 text-[13px] leading-[19px] text-muted">Products that need stock</p><div>{l.map((p) => <PickRow key={p.id} s={s} p={p} onPick={onPick} />)}</div></> : null;
}
function Selected({ s, p, onChange }: { s: Stocker; p: SProduct; onChange: () => void }) {
  const st = s.stOf(p);
  return (
    <div className="grid min-h-[64px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-rule py-[10px]">
      <span>
        <span className="block text-[15px] font-semibold leading-[21px]">{p.name}</span>
        <span className="mt-px block text-[13px] leading-[19px] text-muted"><StockerId>{p.sku}</StockerId> · {s.loc(p)} · {p.onHand} {s.unitOf(p, p.onHand)} on hand{st ? <> · <StockerStatus state={st === 'Out of stock' ? 'out' : 'low'} /></> : null}</span>
      </span>
      <Va onClick={onChange}>Change</Va>
    </div>
  );
}

export interface StockerFlash { title: string; text: string; sub?: string; again?: { href: string; label: string }; undoable?: boolean }

/** doneView (stocker.js 182-196). */
export function StockerDone({ s, fl }: { s: Stocker; fl: StockerFlash }) {
  return (
    <StockerPageFrame s={s} page="in" title={fl.title}>
      <div className="mt-7"><span className="grid h-12 w-12 place-items-center rounded-full border-2 border-accent text-[26px] text-accent"><Check aria-hidden="true" /></span></div>
      <p className="mt-1 text-[15px] leading-[22px]"><b className="font-semibold">{fl.text}</b></p>
      {fl.sub ? <Note>{fl.sub}</Note> : null}
      <StockerActs>
        {fl.again ? <StockerButton primary href={fl.again.href}>{fl.again.label}</StockerButton> : null}
        <StockerButton href={s.href('stocker.html')}>Back to Home</StockerButton>
        {fl.undoable ? <Va className="justify-center"><ArrowCounterClockwise aria-hidden="true" />Undo this</Va> : null}
      </StockerActs>
    </StockerPageFrame>
  );
}

/** (a) What arrived? (inPage 449-469). */
function Landing({ s }: { s: Stocker }) {
  const F = s.flags, dl = s.deliveries(), tc = s.toCheck();
  const plr = s.plural;
  const row = 'group/path grid min-h-[84px] w-full grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-[14px] border-b border-rule py-[14px] text-left text-text ' + ring;
  return (
    <StockerPageFrame s={s} page="in" title="What arrived?" steps={{ n: 1, of: 3, label: 'Say what kind of delivery it is' }} lead="Choose one. You can only add stock to products that are already set up.">
      {F.loading ? <StockerSkeleton n={5} /> : (
        <>
          <div role="list" className="mt-[14px] border-t border-border">
            <div role="listitem"><a className={row} href={s.href('stocker-in.html', { via: 'order' })}>
              <Truck aria-hidden="true" className="h-[26px] w-[26px] text-accent" />
              <span>
                <span className="block text-[16px] font-semibold leading-[22px] group-hover/path:text-lk-hover">It is on an order</span>
                <span className="mt-0.5 block text-[13px] leading-[19px] text-muted">A delivery we ordered, or a transfer from another branch. You tick each line.{dl.length + tc.length ? ` Waiting: ${plr(dl.length, 'order')}${tc.length ? ` and ${plr(tc.length, 'transfer')}` : ''}.` : ' Nothing is waiting right now.'}</span>
              </span>
              <CaretRight aria-hidden="true" className="h-[18px] w-[18px] text-accent" />
            </a></div>
            <div role="listitem"><a className={row} href={s.href('stocker-in.html', { via: 'other' })}>
              <Barcode aria-hidden="true" className="h-[26px] w-[26px] text-accent" />
              <span>
                <span className="block text-[16px] font-semibold leading-[22px] group-hover/path:text-lk-hover">Something else arrived</span>
                <span className="mt-0.5 block text-[13px] leading-[19px] text-muted">No order. Scan or type the barcode, then say how many.</span>
              </span>
              <CaretRight aria-hidden="true" className="h-[18px] w-[18px] text-accent" />
            </a></div>
          </div>
          <p className="mt-2 text-[13px] leading-[19px] text-muted">New product, never seen before? Scan it. If the system does not know the barcode, you send it to {s.mgr}. They set it up, then your count goes into stock.</p>
        </>
      )}
    </StockerPageFrame>
  );
}

/** (a) Which order or transfer? (stocker.js 453-461). */
function Which({ s }: { s: Stocker }) {
  const F = s.flags, dl = s.deliveries(), tc = s.toCheck();
  return (
    <StockerPageFrame s={s} page="in" title="Which order or transfer?" back={{ href: s.href('stocker-in.html'), label: 'What arrived' }} steps={{ n: 2, of: 3, label: 'Pick the one that arrived' }} lead="Tap the one that matches the paper or the truck.">
      {F.loading ? <StockerSkeleton n={5} /> : F.error ? <StockerError s={s} file="stocker-in.html" o={{ via: 'order' }} /> : (
        <>
          <StockerSection id="o" title="Orders on their way" help="Something we ordered from a supplier." n={dl.length}>
            {dl.length ? dl.map((po) => <StockerRow key={po.no} href={s.href('stocker-in.html', { po: po.no })} what={po.supplierName} where={<><StockerId>{po.no}</StockerId> · {s.when(po)}</>} qty={{ value: s.nLines(po), unit: s.nLines(po) === 1 ? 'product' : 'products' }} go="Receive" />)
              : <StockerEmpty>No order is on its way. If something arrived anyway, go back and choose “Something else arrived”.</StockerEmpty>}
          </StockerSection>
          <StockerSection id="c" title="Transfers to check in" help="Stock another branch sent here." n={tc.length}>
            {tc.length ? tc.map((t) => <StockerRow key={t.id} href={s.href('stocker-in.html', { tr: t.id })} what={`${t.id} from ${t.other.short}`} where={s.tWhat(t)} go="Check in" />) : <StockerEmpty>No transfer is on its way here.</StockerEmpty>}
          </StockerSection>
        </>
      )}
    </StockerPageFrame>
  );
}

/** (b) Something else arrived (inOther 470-505). */
function Other({ s }: { s: Stocker }) {
  const [pid, setPid] = useState<string | undefined>(s.params.p && s.prod(s.params.p) ? s.params.p : undefined);
  const [qty, setQty] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const p = pid ? s.prod(pid) : undefined;
  const n = qty === '' ? null : Math.round(+qty);
  const plan = () => { if (!p) return { blank: true } as const; if (n == null) return { blank: true, need: 'Type how many arrived.' } as const; if (!(n >= 1)) return { err: 'Use 1 or more.' } as const; const q = clampQty(n, String(qty)); return { ok: true, q, after: p.onHand + q } as const; };
  const pl = plan();
  const sum = 'err' in pl ? <span className="bad">{pl.err}</span> : !('ok' in pl) ? <span className="mut">{('need' in pl && pl.need) || ''}</span> : <>Stock goes from <b>{p!.onHand}</b> to <b>{pl.after}</b>. <span className="mut">Recorded as received without an order.</span></>;
  const ok = 'ok' in pl;
  const barcodes = s.d.products.map((x) => asBarcode(s, x));
  if (done && p && 'ok' in pl) {
    return <StockerDone s={s} fl={{ title: 'Stock in recorded', text: `${p.sku}: ${p.onHand} → ${pl.after}.`, sub: `${s.qtyW(p, (pl as { q: number }).q)} received without an order. ${s.Mgr} sees it on Movements.`, again: { href: s.href('stocker-in.html'), label: 'Stock in something else' }, undoable: true }} />;
  }
  return (
    <>
      <StockerPageFrame s={s} page="in" title={p ? 'How many arrived?' : 'Which product arrived?'} back={p ? { href: s.href('stocker-in.html', { via: 'other' }), label: 'Which product' } : { href: s.href('stocker-in.html'), label: 'What arrived' }}
        steps={{ n: p ? 3 : 2, of: 3, label: p ? 'Count them' : 'Find the product' }} lead={p ? 'Count what is in front of you. Not what the paper says.' : 'Scan the barcode on the box, or type it.'}
        bar={p ? <BarBody span sum={sum} disabled={!ok} onClick={() => setDone(true)} label={ok ? `Put ${pl.q} into stock` : 'Put into stock'} /> : undefined}>
        {!p ? (
          <StockerSection id="prod" title="Product" help="Only products that are already set up can be stocked in. If the barcode is new, you send it to your manager to set up.">
            <div className="mt-2.5 grid gap-2"><Sb primary onClick={() => setOpen(true)}><Barcode aria-hidden="true" />Scan or type a barcode</Sb></div>
            <Likely s={s} onPick={setPid} />
          </StockerSection>
        ) : (
          <>
            <StockerSection id="p" title="Product" className="mt-3"><Selected s={s} p={p} onChange={() => { setPid(undefined); setQty(''); }} /></StockerSection>
            <StockerSection id="n" title="How many arrived?" className="mt-6">
              <Note>Put them in {s.loc(p)}.</Note>
              <StpW><Stepper id="qty" value={qty} label="How many arrived" onValue={setQty} /><Unit id="un">{s.unitOf(p, n || 2)}</Unit></StpW>
            </StockerSection>
            <Lbl htmlFor="note">Where did it come from? <small>(optional)</small></Lbl>
            <input id="note" type="text" maxLength={80} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example: brought by the owner" autoComplete="off" className={tin} />
            <Note>This is not on an order. It is recorded as <b>Received without an order</b> with your name, and {s.mgr} sees it.</Note>
          </>
        )}
      </StockerPageFrame>
      <BarcodeSheet open={open} onOpenChange={setOpen} ctx="in" products={barcodes} samples={barcodes.slice(0, 3)} manager={s.mgr}
        onFound={(b) => { setPid(b.id); setOpen(false); }} unknown={(code) => ({ label: 'New product to set up', href: s.href('stocker.html', { np: code, from: 'in' }) })} />
    </>
  );
}

/** (a) Receive an order (receiveView 554-589) and (a) Check in a transfer (checkInView 591-616). */
function Counting({ s, kind }: { s: Stocker; kind: 'po' | 'tr' }) {
  const po = kind === 'po' ? s.deliveries().find((x) => x.no === s.params.po) : undefined;
  const t = kind === 'tr' ? s.transfers().find((x) => x.id === s.params.tr) : undefined;
  const ok = kind === 'po' ? !!po : !!(t && t.status === 'transit' && !t.out);
  const lines: CLine[] = kind === 'po' ? ((po ? po.lines : []) as unknown as { p: string; product: SProduct; ordered: number; received: number; out: number }[]).filter((l) => l.out > 0).map((l) => ({ p: l.p, product: l.product, ordered: l.ordered, received: l.received, out: l.out })) : (t?.lines ?? []).map((l) => ({ p: l.p, product: l.product, qty: l.qty }));
  const [L, setL] = useState<Record<string, LineState>>(() => Object.fromEntries(lines.map((l) => [l.p, fresh()])));
  const [tnote, setTnote] = useState('');
  const [done, setDone] = useState(false);
  const Mgr = s.Mgr, mgr = s.mgr;
  const back = { href: s.href('stocker-in.html', { via: 'order' }), label: 'Which order' };
  if (!ok) {
    const msg = kind === 'po' ? `${s.params.po} is not open any more. It may be received already.` : t ? `${t.id} is ${t.status === 'received' ? 'checked in already' : t.out ? 'on its way out, not in' : 'not on its way yet'}.` : 'That transfer is not here.';
    return (
      <StockerPageFrame s={s} page="in" title={kind === 'po' ? 'Order' : 'Transfer'} back={back} lead={t ? <><LeadId>{t.id}</LeadId> · a transfer</> : ''}>
        <p className="border-b border-rule py-[14px] text-[15px] leading-[22px] text-muted">{msg}</p>
        <StockerActs><StockerButton href={s.href('stocker.html')}>Back to Home</StockerButton></StockerActs>
      </StockerPageFrame>
    );
  }
  const cs = lines.map((l) => ({ l, s: L[l.p] ?? fresh(), c: calc(l, L[l.p] ?? fresh(), kind) }));
  const set = (p: string) => (n: LineState) => setL((o) => ({ ...o, [p]: n }));
  const plr = s.plural;
  let sum: ReactNode, enabled: boolean, label: ReactNode, fl: StockerFlash;
  if (kind === 'po') {
    const counted = cs.filter((x) => x.s.mode !== 'unset'), any = cs.some((x) => x.c.got > 0);
    const kept = cs.map((x) => ({ product: x.l.product, n: x.c.got - x.c.bad })).filter((x) => x.n > 0);
    const bad = cs.reduce((a, x) => a + x.c.bad, 0), rest = lines.length - counted.length;
    sum = !any ? <span className="mut">Count at least one line first.</span> : <><b>{goesInL(s, kept)}</b>.{bad ? ` ${bad} damaged ${bad === 1 ? 'is' : 'are'} not added.` : ''}{rest ? <> <span className="mut">{plr(rest, 'line')} not counted yet. {rest === 1 ? 'It stays' : 'They stay'} due.</span></> : null}</>;
    enabled = any; label = 'Put into stock';
    const left = cs.reduce((a, x) => a + (x.s.mode === 'unset' ? x.c.out : x.c.due), 0);
    fl = { title: 'Stock in recorded', text: `${po!.no}: ${goesInL(s, kept)}.`, sub: `${bad ? `${bad} damaged ${bad === 1 ? 'was' : 'were'} not added. ` : ''}${left ? `${left} still due on this order. ` : 'The order is complete. '}${bad || left ? `${Mgr} sees it.` : ''}`.trim(), again: { href: s.href('stocker-in.html'), label: 'Receive another' }, undoable: true };
  } else {
    const left = cs.filter((x) => x.s.mode === 'unset').length;
    const kept = cs.map((x) => ({ product: x.l.product, n: x.c.got })).filter((x) => x.n > 0), short = cs.reduce((a, x) => a + (x.s.mode === 'unset' ? 0 : x.c.due), 0);
    sum = left ? <span className="mut">Count every part first. {plr(left, 'part')} left.</span> : kept.length ? <><b>{goesInL(s, kept)}</b>.{short ? ` ${short} short.` : ''}</> : <span className="mut">Nothing arrived. Tell {mgr} instead.</span>;
    enabled = !left && kept.length > 0; label = 'Check in';
    fl = { title: 'Checked in', text: `${t!.id}: ${goesInL(s, kept)}.`, sub: short ? `${short} short. ${Mgr} sees it.` : 'All of it arrived.', again: { href: s.href('stocker-in.html'), label: 'Stock in something else' }, undoable: true };
  }
  if (done) return <StockerDone s={s} fl={fl} />;
  return (
    <StockerPageFrame s={s} page="in" title={po ? `What arrived from ${po.supplierName}?` : `What arrived from ${t!.other.name}?`} back={back} steps={{ n: 3, of: 3, label: kind === 'po' ? 'Count each line' : 'Count each part' }}
      lead={po ? <><LeadId>{po.no}</LeadId> · {s.when(po)}</> : <><LeadId>{t!.id}</LeadId> · a transfer</>}
      bar={<BarBody sum={sum} disabled={!enabled} label={label} onClick={() => setDone(true)} />}>
      <Note>{kind === 'po' ? <>Count what is on the truck. Tap <b>All here</b> when a line is complete. Tap <b>Not all</b> for short, damaged or extra.</> : <>Count each part against the transfer paper. Tap <b>All here</b>, or <b>Not all</b> if some are missing.</>}</Note>
      <div id="lines" className="mt-1">{lines.map((l) => <Line key={l.p} s={s} l={l} st={L[l.p] ?? fresh()} kind={kind} set={set(l.p)} />)}</div>
      {kind === 'po' ? (
        <>
          <Note>{Mgr} settles anything short or damaged. You never close an order.</Note>
          <Lbl htmlFor="tnote">Note for {mgr} <small>(optional)</small></Lbl>
          <textarea id="tnote" maxLength={160} value={tnote} onChange={(e) => setTnote(e.target.value)} placeholder="For example: two boxes missing, the driver says Monday." className={cn(tin, 'min-h-[88px] resize-y py-[10px] font-[inherit] leading-[22px]')} />
          <Note>If something is short or damaged, {mgr} is told, with your note. Nothing is accepted or disputed until your manager decides.</Note>
        </>
      ) : <Note>If something is missing, say so now. The transfer closes as short and {mgr} sees it.</Note>}
    </StockerPageFrame>
  );
}

/** Stocker Stock in: the page for stocker-in.html and its ?via, ?po, ?tr and ?done params. */
export function StockerInPage(params: StockerParams) {
  const s = stockerData(params);
  if (params.done) {
    const p = s.d.products.filter((x) => x.onHand > 0 && x.onHand <= x.reorder)[0] ?? s.d.products[0];
    const q = 2;
    return <StockerDone s={s} fl={{ title: 'Stock in recorded', text: `${p.sku}: ${p.onHand} → ${p.onHand + q}.`, sub: `${s.qtyW(p, q)} received without an order. ${s.Mgr} sees it on Movements.`, again: { href: s.href('stocker-in.html'), label: 'Stock in something else' }, undoable: true }} />;
  }
  if (params.po) return <Counting s={s} kind="po" />;
  if (params.tr) return <Counting s={s} kind="tr" />;
  if (params.via === 'other') return <Other s={s} />;
  if (params.via === 'order') return <Which s={s} />;
  return <Landing s={s} />;
}
