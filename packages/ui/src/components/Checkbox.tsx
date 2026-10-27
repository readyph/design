import { forwardRef, useCallback, useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Check, Minus } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Visible label, a real `<label>`. */
  label?: ReactNode;
  /** One line under the label. */
  hint?: ReactNode;
  /** Mixed state: sets `aria-checked="mixed"` and shows a dash. */
  indeterminate?: boolean;
}

/** Checkbox (RDY-314): native input (Space toggles, form-friendly) drawn with tokens, with label, hint, indeterminate and a forced-colors check mark. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, indeterminate = false, disabled, id, className, ...rest },
  ref,
) {
  const auto = useId();
  const inputId = id ?? auto;
  const hintId = `${inputId}-hint`;
  const inner = useRef<HTMLInputElement | null>(null);
  const setRef = useCallback(
    (node: HTMLInputElement | null) => {
      inner.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  const box = (
    <span className="relative mt-0.5 inline-grid h-4 w-4 shrink-0 place-items-center">
      <input
        ref={setRef}
        id={inputId}
        type="checkbox"
        disabled={disabled}
        aria-checked={indeterminate ? 'mixed' : undefined}
        aria-describedby={hint ? hintId : undefined}
        className={cn(
          'peer h-4 w-4 cursor-pointer appearance-none rounded-[4px] border border-control bg-surface transition-colors duration-hover motion-reduce:transition-none',
          'checked:border-accent checked:bg-accent indeterminate:border-accent indeterminate:bg-accent aria-[checked=mixed]:border-accent aria-[checked=mixed]:bg-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'forced-colors:border-[CanvasText] forced-colors:checked:bg-[Highlight] forced-colors:aria-[checked=mixed]:bg-[Highlight] forced-colors:disabled:border-[GrayText]',
          focusRing,
          !label && className,
        )}
        {...rest}
      />
      <Check aria-hidden weight="bold" size={12} className="pointer-events-none absolute hidden text-accent-ink peer-checked:block peer-aria-[checked=mixed]:hidden forced-colors:text-[HighlightText]" />
      <Minus aria-hidden weight="bold" size={12} className="pointer-events-none absolute hidden text-accent-ink peer-aria-[checked=mixed]:block forced-colors:text-[HighlightText]" />
    </span>
  );

  if (!label) return box;
  return (
    <label htmlFor={inputId} className={cn('flex items-start gap-3 max-sm:min-h-11', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className)}>
      {box}
      <span className="flex min-w-0 flex-col">
        <span className={cn('text-body', disabled ? 'text-muted' : 'text-text')}>{label}</span>
        {hint && (
          <span id={hintId} className="text-small text-muted">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
});
