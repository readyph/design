import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export type BadgeTone = 'neutral' | 'ok' | 'warn' | 'bad' | 'err' | 'accent';

/** Legacy tone names, mapped to the current tones. Prefer the new names. */
export type LegacyBadgeTone = 'primary' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone | LegacyBadgeTone;
  /** Show a leading 7px status dot. */
  dot?: boolean;
  /** Slow pulse on the dot for a live Running state. Off by default and under reduced motion. */
  pulse?: boolean;
  children?: ReactNode;
}

const legacy: Record<LegacyBadgeTone, BadgeTone> = {
  primary: 'accent',
  success: 'ok',
  warning: 'warn',
  error: 'bad',
  info: 'accent',
};

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-raised-2 text-muted',
  ok: 'bg-ok-bg text-ok-ink',
  warn: 'bg-warn-bg text-warn-ink',
  bad: 'bg-bad-bg text-bad-ink',
  err: 'bg-raised-2 text-muted',
  accent: 'bg-accent-tint text-accent',
};

const dots: Record<BadgeTone, string> = {
  neutral: 'bg-faint',
  ok: 'bg-ok-dot',
  warn: 'bg-warn-dot',
  bad: 'bg-bad-dot',
  err: 'bg-control',
  accent: 'bg-accent',
};

/** Status pill: 20px high, 4px radius, 12px medium text. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', dot = false, pulse = false, className, children, ...rest },
  ref,
) {
  const t: BadgeTone = tone in legacy ? legacy[tone as LegacyBadgeTone] : (tone as BadgeTone);
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex h-5 items-center gap-1.5 whitespace-nowrap rounded-chip px-1.5 text-small font-medium',
        tones[t],
        className,
      )}
      {...rest}
    >
      {dot && <span aria-hidden className={cn('h-[7px] w-[7px] shrink-0 rounded-full', dots[t], pulse && 'motion-safe:animate-pulse')} />}
      {children}
    </span>
  );
});
