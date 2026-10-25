import { type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export type StatusTone = 'neutral' | 'ok' | 'warn' | 'bad' | 'accent';

/** Legacy names: active -> ok, degraded -> warn, offline -> bad. Prefer the new names. */
export type LegacyStatusTone = 'active' | 'degraded' | 'offline';

export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
  status?: StatusTone | LegacyStatusTone;
  /** Optional text beside the dot, e.g. "Running" or "Offline since Wed 18:05". */
  label?: string;
}

const legacy: Record<LegacyStatusTone, StatusTone> = { active: 'ok', degraded: 'warn', offline: 'bad' };

const toneBg: Record<StatusTone, string> = {
  neutral: 'bg-faint',
  ok: 'bg-ok-dot',
  warn: 'bg-warn-dot',
  bad: 'bg-bad-dot',
  accent: 'bg-accent',
};

/** A 7px status dot, optionally with a label. Used for platform and connection health. */
export function StatusDot({ status = 'neutral', label, className, ...rest }: StatusDotProps) {
  const t: StatusTone = status in legacy ? legacy[status as LegacyStatusTone] : (status as StatusTone);
  const dot = <span aria-hidden className={cn('inline-block h-[7px] w-[7px] shrink-0 rounded-full', toneBg[t])} />;
  if (!label) {
    return (
      <span role="img" aria-label={t} className={cn('inline-flex', className)} {...rest}>
        {dot}
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-small text-muted', className)} {...rest}>
      {dot}
      {label}
    </span>
  );
}
