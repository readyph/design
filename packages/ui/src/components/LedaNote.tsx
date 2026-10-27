import { forwardRef, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { Prohibit } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { LedaMark } from './Leda';

/**
 * Leda note and refusal (RDY-298, handover C38). Two small raised boxes for Leda's voice
 * inside a page or a conversation. Both sit on `--raised`, 6px radius, 10x12px padding.
 * They read well on `--frame` and on `--surface` (axe-checked in both themes).
 */

const box = 'block min-w-0 max-w-full rounded-card bg-raised px-3 py-2.5 text-body text-text [overflow-wrap:anywhere]';

export interface LedaNoteProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The note. Guidance: at most two sentences. Never truncated, so longer text wraps. */
  children: ReactNode;
  /** Who and when, e.g. "Leda, 9:12 AM" (12px, muted). Optional. */
  byline?: ReactNode;
  /** Accessible name. Default "Leda note". */
  label?: string;
}

/** Leda note (`.lnote`): 16px Leda tile, 14/20 text, optional byline. A `note` role, not a live region. */
export const LedaNote = forwardRef<HTMLDivElement, LedaNoteProps>(function LedaNote(
  { children, byline, label = 'Leda note', className, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="note" aria-label={label} {...rest} className={cn(className, box, 'flex items-start gap-2.5')}>
      <span aria-hidden className="mt-0.5 shrink-0">
        <LedaMark size={16} tile decorative />
      </span>
      <div className="min-w-0 flex-1">
        <p>{children}</p>
        {byline && <p className="mt-0.5 text-small text-muted">{byline}</p>}
      </div>
    </div>
  );
});

export interface LedaRefusalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** One-line reason, e.g. "Leda can't write to Repair shop yet." Wraps on narrow widths, never truncated. */
  children: ReactNode;
  /** The way out: a `LedaNoteLink`, or a `Button` (use `variant="secondary"`) such as "Open Auto Works". */
  action?: ReactNode;
  /** Accessible name. Default "Leda can't do this". */
  label?: string;
}

/**
 * Refusal (`.refuse`): Prohibit icon, the reason, then a way out. A `note` role (not `alert`:
 * it is an answer, not an interruption). The reason is a sentence of its own, so the icon is hidden.
 */
export const LedaRefusal = forwardRef<HTMLDivElement, LedaRefusalProps>(function LedaRefusal(
  { children, action, label = "Leda can't do this", className, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="note" aria-label={label} {...rest} className={cn(className, box, 'flex flex-wrap items-center gap-x-3 gap-y-2')}>
      <p className="flex min-w-0 flex-1 basis-48 items-start gap-2">
        <Prohibit aria-hidden size={16} weight="bold" className="mt-0.5 shrink-0 text-muted" />
        <span className="min-w-0">{children}</span>
      </p>
      {action && <div className="flex min-w-0 shrink-0 items-center">{action}</div>}
    </div>
  );
});

export type LedaNoteLinkProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/** Plain text link for the refusal's way out. Accent text, underlined, focus ring that works on `--raised`. */
export const LedaNoteLink = forwardRef<HTMLAnchorElement, LedaNoteLinkProps>(function LedaNoteLink({ className, ...rest }, ref) {
  return (
    <a
      ref={ref}
      {...rest}
      className={cn(
        'inline-flex min-h-6 items-center rounded-chip text-ui font-medium text-accent underline underline-offset-2 hover:text-accent-hover max-sm:min-h-11',
        focusRing,
        className,
      )}
    />
  );
});
