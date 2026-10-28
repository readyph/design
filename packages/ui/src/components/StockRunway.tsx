import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';

/** One step of the day: the start, a movement already made, a booked job or a delivery. */
export interface StockRunwayPoint {
  /** Minutes since midnight. */
  t: number;
  /** On hand after this step. */
  v: number;
  kind: 'start' | 'moved' | 'job' | 'del';
  ref?: string;
  /** A job that takes on hand below zero. */
  short?: boolean;
}

/** A part with no booked jobs: on hand falls in a straight line from Now at its use rate. */
export interface StockRunwayRate {
  /** On hand now. */
  vNow: number;
  /** Minutes since midnight when it runs out; null when it lasts to close. */
  tz: number | null;
  /** On hand at close (0 when it runs out). */
  end: number;
}

/** A draft purchase order: what would be left when it arrives, "if sent". */
export interface StockRunwayAlt {
  /** Purchase order number, e.g. "PO-0224". */
  no: string;
  /** On hand once it arrives. */
  left: number;
  /** Minutes since midnight when it arrives. */
  at: number;
}

export interface StockRunwayWeekDay {
  /** Column label used in the week text: "today", "Wed 28". */
  label: string;
  /** Column width relative to an open day (1). A closed day is squeezed (0.45) and drawn as a hatched band. */
  width: number;
}

export interface StockRunwayWeek {
  /** Seven columns from today. */
  days: StockRunwayWeekDay[];
  /** Line points: day index, minutes since midnight, on hand. */
  points: { k: number; t: number; v: number }[];
  /** Deliveries: `draft` ones are named, never counted. `v` is on hand after it lands. */
  deliveries: { k: number; t: number; v: number; q: number; no: string; draft?: boolean }[];
  /** Where on hand first reaches zero. */
  outs: { k: number; t: number }[];
  /** Spans that are below zero. */
  bands: { k0: number; t0: number; k1: number; t1: number }[];
  /** On hand at the end of the seventh day. */
  end: number;
  /** Bottom caption, e.g. "Projected at about 20 a day, plus ordered deliveries, as of 9:12 AM". */
  caption: string;
}

export interface StockRunwayProps {
  /** `loading` is one skeleton bar centred in the box; `empty` shows `emptyLabel`. */
  state?: 'ready' | 'loading' | 'empty';
  /** Part name, used in the spoken description. */
  name: string;
  /** Business hours, minutes since midnight. */
  hours: { open: number; close: number };
  /** Current time, minutes since midnight. */
  now: number;
  /** The day's steps, in time order. Used for a part with booked jobs. */
  points?: StockRunwayPoint[];
  /** Used instead of `points` after Now for a part with no booked jobs. */
  rate?: StockRunwayRate;
  /** A draft purchase order: shows the "with PO" label and its line. */
  alt?: StockRunwayAlt;
  /** The week model. When set, the week chart replaces the day chart. */
  week?: StockRunwayWeek;
  /** Label under the chart, e.g. "Projected from booked jobs, as of 9:12 AM". */
  caption?: string;
  /** Shown when `state="empty"`. Default "Nothing goes out until there is stock." */
  emptyLabel?: string;
  /** Formats minutes since midnight. Default "9:12" (24-hour, no leading zero on the hour). */
  formatTime?: (minutes: number) => string;
  /** Replaces the generated description. */
  'aria-label'?: string;
  className?: string;
}

const FALLBACK_W = 560;
const MINUS = '−';
const defaultFormat = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

const t = {
  muted: 'fill-muted forced-colors:fill-[CanvasText]',
  ink: 'fill-text font-medium forced-colors:fill-[CanvasText]',
  bad: 'fill-bad font-semibold forced-colors:fill-[CanvasText]',
  acc: 'fill-accent font-semibold forced-colors:fill-[CanvasText]',
};

/**
 * Stock runway (I5): an SVG step chart of on-hand through today's booked jobs and deliveries. Solid line = so
 * far, dashed = projected, a short band where it goes below zero, the accent Now line with its flag, the zero
 * line, the y axis labelled once and hour ticks. A part used at a steady rate draws a straight line to "out
 * about". The week model has seven day columns with a closed day squeezed to a hatched band. Colour is the
 * accent line only. Read as one image; everything inside is decoration. All colours are tokens.
 */
export const StockRunway = forwardRef<HTMLDivElement, StockRunwayProps>(function StockRunway(
  { state = 'ready', name, hours, now, points = [], rate, alt, week, caption, emptyLabel = 'Nothing goes out until there is stock.', formatTime, 'aria-label': ariaLabel, className },
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
  const setRefs = (node: HTMLDivElement | null) => {
    box.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const hm = formatTime ?? defaultFormat;
  const W = width > 0 ? width : FALLBACK_W;
  const wrap = cn('relative mt-3 min-h-[200px]', className);

  if (state === 'loading') {
    return (
      <div ref={setRefs} className={cn(wrap, 'flex items-center justify-center')} aria-busy="true">
        <span className="block h-[14px] w-4/5 rounded-[3px] bg-skeleton motion-safe:animate-pulse" />
        <span className="sr-only">Loading stock runway</span>
      </div>
    );
  }
  if (state === 'empty') {
    return (
      <div ref={setRefs} className={wrap}>
        <p className="absolute left-2 top-1/2 -translate-y-1/2 text-small text-muted">{emptyLabel}</p>
      </div>
    );
  }

  const { open: OPEN, close: CLOSE } = hours;

  if (week) {
    const tot = week.days.reduce((a, d) => a + d.width, 0);
    const start = week.days.map((_, k) => week.days.slice(0, k).reduce((a, d) => a + d.width, 0));
    const X = (k: number, tm: number) => (Math.max(0, Math.min(100, ((start[k] + week.days[k].width * Math.max(0, Math.min(1, (tm - OPEN) / (CLOSE - OPEN)))) / tot) * 100)) / 100) * W;
    const H = 128, top = 26, bot = H - 24;
    const vs = week.points.map((p) => p.v);
    const lo = Math.min(0, ...vs), hi = Math.max(6, ...vs) + 1;
    const y = (v: number) => bot - ((v - lo) / (hi - lo)) * (bot - top);
    const fmt = (n: number) => { const r = Math.round(n); return r < 0 ? MINUS + Math.abs(r) : String(r); };
    const about = (tm: number) => hm(Math.min(CLOSE, Math.round(tm / 15) * 15));
    const first = week.points[0];
    const spoken = ariaLabel ?? `${name} this week: ${Math.round(first.v)} now.${week.outs.map((o) => ` Out ${o.k ? week.days[o.k].label : 'today'} about ${hm(Math.round(o.t))}.`).join('')}${week.deliveries.filter((d) => !d.draft).map((d) => ` ${d.no} brings ${d.q} ${week.days[d.k].label}.`).join('')}`;
    return (
      <div ref={setRefs} className={wrap}>
        <svg role="img" aria-label={spoken} width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block overflow-visible">
          <defs>
            <pattern id="runway-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" strokeWidth="1" className="stroke-hatch" />
            </pattern>
          </defs>
          <g aria-hidden="true">
            {week.days.map((d, k) => d.width < 1 && (
              <rect key={`closed${k}`} x={(start[k] / tot) * W} y={top} width={(d.width / tot) * W} height={bot - top} fill="url(#runway-hatch)" data-closed="" />
            ))}
            {week.bands.map((b, i) => (
              <rect key={`band${i}`} x={X(b.k0, b.t0)} y={Math.min(y(0) - 16, y(0))} width={Math.max(0, X(b.k1, b.t1) - X(b.k0, b.t0))} height={Math.max(20, bot - y(0) + 4 + 16)} className="fill-bad-bg" />
            ))}
            <line x1={0} x2={W} y1={y(0)} y2={y(0)} strokeWidth={1} className="stroke-control" />
            <text x={4} y={y(0) - 5} className={cn('text-small tabular-nums', t.muted)}>0</text>
            <path
              d={week.points.map((p, i) => `${i ? 'L' : 'M'}${X(p.k, p.t)} ${y(p.v)}`).join(' ')}
              fill="none" strokeWidth={2.5} strokeDasharray="6 4" strokeLinejoin="round" className="stroke-accent forced-colors:stroke-[CanvasText]"
            />
            <text x={X(0, now) + 5} y={y(first.v) - 6} className={cn('text-small tabular-nums', t.ink)}>{fmt(first.v)} now</text>
            {week.outs.map((o, i) => (
              <text key={`out${i}`} x={X(o.k, o.t) + 5} y={y(0) + 15} className={cn('text-small tabular-nums', t.bad)}>{`Out ${o.k ? week.days[o.k].label : 'today'} about ${about(o.t)}`}</text>
            ))}
            {week.deliveries.map((d, i) => d.draft ? (
              <text key={`del${i}`} x={X(d.k, d.t) + 5} y={top - 10} className={cn('text-small tabular-nums', t.muted)}>{`${d.no} not sent · +${d.q} only if sent`}</text>
            ) : (
              <text key={`del${i}`} x={X(d.k, d.t) + 5} y={Math.min(y(d.v) - 6, top - 10 + 14)} className={cn('text-small tabular-nums', t.ink)}>{`+${d.q} ${d.no}`}</text>
            ))}
            <text x={W - 2} y={H - 6} textAnchor="end" className={cn('text-small tabular-nums', week.end <= 0 ? t.muted : t.ink)}>{week.end <= 0 ? `0 by ${week.days[6].label}` : `${fmt(week.end)} left by ${week.days[6].label}`}</text>
            <text x={X(0, now) + 8} y={H - 6} className={cn('text-small tabular-nums', t.muted)}>{week.caption}</text>
          </g>
        </svg>
      </div>
    );
  }

  // ---- the day ----
  const pts = points;
  const small = W < 560;
  const H = small ? 226 : 200, top = small ? 30 : 46, ph = small ? 140 : 124, L = 24, R = 40, PW = Math.max(160, W - L - R);
  const vNow = rate ? rate.vNow : 0;
  const allv = pts.map((p) => p.v).concat(rate ? [rate.vNow, 0] : []);
  const hi = Math.max(5, ...allv.filter((v) => v < 200)), lo = Math.min(0, ...allv);
  const x = (tm: number) => L + ((Math.max(OPEN, Math.min(CLOSE, tm)) - OPEN) / (CLOSE - OPEN)) * PW;
  const y = (v: number) => top + ((hi - v) / (hi - lo)) * ph;
  const steps: [number, number][] = [];
  let cur = pts[0].v;
  steps.push([OPEN, cur]);
  pts.slice(1).forEach((pt) => { steps.push([pt.t, cur]); cur = pt.v; steps.push([pt.t, cur]); });
  steps.push([CLOSE, cur]);
  const vAt = (tm: number) => { let v = steps[0][1]; for (const [st, sv] of steps) { if (st <= tm) v = sv; else break; } return v; };
  const part = (a: number, b: number) => { const o: [number, number][] = [[a, vAt(a)]]; steps.forEach(([tm, v]) => { if (tm > a && tm < b) o.push([tm, v]); }); o.push([b, vAt(b)]); return o; };
  const d = (p: [number, number][]) => p.map(([tm, v], i) => `${i ? 'L' : 'M'}${x(tm).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const end = rate ? rate.end : pts[pts.length - 1].v;
  const shortAt = pts.filter((p) => p.short);
  const nx = x(now);
  const stepH = small ? 3 : 1;
  const hourTicks: { h: number; hx: number; anc: 'start' | 'middle' | 'end' }[] = [];
  for (let h = Math.ceil(OPEN / 60); h * 60 <= CLOSE; h += stepH) {
    const hx = x(h * 60);
    const anc = h * 60 === CLOSE ? 'end' : h * 60 === OPEN ? 'start' : 'middle';
    const lo0 = anc === 'end' ? hx - 38 : anc === 'start' ? hx : hx - 19, hi0 = lo0 + 38;
    if (!small && hi0 > nx - 34 && lo0 < nx + 34) continue;
    hourTicks.push({ h, hx, anc });
  }
  const spoken = ariaLabel ?? ((rate
    ? `${name}: ${Math.round(rate.vNow)} now, ${rate.tz ? `out about ${hm(rate.tz)}` : `${rate.end} left by close`}.`
    : `${name}: ${pts.map((p) => `${hm(p.t)} ${p.v}`).join(', ')}.${shortAt.length ? ` Short for ${shortAt.map((p) => p.ref).join(' and ')}.` : ''}`)
    + (alt ? ` With ${alt.no}: ${alt.left} by close.` : ''));

  return (
    <div ref={setRefs} className={wrap}>
      <svg role="img" aria-label={spoken} width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block overflow-visible text-small">
        <g aria-hidden="true">
          {hourTicks.map((k) => (
            <g key={k.h}>
              <text x={k.hx} y={14} textAnchor={k.anc} className={cn('text-small tabular-nums', t.muted)}>{`${k.h}:00`}</text>
              <line x1={k.hx} x2={k.hx} y1={24} y2={top + ph} className="stroke-rule" />
            </g>
          ))}
          {shortAt[0] && <rect x={x(shortAt[0].t)} y={y(0)} width={x(CLOSE) - x(shortAt[0].t)} height={Math.max(2, y(lo) - y(0))} className="fill-bad-bg" />}
          {rate?.tz ? <rect x={x(rate.tz)} y={y(0) - 10} width={x(CLOSE) - x(rate.tz)} height={10} className="fill-bad-bg" /> : null}
          <line x1={L} x2={L + PW} y1={y(0)} y2={y(0)} className="stroke-control" />
          <text x={0} y={y(0) + 4} className={cn('text-small tabular-nums', t.muted)}>0</text>
          <text x={0} y={y(hi) + 4} className={cn('text-small tabular-nums', t.muted)}>{hi}</text>
          <text x={0} y={y(hi) - 10} className={cn('text-small', t.muted)}>pc</text>
          <path d={d(part(OPEN, now))} fill="none" strokeWidth={2} className="stroke-accent forced-colors:stroke-[CanvasText]" />
          {rate ? (
            <>
              <path d={d(rate.tz ? [[now, rate.vNow], [rate.tz, 0], [CLOSE, 0]] : [[now, rate.vNow], [CLOSE, rate.end]])} fill="none" strokeWidth={2} strokeDasharray="5 4" className="stroke-accent forced-colors:stroke-[CanvasText]" />
              <text x={x(now) + 8} y={y(vNow) - 8} className={cn('text-small tabular-nums', t.ink)}>{Math.round(vNow)}</text>
              {rate.tz ? (
                <text x={Math.min(x(rate.tz) + 6, L + PW - 4)} y={y(0) - 16} textAnchor={x(rate.tz) > L + PW - 120 ? 'end' : 'start'} className={cn('text-small tabular-nums', t.bad)}>{`out about ${hm(rate.tz)}`}</text>
              ) : (
                <text x={L + PW + 6} y={y(rate.end) + 4} className={cn('text-small tabular-nums', t.acc)}>{rate.end}</text>
              )}
            </>
          ) : (
            <>
              <path d={d(part(now, CLOSE))} fill="none" strokeWidth={2} strokeDasharray="5 4" className="stroke-accent forced-colors:stroke-[CanvasText]" />
              <text x={nx + 8} y={y(vAt(now)) - (small ? 10 : 8)} className={cn('text-small tabular-nums', t.ink)}>{vAt(now)}</text>
              {pts.filter((pt) => pt.t > now && pt.kind !== 'del').map((pt, i) => {
                const bad = pt.v < 0, tx = x(pt.t) + 6;
                if (tx > L + PW - 4) return null;
                return <text key={i} x={tx} y={y(pt.v) + (bad ? 16 : small ? -10 : -8)} className={cn('text-small tabular-nums', bad ? t.bad : t.ink)}>{bad ? MINUS + Math.abs(pt.v) : pt.v}</text>;
              })}
              <text x={L + PW + 6} y={y(end) + 4} className={cn('text-small tabular-nums', end < 0 ? t.bad : t.acc)}>{end < 0 ? MINUS + Math.abs(end) : end}</text>
            </>
          )}
          {alt && !small && (
            <>
              <line x1={x(alt.at)} x2={x(alt.at)} y1={top - 4} y2={y(vAt(alt.at))} strokeDasharray="2 3" className="stroke-muted" />
              <text x={x(alt.at) - 6} y={top - 8} textAnchor="end" className={cn('text-small', t.muted)}>{`with ${alt.no}: ${alt.left} left`}</text>
            </>
          )}
          {small ? (
            <>
              <line x1={nx} x2={nx} y1={20} y2={top + ph + 8} strokeWidth={2} className="stroke-accent" />
              <rect x={nx - 31} y={top + ph + 8} width={62} height={20} rx={4} className="fill-accent" />
              <text x={nx} y={top + ph + 22} textAnchor="middle" className="fill-accent-ink text-small font-semibold">{`Now ${hm(now)}`}</text>
            </>
          ) : (
            <>
              <line x1={nx} x2={nx} y1={20} y2={top + ph} strokeWidth={2} className="stroke-accent" />
              <rect x={nx - 31} y={0} width={62} height={20} rx={4} className="fill-accent" />
              <text x={nx} y={14} textAnchor="middle" className="fill-accent-ink text-small font-semibold">{`Now ${hm(now)}`}</text>
            </>
          )}
        </g>
      </svg>
      {caption && <p className="mt-1 text-small text-muted">{caption}</p>}
      {alt && small && <p className="mt-2 text-small text-muted">{`With ${alt.no}: ${alt.left} left when it arrives.`}</p>}
    </div>
  );
});
