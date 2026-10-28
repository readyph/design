import { cn } from '../utils/cn';

export type SparklineTone = 'primary' | 'success' | 'error' | 'neutral';

export interface SparklineProps {
  /** Series of numbers; drawn left → right. */
  points: number[];
  width?: number;
  height?: number;
  tone?: SparklineTone;
  /** Fill the area under the line. */
  area?: boolean;
  className?: string;
}

const toneClass: Record<SparklineTone, string> = {
  primary: 'text-accent forced-colors:text-[CanvasText]',
  success: 'text-ok-ink forced-colors:text-[CanvasText]',
  error: 'text-bad-ink forced-colors:text-[CanvasText]',
  neutral: 'text-faint forced-colors:text-[CanvasText]',
};

/** A tiny, axis-less line chart for trends inside tiles and rows. */
export function Sparkline({ points, width = 64, height = 20, tone = 'primary', area = false, className }: SparklineProps) {
  const finite = points.filter(Number.isFinite);
  if (finite.length < 2) {
    // Empty state: a flat dashed baseline instead of a path.
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn(toneClass.neutral, className)} fill="none" aria-hidden="true" data-empty="">
        <line x1={0} x2={width} y1={height / 2} y2={height / 2} stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" strokeLinecap="round" />
      </svg>
    );
  }
  const max = Math.max(...finite);
  const min = Math.min(...finite);
  const norm = (v: number) => (max === min ? height / 2 : height - ((v - min) / (max - min)) * height);
  const step = width / (points.length - 1);
  // Non-finite values leave gaps: split into runs of consecutive finite points.
  const runs: string[][] = [[]];
  points.forEach((p, i) => {
    if (Number.isFinite(p)) runs[runs.length - 1]!.push(`${(i * step).toFixed(1)},${norm(p).toFixed(1)}`);
    else if (runs[runs.length - 1]!.length) runs.push([]);
  });
  const drawn = runs.filter((r) => r.length > 0);
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn(toneClass[tone], className)} fill="none" aria-hidden="true">
      {drawn.map((r, k) => (
        <g key={k}>
          {area && r.length > 1 && (
            <polygon points={`${r[r.length - 1]!.split(',')[0]},${height} ${r[0]!.split(',')[0]},${height} ${r.join(' ')}`} fill="currentColor" opacity={0.12} />
          )}
          {r.length > 1 ? (
            <polyline points={r.join(' ')} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <circle cx={r[0]!.split(',')[0]} cy={r[0]!.split(',')[1]} r={1} fill="currentColor" />
          )}
        </g>
      ))}
    </svg>
  );
}
