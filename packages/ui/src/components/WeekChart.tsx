import { forwardRef, useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn, focusRing } from '../utils/cn';

/** Formats a number for a label. */
export type ChartFormat = (value: number) => string;

export interface ChartFormatOptions {
  /** BCP 47 locale. Default: the browser's. */
  locale?: string;
  /** ISO 4217 code ("PHP", "USD"). Omit for plain numbers: nothing is hard-coded. */
  currency?: string;
  /** Short form for axis labels: 12.4K. */
  compact?: boolean;
}

/** Builds a `format` / `tickFormat` for `WeekChart` from a locale and an optional currency. */
export function chartNumberFormat({ locale, currency, compact = false }: ChartFormatOptions = {}): ChartFormat {
  const nf = new Intl.NumberFormat(locale, {
    ...(currency ? { style: 'currency', currency, currencyDisplay: 'narrowSymbol' } : {}),
    ...(compact ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: currency ? 0 : 1 }),
  });
  return (v) => nf.format(v);
}

export type WeekChartKind = 'bars' | 'diverging';

export interface WeekChartProps {
  /** `bars`: one value per day, the highlighted day in the accent. `diverging`: In above the line, Out below. */
  kind?: WeekChartKind;
  /** One label per day, oldest first: "Wed 21". */
  labels: string[];
  /** `bars`. `null` is a day with no value (closed): a short dash on the zero line and "Closed" in the tooltip. */
  values?: (number | null)[];
  /** `diverging`: magnitudes (positive numbers) above the line. */
  up?: number[];
  /** `diverging`: magnitudes (positive numbers) below the line. */
  down?: number[];
  /** `bars`: index drawn in the accent. Default: the last day. Pass -1 for none. */
  highlight?: number;
  /** `diverging` captions. Default "In" / "Out". */
  aboveLabel?: string;
  belowLabel?: string;
  /** Tooltip, value labels and the spoken table: "₱3,200". */
  format?: ChartFormat;
  /** Axis labels: "₱3K". Default: compact. */
  tickFormat?: ChartFormat;
  /** Locale of the default formats. */
  locale?: string;
  /** Name of the measure in the spoken text: "orders", "revenue". */
  unit?: string;
  /** About how many ticks the y axis gets (2-3 for compact rows). Default 4. */
  tickCount?: number;
  /** A shorter plot for compact rows. */
  compact?: boolean;
  /** What the chart is, for the spoken text and the table caption: "Revenue, last 7 days". */
  title: string;
  /** Word for a day without a value. Default "Closed". */
  closedLabel?: string;
  /** Replaces the generated summary. */
  'aria-label'?: string;
  /** Merged on the wrapper only. */
  className?: string;
}

const FALLBACK_W = 320;
const CH = 6.2; // px per character at 11px

/** Round ticks (1, 2, 2.5 or 5 x 10^n) that always include zero and top out above the largest value. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const lo0 = Math.min(0, min);
  const hi0 = Math.max(0, max);
  if (hi0 === lo0) return [0, 1];
  const raw = (hi0 - lo0) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const lo = Math.floor(lo0 / step) * step;
  let hi = Math.ceil(hi0 / step) * step;
  if (hi <= hi0 && hi0 > 0) hi += step;
  const out: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}

/** Which x labels to draw: every k-th, always including the last day (yesterday). */
function xPicks(labels: string[], slot: number): Set<number> {
  const n = labels.length;
  const widest = Math.max(1, ...labels.map((l) => l.length * CH + 8));
  const k = Math.max(1, Math.ceil(widest / Math.max(1, slot)));
  const out = new Set<number>();
  for (let i = n - 1; i >= 0; i -= k) out.add(i);
  return out;
}


/**
 * Week chart (C31): the 7-day bars or the In/Out diverging chart, drawn in SVG from tokens.
 * - bars: yesterday in `chart-1`, the others in `chart-muted`; a labelled y axis with a true zero; the values are
 *   written on the bars when the slot is wide enough (the highlighted one always), so a muted bar never needs its
 *   colour to be read.
 * - diverging: In above the line, Out below, with a legend that names them.
 * Reads as one image (role=img with a summary) plus a visually hidden table of the values. Reachable by keyboard:
 * focus the chart, then Left/Right (Home/End) to move through the days and read each in the tooltip; Escape clears.
 * Sizes itself to its own width (ResizeObserver). No animation. Forced colours map the marks to system colours.
 */
export const WeekChart = forwardRef<HTMLDivElement, WeekChartProps>(function WeekChart(
  {
    kind = 'bars', labels, values = [], up = [], down = [], highlight, aboveLabel = 'In', belowLabel = 'Out',
    format, tickFormat, locale, unit, tickCount = 4, compact = false, title, closedLabel = 'Closed', 'aria-label': ariaLabel, className,
  },
  ref,
) {
  const box = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [announce, setAnnounce] = useState('');
  const id = useId();

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => setWidth(Math.floor(el.clientWidth));
    read();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fmt = useMemo(() => format ?? chartNumberFormat({ locale }), [format, locale]);
  const tfmt = useMemo(() => tickFormat ?? chartNumberFormat({ locale, compact: true }), [tickFormat, locale]);

  const n = labels.length;
  const diverging = kind === 'diverging';
  const hl = highlight === undefined ? n - 1 : highlight;
  const vals: (number | null)[] = diverging ? labels.map((_, i) => up[i] ?? 0) : labels.map((_, i) => values[i] ?? null);
  const downs = labels.map((_, i) => down[i] ?? 0);

  const W = width > 0 ? width : FALLBACK_W;
  const plotH = compact ? 56 : diverging ? 150 : 128;

  // domain and ticks
  const dataMax = diverging ? Math.max(0, ...vals.map((v) => v ?? 0), ...downs) : Math.max(0, ...vals.map((v) => v ?? 0));
  const dataMin = diverging ? 0 : Math.min(0, ...vals.map((v) => v ?? 0));
  const ticks = niceTicks(dataMin, dataMax, diverging && compact ? Math.min(tickCount, 1) : tickCount);
  const lo = diverging ? -ticks[ticks.length - 1] : ticks[0];
  const hi = ticks[ticks.length - 1];
  const tickLabels = diverging ? ticks.filter((t) => t > 0).flatMap((t) => [t, -t]).concat(0) : ticks;

  const yW = Math.max(...tickLabels.map((t) => tfmt(Math.abs(t)).length), 1) * CH + 10;
  const padL = Math.ceil(yW);
  const padR = 6;
  const slot = Math.max(1, (W - padL - padR) / Math.max(1, n));
  const showAll = slot >= Math.max(...vals.map((v) => (v == null ? 0 : fmt(v).length)), 1) * 6.7 + 6 && !compact && !diverging;
  const padT = diverging || showAll || hl >= 0 ? 18 : 8;
  const padB = 20;
  const H = padT + plotH + padB;
  const y = (v: number) => padT + ((hi - v) / (hi - lo)) * plotH;
  const y0 = y(0);
  const bw = Math.max(4, Math.min(28, slot * 0.56));
  const cx = (i: number) => padL + slot * i + slot / 2;
  const picks = xPicks(labels, slot);

  const valueAt = (i: number): string => {
    if (diverging) return `${aboveLabel} ${fmt(vals[i] ?? 0)}, ${belowLabel} ${fmt(downs[i])}`;
    return vals[i] == null ? closedLabel : fmt(vals[i] as number);
  };

  const summary = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    const parts = labels.map((l, i) => `${l} ${valueAt(i)}`);
    return `${title}${unit ? ` (${unit})` : ''}. ${parts.join(', ')}.`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ariaLabel, labels, vals, downs, fmt, title, unit, aboveLabel, belowLabel, closedLabel]);

  const move = useCallback((i: number | null) => {
    setActive(i);
    if (i !== null) setAnnounce(`${labels[i]}: ${valueAt(i)}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labels, vals, downs, fmt, aboveLabel, belowLabel, closedLabel]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (n === 0) return;
    const cur = active ?? (e.key === 'ArrowLeft' ? n : -1);
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = Math.min(n - 1, cur + 1);
    else if (e.key === 'ArrowLeft') next = Math.max(0, cur - 1);
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    else if (e.key === 'Escape') { move(null); return; }
    if (next !== null) { e.preventDefault(); move(next); }
  };

  const onPointer = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left - padL;
    const i = Math.floor(x / slot);
    move(i >= 0 && i < n ? i : null);
  };

  const setRefs = (node: HTMLDivElement | null) => {
    box.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  // tooltip geometry (drawn in the SVG, so no inline style)
  let tip: { x: number; y: number; w: number; l1: string; l2: string } | null = null;
  if (active !== null && active < n) {
    const l2 = valueAt(active);
    const w = Math.max(l2.length, labels[active].length) * 6.6 + 16;
    const top = diverging ? y(vals[active] ?? 0) : vals[active] == null ? y0 : y(Math.max(0, vals[active] as number));
    const x = Math.max(0, Math.min(W - w, cx(active) - w / 2));
    tip = { x, y: Math.max(0, top - 46), w, l1: labels[active], l2 };
  }

  return (
    <div className={cn('block w-full min-w-0 max-w-full', className)}>
      <div
        ref={setRefs}
        tabIndex={n ? 0 : undefined}
        role="group"
        aria-label={`${title}. Use the left and right arrow keys to read each day.`}
        aria-describedby={`${id}-live`}
        onKeyDown={onKey}
        onBlur={() => move(null)}
        className={cn('block w-full min-w-0 max-w-full overflow-hidden rounded-chip', focusRing)}
      >
        <svg role="img" aria-label={summary} width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full tabular-nums" onPointerMove={onPointer} onPointerDown={onPointer} onPointerLeave={() => move(null)}>
          {/* grid and y axis */}
          {(diverging ? tickLabels : ticks).map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} strokeWidth={1} className={cn(t === 0 ? 'stroke-chart-axis' : 'stroke-chart-grid', 'forced-colors:stroke-[CanvasText]')} />
              <text x={padL - 6} y={y(t) + 4} textAnchor="end" className="fill-chart-axis text-tiny forced-colors:fill-[CanvasText]">{tfmt(Math.abs(t))}</text>
            </g>
          ))}
          {active !== null && <rect x={padL + slot * active} y={padT} width={slot} height={plotH} className="fill-raised forced-colors:fill-[Canvas]" />}
          {/* the marks */}
          {labels.map((l, i) => {
            const v = vals[i];
            const isHl = !diverging && i === hl;
            const bx = cx(i) - bw / 2;
            if (diverging) {
              const dn = downs[i];
              return (
                <g key={`${l}-${i}`}>
                  {(v ?? 0) > 0 && <rect x={bx} y={y(v as number)} width={bw} height={Math.max(1, y0 - y(v as number))} className="fill-chart-1 forced-colors:fill-[Highlight]" />}
                  {dn > 0 && <rect x={bx} y={y0} width={bw} height={Math.max(1, y(-dn) - y0)} className="fill-chart-1 forced-colors:fill-[Highlight]" />}
                </g>
              );
            }
            if (v == null) return <rect key={`${l}-${i}`} x={bx} y={y0 - 2} width={bw} height={2} className="fill-chart-axis forced-colors:fill-[CanvasText]" />;
            const top = v >= 0 ? y(v) : y0;
            const h = Math.max(v === 0 ? 1 : 2, Math.abs(y(v) - y0));
            return (
              <g key={`${l}-${i}`}>
                <rect x={bx} y={top} width={bw} height={h} strokeWidth={isHl ? 0 : 1} className={cn(isHl ? 'fill-chart-1 forced-colors:fill-[Highlight]' : 'fill-chart-muted stroke-chart-axis forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]')} />
                {(showAll || isHl) && (() => {
                  const full = fmt(v);
                  const txt = full.length * 6.4 + 8 > W - padL - padR ? tfmt(v) : full;
                  const half = txt.length * 3.3 + 2;
                  const x = Math.max(padL + half, Math.min(W - padR - half, cx(i)));
                  // keep the label clear of the neighbouring bars it overhangs
                  let ty = v >= 0 ? top : top + h;
                  if (v >= 0) vals.forEach((o, j) => { if (j !== i && o != null && o > 0 && cx(j) + bw / 2 > x - half && cx(j) - bw / 2 < x + half) ty = Math.min(ty, y(o)); });
                  return (
                    <text x={x} y={ty + (v >= 0 ? -4 : 12)} textAnchor="middle" className={cn('fill-text text-tiny forced-colors:fill-[CanvasText]', isHl && 'font-semibold')}>{txt}</text>
                  );
                })()}
              </g>
            );
          })}
          {/* x labels */}
          {labels.map((l, i) => picks.has(i) && (
            <text key={`x-${l}-${i}`} x={cx(i)} y={H - 5} textAnchor="middle" className={cn('text-tiny forced-colors:fill-[CanvasText]', !diverging && i === hl ? 'fill-text font-semibold' : 'fill-chart-axis')}>{l}</text>
          ))}
          {tip && (
            <g pointerEvents="none">
              <rect x={tip.x} y={tip.y} width={tip.w} height={36} rx={4} className="fill-text forced-colors:fill-[CanvasText]" />
              <text x={tip.x + 8} y={tip.y + 14} className="fill-surface text-tiny font-semibold forced-colors:fill-[Canvas]">{tip.l1}</text>
              <text x={tip.x + 8} y={tip.y + 29} className="fill-surface text-small forced-colors:fill-[Canvas]">{tip.l2}</text>
            </g>
          )}
        </svg>
        <span id={`${id}-live`} aria-live="polite" className="sr-only">{announce}</span>
      </div>
      {diverging && (
        <p className="mt-1 flex gap-4 text-small text-muted">
          <span><span aria-hidden>{'▲'} </span>{aboveLabel} above the line</span>
          <span><span aria-hidden>{'▼'} </span>{belowLabel} below</span>
        </p>
      )}
      <table className="sr-only">
        <caption>{title}{unit ? ` (${unit})` : ''}</caption>
        <thead><tr><th scope="col">Day</th>{diverging ? (<><th scope="col">{aboveLabel}</th><th scope="col">{belowLabel}</th></>) : <th scope="col">Value</th>}</tr></thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={`${l}-${i}`}>
              <th scope="row">{l}</th>
              {diverging ? (<><td>{fmt(vals[i] ?? 0)}</td><td>{fmt(downs[i])}</td></>) : <td>{vals[i] == null ? closedLabel : fmt(vals[i] as number)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
