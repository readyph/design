import { type CSSProperties, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface AnchorProps {
  /** Horizontal position, 0-100, percent of the positioned parent. */
  x: number;
  /** Vertical position, 0-100, percent of the positioned parent. */
  y: number;
  children: ReactNode;
  className?: string;
}

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0);

/**
 * Places `children` centred on a point of the nearest positioned ancestor.
 * The position is applied through the `--anchor-x` / `--anchor-y` CSS variables,
 * so consumers never write inline styles.
 */
export function Anchor({ x, y, children, className }: AnchorProps) {
  const vars = { '--anchor-x': `${clamp(x)}%`, '--anchor-y': `${clamp(y)}%` } as CSSProperties;
  return (
    <div
      style={vars}
      className={cn('absolute left-[var(--anchor-x)] top-[var(--anchor-y)] -translate-x-1/2 -translate-y-1/2', className)}
    >
      {children}
    </div>
  );
}
