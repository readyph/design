/* inventory-home FINAL home.js 606-612: the runway shrunk to an inline step line (phone) */
export interface StepLinePoint {
  /** Time on the same scale as now/open/close (minutes). */
  t: number;
  /** Stock on hand from this point on. */
  v: number;
  /** 'del' points are deliveries: their value is ignored when scaling, as in the runway. */
  kind?: string;
}

export interface StepLineProps {
  points: StepLinePoint[];
  now: number;
  open: number;
  close: number;
  /** Stock on hand at close; shown after the line, in the bad colour with a minus sign when negative. */
  end: number;
  width?: number;
  height?: number;
  'aria-label'?: string;
}

export function StepLine({ points, now, open, close, end, width: W = 220, height: H = 30, 'aria-label': ariaLabel }: StepLineProps) {
  const lo = Math.min(0, ...points.map((p) => (p.kind === 'del' ? 0 : p.v)));
  const hi = Math.max(6, ...points.filter((p) => p.kind !== 'del').map((p) => p.v));
  const xt = (t: number) => Math.max(0, Math.min(100, ((t - open) / (close - open)) * 100));
  const x = (t: number) => (xt(t) / 100) * W;
  const y = (v: number) => (v > hi ? 1 : H - 3 - ((v - lo) / (hi - lo)) * (H - 6));
  let d = `M0 ${y(points[0]?.v ?? 0)}`;
  points.slice(1).forEach((p) => { d += ` H${x(p.t)} V${y(p.v)}`; });
  d += ` H${W}`;
  const aria = ariaLabel ?? `Stock steps: ${points.map((p) => `${p.t} ${p.v}`).join(', ')}.`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="overflow-visible">
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} className="stroke-control" />
      <line x1={x(now)} x2={x(now)} y1="0" y2={H} strokeWidth="1.5" className="stroke-accent" />
      <path d={d} fill="none" strokeWidth="2" className="stroke-accent" />
      {end < 0
        ? <text x={W + 6} y={y(end) + 4} className="fill-bad text-[12px] font-semibold">−{Math.abs(end)}</text>
        : <text x={W + 6} y={y(Math.min(end, hi)) + 4} className="fill-text text-[12px] font-medium">{end}</text>}
    </svg>
  );
}
