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
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const norm = (v: number) => (max === min ? height / 2 : height - ((v - min) / (max - min)) * height);
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => `${(i * step).toFixed(1)},${norm(p).toFixed(1)}`);
  const line = coords.join(' ');
  const areaPath = `${width},${height} 0,${height} ${line}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn(toneClass[tone], className)} fill="none" aria-hidden="true">
      {area && <polygon points={areaPath} fill="currentColor" opacity={0.12} />}
      <polyline points={line} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
