import { type ReactNode } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';

export interface ErrorBlockProps {
  /** What failed to load, in the user's words: "Couldn't load your {thing}." */
  thing: string;
  /** When it last loaded, e.g. "9:10 AM". Omit if it never loaded. */
  lastLoaded?: string;
  /** Called by "Try again". Omit to hide the button. */
  onRetry?: () => void;
  /** Disable the button and show "Trying again..." while a retry runs. */
  retrying?: boolean;
  /** Button text. Default "Try again". */
  retryLabel?: string;
  /** Extra detail under the message, kept short. */
  children?: ReactNode;
  className?: string;
}

/**
 * Inline error block (C32): a dashed block placed inside the region that failed, not a page.
 * "Couldn't load your {thing}. Last loaded 9:10 AM." with a Try again button. Announced to screen readers when it appears.
 */
export function ErrorBlock({ thing, lastLoaded, onRetry, retrying = false, retryLabel = 'Try again', children, className }: ErrorBlockProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-start gap-3 rounded-card border border-dashed border-control bg-surface px-pad py-row-y sm:flex-row sm:items-center', className)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <WarningCircle aria-hidden size={20} weight="fill" className="mt-0.5 shrink-0 text-bad" />
        <div className="flex min-w-0 flex-col">
          <p className="text-body font-semibold text-text">Couldn&rsquo;t load your {thing}.</p>
          {lastLoaded && <p className="text-small text-muted">Last loaded {lastLoaded}.</p>}
          {children && <div className="mt-1 text-small text-muted">{children}</div>}
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className={cn(
            'inline-flex h-8 shrink-0 items-center justify-center rounded-control border border-control bg-surface px-3 text-ui font-medium text-text transition-colors duration-hover max-sm:min-h-11',
            'hover:bg-raised disabled:cursor-not-allowed disabled:opacity-50',
            focusRing,
          )}
        >
          {retrying ? 'Trying again…' : retryLabel}
        </button>
      )}
    </div>
  );
}
