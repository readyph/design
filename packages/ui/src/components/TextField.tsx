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
  'block w-full min-w-0 bg-transparent text-ui text-text placeholder:text-muted outline-none disabled:cursor-not-allowed disabled:text-faint';
const box =
  'flex w-full min-w-0 rounded-control border bg-surface transition-colors duration-hover motion-reduce:transition-none focus-within:border-accent focus-within:outline focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-accent forced-colors:border-[CanvasText] forced-colors:focus-within:outline-[Highlight]';

const boxState = (error: boolean, disabled?: boolean) =>
  cn(error ? 'border-bad' : 'border-control', disabled && 'bg-raised opacity-70 forced-colors:border-[GrayText]');

function Shell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldChrome & { id: string; required?: boolean; children: ReactNode }) {
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className={cn('mb-1 block text-ui font-medium text-text', required && "after:ml-0.5 after:text-bad-ink after:content-['*']")}>
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
  { label, hint, error, unit, type = 'text', required, disabled, className, id: idProp, 'aria-describedby': given, ...rest },
  ref,
) {
  const uid = useId();
  const id = idProp ?? `${uid}-field`;
  const unitId = `${id}-unit`;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className={cn(box, 'h-[var(--ctl-button)]', boxState(!!error, disabled))}>
        <input
          {...rest}
          ref={ref}
          id={id}
          type={type}
          inputMode={rest.inputMode ?? (type === 'number' ? 'numeric' : undefined)}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint, unit ? [unitId] : [], given)}
          className={cn(base, 'h-full px-3')}
        />
        {unit ? (
          <span id={unitId} className="grid shrink-0 place-items-center border-l border-control px-3 text-ui text-muted">
            {unit}
          </span>
        ) : null}
      </div>
    </Shell>
  );
});

/** Multi-line text field (C43). Height is set by `rows` (default 3); it scrolls past that. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, rows = 3, required, disabled, className, id: idProp, 'aria-describedby': given, ...rest },
  ref,
) {
  const uid = useId();
  const id = idProp ?? `${uid}-field`;
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required} className={className}>
      <div className={cn(box, boxState(!!error, disabled))}>
        <textarea
          {...rest}
          ref={ref}
          id={id}
          rows={rows}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint, [], given)}
          className={cn(base, 'resize-none px-3 py-2 max-sm:py-2.5')}
        />
      </div>
    </Shell>
  );
});
