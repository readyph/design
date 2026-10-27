import { type ChangeEvent } from 'react';
import { cn } from '../utils/cn';

export interface TextFieldProps {
  id: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  /** Muted help under the box, 12/16. Replaced by `error` when both are set. */
  hint?: string;
  /** Error text under the box (bad ink) and a bad border. */
  error?: string;
  /** Fixed suffix joined to the box (e.g. `minutes`). */
  unit?: string;
  type?: 'text' | 'tel' | 'number';
  required?: boolean;
  /** Character limit (text and tel only). Default 120. */
  max?: number;
  /** Margins and grid placement only (e.g. `sm:col-span-2`). */
  className?: string;
}

const box =
  'block h-[var(--ctl-dropdown)] w-full min-w-0 rounded-control border bg-surface px-3 text-body text-text placeholder:text-muted focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent';

/**
 * Labelled text box (the workshop `.field`): a 14/20 medium label, a 40px box (44px on a phone) 8px below it with a 1px control border,
 * and a 12/16 hint or error 6px below the box. Focus draws the accent outline 2px at 1px offset and turns the border accent.
 * The label is tied to the box with `htmlFor`; the hint or error is `aria-describedby`. Fills its grid cell: put it in a two-column grid with a 24px row gap.
 */
export function TextField({ id, label, value, onChange, hint, error, unit, type = 'text', required, max = 120, className }: TextFieldProps) {
  const d = hint || error ? `${id}-d` : undefined;
  const input = (
    <input
      id={id}
      type={type}
      inputMode={type === 'number' ? 'numeric' : undefined}
      min={type === 'number' ? 0 : undefined}
      maxLength={type === 'number' ? undefined : max}
      value={value}
      required={required}
      autoComplete="off"
      aria-invalid={error ? true : undefined}
      aria-describedby={d}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className={cn(box, error ? 'border-bad' : 'border-control', unit && 'pr-[84px]')}
    />
  );
  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={id} className="block text-body font-medium text-text">{label}</label>
      <div className="mt-2">
        {unit ? (
          <div className="relative">
            {input}
            <span className="pointer-events-none absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-ui text-muted">{unit}</span>
          </div>
        ) : input}
      </div>
      {error ? <p id={d} className="m-0 mt-1.5 text-small text-bad-ink">{error}</p> : hint ? <p id={d} className="m-0 mt-1.5 text-small text-muted">{hint}</p> : null}
    </div>
  );
}
