import { forwardRef } from 'react';
import * as RadixAvatar from '@radix-ui/react-avatar';
import { cn } from '../utils/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface AvatarProps {
  /** Image URL; falls back to initials when absent or failed. */
  src?: string;
  /** Full name — used for alt text and initials. */
  name: string;
  size?: AvatarSize;
  shape?: 'circle' | 'square';
  /** Presence dot. */
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

const sizes: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[0.625rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const statusColor = {
  online: 'bg-success',
  offline: 'bg-neutral-400',
  busy: 'bg-error',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** User avatar with image + initials fallback and optional presence dot. */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, name, size = 'md', shape = 'circle', status, className },
  ref,
) {
  return (
    <span ref={ref} className={cn('relative inline-flex shrink-0', className)}>
      <RadixAvatar.Root
        className={cn(
          'inline-flex select-none items-center justify-center overflow-hidden bg-primary-100 font-medium text-primary-800',
          shape === 'circle' ? 'rounded-full' : 'rounded-md',
          sizes[size],
        )}
      >
        <RadixAvatar.Image src={src} alt={name} className="h-full w-full object-cover" />
        <RadixAvatar.Fallback delayMs={src ? 200 : 0} className="leading-none">
          {initials(name)}
        </RadixAvatar.Fallback>
      </RadixAvatar.Root>
      {status && (
        <span
          aria-label={status}
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-surface',
            size === 'xs' ? 'h-1.5 w-1.5' : 'h-2.5 w-2.5',
            statusColor[status],
          )}
        />
      )}
    </span>
  );
});
