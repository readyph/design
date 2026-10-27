import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

interface FieldChrome {
  /** Visible label, rendered as a real `<label for>`. */
  label: ReactNode;
  /** Helper text under the field. Replaced by `error` while there is one. */
  hint?: ReactNode;
  /** Error text under the field; also sets `aria-invalid`. */
  error?: ReactNode;
  /** Wrapper class (the field itself is not restyled). */
  className?: string;
  /** `default` is the 32px field (40px phone). `large` is the 40px field (44px phone) with 14px text, for pages laid out around it. */
  size?: 'default' | 'large';
  /** Label look: `strong` (default, medium weight) or `quiet` (small, muted). */
  labelTone?: 'strong' | 'quiet';
  /** Show the asterisk on a required field (default true). The field stays `required` either way. */
  requiredMark?: boolean;
  /** Draw the error border and set `aria-invalid` without text here, when the error text is shown by another field. */
  invalid?: boolean;
}

export interface TextFieldProps extends FieldChrome, Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'className'> {
  type?: 'text' | 'email' | 'tel' | 'number';
  /** Suffix inside the field, such as "bays" or "₱ / hour". Read as part of the description, not the name. */
  unit?: string;
}

export interface TextareaProps extends FieldChrome, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  rows?: number;
}

const base =
  'block w-full min-w-0 bg-transparent text-text placeholder:text-muted outline-none disabled:cursor-not-allowed disabled:text-faint';
const box =
  'flex w-full min-w-0 rounded-control border bg-surface transition-colors duration-hover motion-reduce:transition-none focus-within:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent forced-colors:border-[CanvasText] forced-colors:focus-within:outline-[Highlight]';

const boxState = (error: boolean, disabled?: boolean) =>
  cn(error ? 'border-bad' : 'border-control', disabled && 'bg-raised forced-colors:border-[GrayText]');

function Shell({
  id,
  label,
  hint,
  error,
  required,
  className,
  labelTone,
  requiredMark = true,
  children,
}: FieldChrome & { id: string; required?: boolean; children: ReactNode }) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className={cn('mb-1 block', labelTone === 'quiet' ? 'text-small text-muted' : 'text-ui font-medium text-text', required && requiredMark && "after:ml-0.5 after:text-bad-ink after:content-['*']")}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="m-0 mt-1 text-small text-bad-ink">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="m-0 mt-1 text-small text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error: ReactNode, hint: ReactNode, extra: string[], given?: string) =>
  [given, error ? `${id}-error` : hint ? `${id}-hint` : undefined, ...extra].filter(Boolean).join(' ') || undefined;

/**
 * Single-line text field (C43): real label, hint, error and an optional unit suffix.
 * 32px tall (40px on phone), 13px text, tokens only.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, unit, type = 'text', required, disabled, className, size = 'default', labelTone, requiredMark, invalid, id: idProp, 'aria-describedby': given, ...rest },
  ref,
) {
  const uid = useId();
  const id = idProp ?? `${uid}-field`;
  const unitId = `${id}-unit`;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required} className={className} labelTone={labelTone} requiredMark={requiredMark}>
      <div className={cn(box, size === 'large' ? 'h-[var(--ctl-dropdown)]' : 'h-[var(--ctl-button)]', boxState(!!error || !!invalid, disabled))}>
        <input
          {...rest}
          ref={ref}
          id={id}
          type={type}
          inputMode={rest.inputMode ?? (type === 'number' ? 'numeric' : undefined)}
          required={required}
          disabled={disabled}
          aria-invalid={error || invalid ? true : undefined}
          aria-describedby={describedBy(id, error, hint, unit ? [unitId] : [], given)}
          className={cn(base, size === 'large' ? 'text-body' : 'text-ui', 'h-full px-3')}
        />
        {unit ? (
          <span id={unitId} className="grid shrink-0 place-items-center border-l border-control bg-raised px-3 text-ui text-muted">
            {unit}
          </span>
        ) : null}
      </div>
    </Shell>
  );
});

/** Multi-line text field (C43). Height is set by `rows` (default 3); it scrolls past that. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, rows = 3, required, disabled, className, size = 'default', labelTone, requiredMark, invalid, id: idProp, 'aria-describedby': given, ...rest },
  ref,
) {
  const uid = useId();
  const id = idProp ?? `${uid}-field`;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required} className={className} labelTone={labelTone} requiredMark={requiredMark}>
      <div className={cn(box, boxState(!!error || !!invalid, disabled))}>
        <textarea
          {...rest}
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          disabled={disabled}
          aria-invalid={error || invalid ? true : undefined}
          aria-describedby={describedBy(id, error, hint, [], given)}
          className={cn(base, 'resize-none px-3 py-2', size === 'large' ? 'text-body' : 'text-ui max-sm:py-2.5')}
        />
      </div>
    </Shell>
  );
});
