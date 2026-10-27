import { Fragment, forwardRef, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { CaretRight } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { LedaMark } from '../components/Leda';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';

/**
 * Parts of Home's case page that are copied from the workshop prototype (home.js) and not yet in the design system:
 * the day line, Leda's draft well, the "more details" fold. Prototype only: not exported from the package.
 */

const hm = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
export const peso = (n: number) => `₱${Number(n).toLocaleString('en-PH')}`;

/* ---------------- the day line: business hours, now, the due time and any promise ---------------- */

export interface DayLineMark { t: number; label: string; short: string; tone: 'now' | 'bad' | 'ink' }
export interface DayLineProps { open: number; close: number; now: number; window: number; marks: DayLineMark[]; className?: string }

interface Placed extends DayLineMark { a: number; b: number; side: 'R' | 'L'; text: string; r: number }

export function DayLine({ open, close, now, window: win, marks, className }: DayLineProps) {
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => setW(el.clientWidth);
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const aria = `Business hours ${hm(open)} to ${hm(close)}. ${marks.map((m) => m.label).join(', ')}.`;
  let svg: ReactNode = null;
  if (W) {
    const compact = W < 520, t0 = open, t1 = close;
    const x = (t: number) => Math.round(((Math.max(t0, Math.min(t, t1)) - t0) / (t1 - t0)) * W * 10) / 10;
    const xs = marks.map((m) => x(m.t));
    const placed: [number, number][][] = [[], []];
    const labels: Placed[] = [];
    marks.forEach((m, i) => {
      const mx = xs[i]!, wOf = (t: string) => t.length * 6.7 + 10;
      const fits = (a: number, b: number, r: number) => a >= 0 && b <= W && !xs.some((o, j) => j !== i && o > a - 3 && o < b + 3 && r === 0) && !placed[r]!.some(([p, q]) => a < q + 8 && b > p - 8);
      let pick: Omit<Placed, keyof DayLineMark> | null = null;
      for (const text of compact ? [m.short] : [m.label, m.short]) for (const r of [0, 1]) {
        if (pick) break;
        const w = wOf(text);
        if (fits(mx, mx + w, r)) pick = { a: mx, b: mx + w, side: 'R', text, r };
        else if (fits(mx - w, mx, r)) pick = { a: mx - w, b: mx, side: 'L', text, r };
      }
      if (!pick) { const w = wOf(m.short); pick = { a: mx, b: mx + w, side: 'R', text: m.short, r: 1 }; }
      placed[pick.r]!.push([pick.a, pick.b]);
      labels.push({ ...m, ...pick });
    });
    const two = labels.some((l) => l.r === 1), top = two ? 34 : 20, bh = 18, hy = top + bh + 16, H = hy + 4, span = (t1 - t0) / 60;
    const step = W / span >= 56 ? 1 : W / span >= 30 ? 2 : 3;
    const ticks: ReactNode[] = [];
    for (let h = Math.ceil(t0 / 60); h * 60 <= t1; h += step) {
      const anchor = h * 60 === t0 ? 'start' : h * 60 + step * 60 > t1 ? 'end' : 'middle';
      ticks.push(<text key={h} x={x(h * 60)} y={hy} textAnchor={anchor} className="fill-muted">{h}:00</text>);
    }
    svg = (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block h-auto w-full overflow-visible font-sans text-[12px]">
        <rect x={0} y={top} width={W} height={bh} rx={4} className="fill-raised" />
        <rect x={0} y={top} width={x(now)} height={bh} rx={4} className="fill-raised-2" />
        {win > now ? <rect x={x(now)} y={top} width={Math.max(0, x(win) - x(now))} height={bh} className="fill-accent-tint-2" /> : null}
        {labels.map((m, i) => {
          const lx = x(m.t), ly = top - 8 - m.r * 14, bad = m.tone === 'bad';
          return (
            <g key={i}>
              <line x1={lx} y1={ly + 3} x2={lx} y2={top + bh + 3} className={bad ? 'stroke-bad' : 'stroke-text'} strokeWidth={m.tone === 'now' ? 1.25 : 2} />
              <text x={m.side === 'R' ? lx + 5 : lx - 5} y={ly} textAnchor={m.side === 'R' ? undefined : 'end'} className={cn('font-medium', bad ? 'fill-bad' : 'fill-text')}>{m.text}</text>
            </g>
          );
        })}
        {ticks}
      </svg>
    );
  }
  return <div ref={box} className={cn('mt-4', className)}>{svg}</div>;
}

/* ---------------- the "More details" fold ---------------- */

export function MoreButton({ open, onClick, ...rest }: { open: boolean; onClick: () => void } & Record<string, unknown>) {
  return (
    <button type="button" aria-expanded={open} onClick={onClick} {...rest} className={cn('mt-2.5 inline-flex h-7 items-center gap-1.5 rounded-control pl-1 pr-2 text-ui font-medium text-accent hover:bg-raised', focusRing)}>
      <CaretRight aria-hidden size={12} className={cn('transition-transform duration-hover', open && 'rotate-90')} />
      {open ? 'Fewer details' : 'More details'}
    </button>
  );
}

/* ---------------- Leda's draft: exactly what she will write ---------------- */

export interface DraftLine { name: string; ref?: string; supplier?: string; qty: number; unit: string; unitCost: number; added?: boolean }
export interface LedaDraftProps {
  id: string;
  title: string;
  byOwner?: boolean;
  options?: { id: string; label: string }[];
  option?: string;
  onOption?: (id: string) => void;
  lines?: DraftLine[];
  writes: string[];
  cannot?: string;
  notifies?: string;
  addOn?: { label: string; amount: number; checked: boolean; onChange: (v: boolean) => void };
  confirmLabel: string;
  busy?: boolean;
  /** Show the Enter key hint on the confirm button (a pointer device with a keyboard). */
  kbd?: boolean;
  /** The sticky phone bar stands in for this button. */
  barOwnsConfirm?: boolean;
  onConfirm: () => void;
  onDiscard?: () => void;
  className?: string;
}

export const LedaDraft = forwardRef<HTMLDivElement, LedaDraftProps>(function LedaDraft(p, ref) {
  const total = (p.lines ?? []).reduce((s, l) => s + l.qty * l.unitCost, 0);
  const writes = [...p.writes];
  return (
    <div ref={ref} id="prop" role="group" aria-label="Leda's draft" className={cn('rounded-card bg-raised px-[18px] pb-[18px] pt-4 max-[640px]:px-4 max-[640px]:pb-4 max-[640px]:pt-3.5', p.className)}>
      <div className="flex items-center gap-2 text-small leading-5 text-muted">
        <LedaMark size={16} decorative />
        <span>{p.byOwner ? 'You asked · drafted by Leda' : 'Draft by Leda'}</span>
        <span aria-hidden>·</span>
        <span className="font-mono text-small leading-5 text-text">{p.id}</span>
        <span className="inline-flex h-5 flex-none items-center whitespace-nowrap rounded-chip bg-raised-2 px-1.5 text-small font-medium leading-5 text-text">Draft</span>
      </div>
      <h3 className="m-0 mt-2 text-[16px] font-semibold leading-[22px] text-text">{p.title}</h3>
      {p.options ? (
        <SegmentedControl aria-label="Choose" className="mt-3" value={p.option} onChange={(v) => p.onOption?.(v)} options={p.options.map((o) => ({ value: o.id, label: o.label }))} />
      ) : null}
      {p.lines && p.lines.length ? (
        <table className="mt-3 w-full border-collapse text-ui leading-[18px]">
          <thead>
            <tr>
              <th className="pb-1.5 pl-0 pr-0 pt-0 text-left text-small font-normal leading-[18px] text-muted">Item</th>
              <th className="whitespace-nowrap pb-1.5 pl-2.5 pr-0 pt-0 text-right text-small font-normal leading-[18px] tabular-nums text-muted">Qty</th>
              <th className="whitespace-nowrap pb-1.5 pl-2.5 pr-0 pt-0 text-right text-small font-normal leading-[18px] tabular-nums text-muted">Unit cost</th>
              <th className="whitespace-nowrap pb-1.5 pl-2.5 pr-0 pt-0 text-right text-small font-normal leading-[18px] tabular-nums text-muted">Total</th>
            </tr>
          </thead>
          <tbody>
            {p.lines.map((l, i) => (
              <tr key={i} className={l.added ? 'text-accent' : undefined}>
                <td className="border-t border-raised-2 py-[7px] pl-0 pr-0 align-top">
                  {l.name}
                  <span className="block text-small leading-[18px] text-muted">{l.ref ? <span className="font-mono text-small">{l.ref}</span> : null}{l.supplier ? ` · ${l.supplier}` : ''}</span>
                </td>
                <td className="whitespace-nowrap border-t border-raised-2 py-[7px] pl-2.5 pr-0 text-right align-top tabular-nums">{l.qty.toLocaleString('en-PH')} {l.unit}</td>
                <td className="whitespace-nowrap border-t border-raised-2 py-[7px] pl-2.5 pr-0 text-right align-top tabular-nums">{peso(l.unitCost)}</td>
                <td className="whitespace-nowrap border-t border-raised-2 py-[7px] pl-2.5 pr-0 text-right align-top tabular-nums">{peso(l.qty * l.unitCost)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td colSpan={3} className="border-t border-control py-[7px] pl-0 pr-0 align-top">Total</td>
              <td className="whitespace-nowrap border-t border-control py-[7px] pl-2.5 pr-0 text-right align-top tabular-nums">{peso(total)}</td>
            </tr>
          </tfoot>
        </table>
      ) : null}
      <div className="mt-3.5 text-ui leading-[19px]">
        <h4 className="m-0 mb-1 text-small font-normal leading-[19px] text-muted">Leda will write</h4>
        <ul className="m-0 list-none p-0">
          {writes.map((w, i) => (
            <li key={i} className="relative py-[3px] pl-4 before:absolute before:left-0.5 before:top-3 before:h-[1.5px] before:w-1.5 before:bg-accent before:content-['']">{w}</li>
          ))}
          {p.cannot ? <li className="relative py-[3px] pl-4 text-muted before:absolute before:left-0.5 before:top-[9px] before:h-[7px] before:w-[7px] before:rounded-full before:border-[1.5px] before:border-muted before:content-['']">{p.cannot}</li> : null}
          {p.notifies ? <li className="relative py-[3px] pl-4 text-muted before:absolute before:left-0.5 before:top-3 before:h-[1.5px] before:w-1.5 before:bg-accent before:content-['']">Notifies {p.notifies}</li> : null}
        </ul>
      </div>
      {p.addOn ? (
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-raised-2 pt-3 text-ui leading-[19px]">
          <input type="checkbox" checked={p.addOn.checked} onChange={(e) => p.addOn!.onChange(e.target.checked)} className="m-0 mt-0.5 h-4 w-4 flex-none accent-[var(--accent)]" />
          <span>{p.addOn.label} <span className="tabular-nums text-muted">+{peso(p.addOn.amount)}</span></span>
        </label>
      ) : null}
      <div className="mt-[18px] flex flex-wrap items-center gap-2 max-[640px]:[&_button]:h-11">
        <Button variant="primary" disabled={p.busy} onClick={p.onConfirm} className={cn(p.barOwnsConfirm && 'max-[640px]:hidden')}>
          {p.busy ? 'Writing…' : p.confirmLabel}
          {!p.busy && p.kbd ? <kbd aria-hidden className="inline-block min-w-[18px] rounded-[3px] bg-white/20 px-1 text-center font-sans text-[11px] leading-4 text-inherit max-[640px]:hidden">↵</kbd> : null}
        </Button>
        {p.options || !p.onDiscard ? null : <Button variant="text" disabled={p.busy} onClick={p.onDiscard}>Discard draft</Button>}
      </div>
    </div>
  );
});

/* ---------------- key-value rows (.kv): label, bold value, a note at the right ---------------- */

export interface CaseKvItem { label: string; value: string; note?: string; tone?: 'bad'; mono?: boolean }

export function CaseKv({ items }: { items: CaseKvItem[] }) {
  return (
    <dl className="m-0 grid grid-cols-[minmax(120px,34%)_minmax(0,1fr)] gap-x-4 text-ui leading-5 max-[640px]:grid-cols-[minmax(104px,38%)_minmax(0,1fr)]">
      {items.map((r, i) => (
        <Fragment key={i}>
          <dt title={r.label} className="m-0 overflow-hidden text-ellipsis whitespace-nowrap border-t border-rule py-[7px] text-muted">{r.label}</dt>
          <dd className="m-0 flex min-w-0 justify-between gap-3 border-t border-rule py-[7px] @max-[600px]/sheet:flex-col @max-[600px]/sheet:gap-0 max-[640px]:flex-col max-[640px]:gap-0">
            <b className={cn('flex-none font-medium tabular-nums', r.tone === 'bad' && 'text-bad', r.mono && 'font-mono text-ui')}>{r.value}</b>
            {r.note ? <span title={r.note} className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-right text-muted @max-[600px]/sheet:whitespace-normal @max-[600px]/sheet:text-left max-[640px]:whitespace-normal max-[640px]:text-left">{r.note}</span> : null}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}
