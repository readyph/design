import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  /** Show a leading status dot. */
  dot?: boolean;
  children?: ReactNode;
}

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-tint-gray-bg text-tint-gray-fg',
  primary: 'bg-tint-blue-bg text-tint-blue-fg',
  success: 'bg-tint-green-bg text-tint-green-fg',
  info: 'bg-tint-teal-bg text-tint-teal-fg',
  warning: 'bg-warning/15 text-warning-fg',
  error: 'bg-error/10 text-error-fg',
};

const dots: Record<BadgeTone, string> = {
  neutral: 'bg-tint-gray-fg',
  primary: 'bg-primary-500',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  error: 'bg-error',
};

/** A small pill for statuses and labels. */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { tone = 'neutral', size = 'md', dot = false, className, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[0.6875rem]' : 'px-2.5 py-0.5 text-xs',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  );
});
