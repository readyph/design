import { forwardRef, type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export type FactTone = 'default' | 'ok' | 'warn' | 'bad' | 'muted';

export interface FactsLineProps extends HTMLAttributes<HTMLUListElement> {
  /** Give the list a name when it needs one, e.g. "Case facts". */
  'aria-label'?: string;
  children?: ReactNode;
}

export interface FactProps extends Omit<LiHTMLAttributes<HTMLLIElement>, 'value'> {
  /** Colours the bold value: bad / warn for time left, ok for "Leda acts in", muted for "can't act yet". */
  tone?: FactTone;
  /** The bold part of the fact. The children are the muted label around it. */
  value?: ReactNode;
  /** Put the value before the label (default: label first). */
  valueFirst?: boolean;
}

const valueTone: Record<FactTone, string> = {
  default: 'text-text',
  ok: 'text-ok-ink',
  warn: 'text-warn-ink',
  bad: 'text-bad-ink',
  muted: 'text-muted',
};

/**
 * Facts line (C37): a wrapping row of short facts, 13/20 muted with bold values.
 * Facts are separated by 3px dots that sit in a 23px gutter at the start of each fact. The list is
 * shifted left by 23px inside an overflow-hidden wrapper, so the gutter of the first fact on every
 * wrapped line is clipped and no line ever starts with a separator. `className` goes on the outer
 * wrapper (layout, margins), never on the `ul`, so a caller margin cannot undo the -23px shift.
 * Long unbreakable values wrap inside their fact instead of being clipped.
 */
export const FactsLine = forwardRef<HTMLUListElement, FactsLineProps>(function FactsLine(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <ul ref={ref} className="-ml-[23px] flex list-none flex-wrap p-0 text-ui leading-5 text-muted" {...rest}>
        {children}
      </ul>
    </div>
  );
});

/** One fact. Children are the muted label, `value` is the bold part. */
export const Fact = forwardRef<HTMLLIElement, FactProps>(function Fact(
  { tone = 'default', value, valueFirst = false, className, children, ...rest },
  ref,
) {
  const v = value != null && <strong className={cn('font-semibold', valueFirst && 'mr-[2.75px]', valueTone[tone])}>{value}</strong>;
  return (
    <li ref={ref} className={cn('relative min-w-0 pl-[23px] [overflow-wrap:anywhere]', className)} {...rest}>
      <span aria-hidden className="absolute left-[10px] top-1/2 h-[3px] -translate-y-1/2 w-[3px] rounded-full bg-control" />
      {valueFirst && v}
      {valueFirst && children != null && ' '}
      {children}
      {!valueFirst && v && children != null && ' '}
      {!valueFirst && v}
    </li>
  );
});
