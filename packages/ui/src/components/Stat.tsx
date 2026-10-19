import { type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import { Sparkline, type SparklineTone } from './Sparkline';

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  /** Small change indicator, e.g. "+12%". */
  delta?: ReactNode;
  deltaTone?: 'success' | 'error' | 'neutral';
  icon?: PhosphorIcon;
  /** Optional trend sparkline. */
  points?: number[];
  sparklineTone?: SparklineTone;
  className?: string;
}

const deltaClass = { success: 'text-success-fg', error: 'text-error-fg', neutral: 'text-ink-subtle' };

/**
 * A flat metric: label, big value, optional delta and trend sparkline. No card
 * chrome — drop it into a grid, a row, or a panel.
 */
export function Stat({ label, value, delta, deltaTone = 'success', icon, points, sparklineTone = 'primary', className }: StatProps) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="flex items-center gap-1.5 text-xs text-ink-subtle">
        {icon && <Icon icon={icon} size="sm" />}
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <span className="truncate text-2xl font-semibold tabular-nums text-ink">{value}</span>
        {points && <Sparkline points={points} tone={sparklineTone} />}
      </div>
      {delta && <p className={cn('mt-0.5 text-xs', deltaClass[deltaTone])}>{delta}</p>}
    </div>
  );
}
