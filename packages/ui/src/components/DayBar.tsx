import { forwardRef, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../utils/cn';

export type DayBarMarkKind = 'due' | 'deadline';
export type DayBarMarkTone = 'default' | 'bad';

export interface DayBarMark {
  /** Stable key. Defaults to the position in `marks`. */
  id?: string;
  /** `due` is the time the action is due (square marker). `deadline` is a promise made to someone (diamond marker). */
  kind: DayBarMarkKind;
  /** Minutes since midnight. Past the end of the hours (or before the start) the mark pins to that edge with an arrow. */
  at: number;
  /** Full label shown beside the line, e.g. "Leave by 10:15 AM". Wraps to another row, then shortens, before it ever overlaps. */
  label: string;
  /** Label for narrow widths or when the full one does not fit. Defaults to the formatted time. */
  shortLabel?: string;
  /** `bad` for an urgent mark. Colour is never the only signal: the shape and the label stay. */
  tone?: DayBarMarkTone;
}

export interface DayBarHours {
  /** Opening time, minutes since midnight (8:00 = 480). */
  open: number;
  /** Closing time, minutes since midnight. At or before `open` it means the next day (overnight, e.g. 22:00 to 06:00); values past 1440 are fine. */
  close: number;
}

export interface DayBarProps {
  /** Business hours the strip spans. */
  hours: DayBarHours;
  /** Current time, minutes since midnight. Omit to hide the Now mark. Pass the same clock your page uses (it is never read from the browser). */
  now?: number;
  /** Due time and deadline marks. */
  marks?: DayBarMark[];
  /** The platform is closed today: a plain strip with `closedLabel`, no marks. */
  closed?: boolean;
  /** Shown in a closed strip and read out. Default "Closed today". */
  closedLabel?: string;
  /** Label of the Now mark. Default "Now". The time is added when there is room. */
  nowLabel?: string;
  /** Prefix of the spoken description. Default "Business hours". */
  hoursLabel?: string;
  /** Formats minutes since midnight (tick labels and the spoken text). Default: `Intl` in `locale`, e.g. "8 AM" / "9:12 AM". Use it for a 24-hour clock or another style. */
  formatTime?: (minutes: number) => string;
  /** BCP 47 locale for the default formatter. Default: the browser's. */
  locale?: string;
  /** Replaces the generated description (which lists the hours and every mark). */
  'aria-label'?: string;
  /** Merged under the component classes: add margin or colour, it cannot change the strip. */
  className?: string;
}

/** Layout width used until the box is measured (and where there is no layout, as in tests). */
const FALLBACK_W = 560;
const COMPACT_W = 520;
const BAR_H = 18;
const ROW_H = 14;
const CHAR_W = 6.7;
const PAD = 8;
const ARROW = 4;

const defaultFormat = (locale?: string) => {
  const hourOnly = new Intl.DateTimeFormat(locale, { hour: 'numeric' });
  const full = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  return (m: number) => {
    const mm = ((Math.round(m) % 1440) + 1440) % 1440;
    const d = new Date(2000, 0, 1, Math.floor(mm / 60), mm % 60);
    return (mm % 60 === 0 ? hourOnly : full).format(d);
  };
};

interface Placed {
  mark: PlacedMark;
  text: string;
  side: 'R' | 'L';
  row: number;
  a: number;
  b: number;
}
interface PlacedMark {
  key: string;
  kind: 'now' | DayBarMarkKind;
  tone: DayBarMarkTone;
  x: number;
  edge: 'before' | 'after' | null;
  long: string;
  short: string;
}

const textW = (t: string) => t.length * CHAR_W + 6;

/** Places each label beside its own line. Never across another line, never over another label; a new row only when needed. */
function place(marks: PlacedMark[], W: number, compact: boolean): Placed[] {
  const out: Placed[] = [];
  const rows: [number, number][][] = [];
  const clear = (a: number, b: number, row: number, self: PlacedMark, pending: PlacedMark[]) => {
    if (a < 0 || b > W) return false;
    // other lines that reach this row: placed ones that were lifted at least this high, and every pending one in row 0
    for (const p of out) if (p.mark !== self && p.row >= row && p.mark.x > a - 3 && p.mark.x < b + 3) return false;
    if (row === 0) for (const q of pending) if (q !== self && q.x > a - 3 && q.x < b + 3) return false;
    return !(rows[row] ?? []).some(([p, q]) => a < q + PAD && b > p - PAD);
  };
  // this mark's own line rises to its row: it must not cut a label already placed in a lower row
  const lineFree = (x: number, row: number) => {
    for (const p of out) if (p.row <= row && x > p.a - 3 && x < p.b + 3) return false;
    return true;
  };
  // pinned and then left to right, so the order of rows follows the order on the strip
  const order = [...marks].sort((m, n) => m.x - n.x);
  order.forEach((m, i) => {
    const pending = order.slice(i + 1);
    const texts = compact ? [m.short] : m.long === m.short ? [m.short] : [m.long, m.short];
    const reach = m.edge ? ARROW + 3 : 6;
    let pick: Placed | null = null;
    // the full label on the first two rows wins over a short label on row 0; more rows only for the short one
    const attempts: [string, number][] = [];
    texts.forEach((t, k) => { for (let r = 0; r < (k === 0 ? 2 : 6); r++) attempts.push([t, r]); });
    for (const [text, row] of attempts) {
      if (pick || !lineFree(m.x, row)) continue;
      const w = textW(text) + reach;
      const tries: ['R' | 'L', number, number][] =
        m.edge === 'after' ? [['L', m.x - w, m.x], ['R', m.x, m.x + w]] : [['R', m.x, m.x + w], ['L', m.x - w, m.x]];
      for (const [side, a, b] of tries) {
        if (!pick && clear(a, b, row, m, pending)) pick = { mark: m, text, side, row, a, b };
      }
    }
    // no room anywhere (very narrow): the short label on a new top row, clipped to the strip rather than overlapping
    if (!pick) {
      const row = Math.max(0, ...out.map((p) => p.row)) + 1;
      const w = textW(m.short) + reach;
      const side: 'R' | 'L' = m.x + w <= W ? 'R' : 'L';
      pick = { mark: m, text: m.short, side, row, a: side === 'R' ? m.x : Math.max(0, m.x - w), b: side === 'R' ? m.x + w : m.x };
    }
    (rows[pick.row] ??= []).push([pick.a, pick.b]);
    out.push(pick);
  });
  return out;
}

const toneClass = { default: { line: 'stroke-text', fill: 'fill-text', text: 'fill-text' }, bad: { line: 'stroke-bad', fill: 'fill-bad', text: 'fill-bad' } } as const;

/**
 * Day bar (C23): an SVG strip across the platform's business hours on the raised ground (18px, 4px radius)
 * with hour ticks and marks for Now, the due time and the deadline. Each label sits beside its own line, on
 * a second row only when needed; below 520px of its own width the labels shorten. A mark outside the hours
 * pins to the edge with an arrow. Read as one image: the description lists the hours and every mark.
 * All colours are tokens (light and dark follow); `className` is merged on the wrapper only.
 */
export const DayBar = forwardRef<HTMLDivElement, DayBarProps>(function DayBar(
  { hours, now, marks = [], closed = false, closedLabel = 'Closed today', nowLabel = 'Now', hoursLabel = 'Business hours', formatTime, locale, 'aria-label': ariaLabel, className },
  ref,
) {
  const box = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
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

  const W = width > 0 ? width : FALLBACK_W;
  const compact = W < COMPACT_W;
  const fmt = useMemo(() => {
    const f = formatTime ?? defaultFormat(locale);
    return (m: number) => f(((Math.round(m) % 1440) + 1440) % 1440);
  }, [formatTime, locale]);

  const t0 = hours.open;
  const t1 = hours.close <= hours.open ? hours.close + 1440 : hours.close;
  const span = t1 - t0;
  // an overnight day: times before opening belong after midnight
  const norm = (t: number) => (hours.close <= hours.open && t < t0 ? t + 1440 : t);
  const xOf = (t: number) => Math.round(((Math.max(t0, Math.min(norm(t), t1)) - t0) / span) * W * 10) / 10;
  const edgeOf = (t: number): 'before' | 'after' | null => (norm(t) < t0 ? 'before' : norm(t) > t1 ? 'after' : null);

  const placedMarks: PlacedMark[] = [];
  if (!closed) {
    if (now !== undefined) {
      placedMarks.push({ key: 'now', kind: 'now', tone: 'default', x: xOf(now), edge: edgeOf(now), long: `${nowLabel} ${fmt(now)}`, short: nowLabel });
    }
    marks.forEach((m, i) => {
      placedMarks.push({ key: m.id ?? `m${i}`, kind: m.kind, tone: m.tone ?? 'default', x: xOf(m.at), edge: edgeOf(m.at), long: m.label, short: m.shortLabel ?? fmt(m.at) });
    });
  }
  const labels = closed ? [] : place(placedMarks, W, compact);
  const rowCount = labels.length ? Math.max(...labels.map((l) => l.row)) + 1 : 0;

  const top = closed ? 0 : rowCount * ROW_H + 8;
  const tickY = top + BAR_H + 16;
  const H = tickY + 4;

  // hour ticks: every 1, 2 or 3 hours by width
  const hoursSpan = span / 60;
  const step = W / hoursSpan >= 56 ? 1 : W / hoursSpan >= 30 ? 2 : 3;
  const ticks: { h: number; x: number; anchor: 'start' | 'middle' | 'end' }[] = [];
  for (let h = Math.ceil(t0 / 60); h * 60 <= t1; h += step) {
    const m = h * 60;
    ticks.push({ h, x: xOf(m), anchor: m === t0 ? 'start' : m + step * 60 > t1 ? 'end' : 'middle' });
  }

  const nowX = now !== undefined && !closed ? xOf(now) : null;
  const dueMarks = closed ? [] : marks.filter((m) => m.kind === 'due');
  const firstDue = dueMarks.length ? Math.min(...dueMarks.map((m) => norm(m.at))) : null;
  const windowEnd = firstDue !== null && now !== undefined && firstDue > norm(now) ? xOf(firstDue) : null;

  const spoken = (() => {
    if (ariaLabel) return ariaLabel;
    if (closed) return `${closedLabel}.`;
    const parts = [`${hoursLabel} ${fmt(t0)} to ${fmt(t1)}`];
    if (now !== undefined) parts.push(`${nowLabel} ${fmt(now)}${edgeOf(now) ? (edgeOf(now) === 'before' ? ', before opening' : ', after closing') : ''}`);
    marks.forEach((m) => {
      const e = edgeOf(m.at);
      parts.push(`${m.label}${m.label.includes(fmt(m.at)) ? '' : ` at ${fmt(m.at)}`}${m.tone === 'bad' ? ', urgent' : ''}${e === 'before' ? ', before opening' : e === 'after' ? ', after closing' : ''}`);
    });
    return `${parts.join('. ')}.`;
  })();

  const setRefs = (node: HTMLDivElement | null) => {
    box.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div ref={setRefs} className={cn('block w-full min-w-0 max-w-full overflow-hidden', className)}>
      <svg role="img" aria-label={spoken} width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block max-w-full">
        {closed ? (
          <>
            <rect x={0} y={top} width={W} height={BAR_H} rx={4} className="fill-raised" />
            <text x={PAD} y={top + 13} className="fill-muted text-small">{closedLabel}</text>
          </>
        ) : (
          <>
            <rect x={0} y={top} width={W} height={BAR_H} rx={4} className="fill-raised" />
            {nowX !== null && nowX > 0 && <rect x={0} y={top} width={nowX} height={BAR_H} rx={4} className="fill-raised-2" />}
            {nowX !== null && windowEnd !== null && windowEnd > nowX && (
              <rect x={nowX} y={top} width={windowEnd - nowX} height={BAR_H} className="fill-accent-tint-2" />
            )}
            {labels.map((l) => {
              const m = l.mark;
              const tc = toneClass[m.tone];
              const ly = top - 8 - l.row * ROW_H;
              const my = ly - 3.5;
              const sw = m.kind === 'now' ? 1.5 : 2;
              const side = l.side === 'R' ? 1 : -1;
              const off = m.edge ? ARROW + 6 : 8;
              return (
                <g key={m.key} data-mark={m.kind}>
                  <line x1={m.x} y1={my} x2={m.x} y2={top + BAR_H + 3} strokeWidth={sw} className={tc.line} />
                  {m.edge ? (
                    <path
                      d={m.edge === 'before' ? `M${m.x + ARROW} ${my - ARROW}L${m.x} ${my}L${m.x + ARROW} ${my + ARROW}` : `M${m.x - ARROW} ${my - ARROW}L${m.x} ${my}L${m.x - ARROW} ${my + ARROW}`}
                      fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={tc.line}
                    />
                  ) : m.kind === 'now' ? (
                    <circle cx={m.x} cy={my} r={3.5} className={cn(tc.fill, 'motion-safe:animate-pulse')} />
                  ) : m.kind === 'due' ? (
                    <rect x={m.x - 3.5} y={my - 3.5} width={7} height={7} className={tc.fill} />
                  ) : (
                    <path d={`M${m.x} ${my - 4.5}L${m.x + 4.5} ${my}L${m.x} ${my + 4.5}L${m.x - 4.5} ${my}Z`} className={tc.fill} />
                  )}
                  <text
                    x={m.x + side * off}
                    y={ly + 4}
                    textAnchor={l.side === 'R' ? 'start' : 'end'}
                    className={cn('text-small', tc.text, m.kind === 'now' ? 'font-normal' : 'font-medium')}
                  >
                    {l.text}
                  </text>
                </g>
              );
            })}
          </>
        )}
        {!closed && ticks.map((t) => (
          <text key={t.h} x={t.x} y={tickY} textAnchor={t.anchor} className="fill-muted text-small">{fmt(t.h * 60)}</text>
        ))}
      </svg>
    </div>
  );
});
