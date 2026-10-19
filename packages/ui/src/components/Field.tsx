import {
  createContext,
  useContext,
  useId,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../utils/cn';

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = createContext<FieldContextValue | null>(null);

/** Controls (Input, Textarea, Select…) read field wiring from here. */
export function useField(): FieldContextValue | null {
  return useContext(FieldContext);
}

export interface FieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  label?: ReactNode;
  /** Helper text below the control. */
  hint?: ReactNode;
  /** Error message; sets the control invalid and replaces the hint visually. */
  error?: ReactNode;
  required?: boolean;
  /** Provide an explicit id; otherwise one is generated. */
  htmlFor?: string;
  children: ReactNode;
}

/**
 * Labelled form field: renders the label, the control, and help/error text,
 * and wires `id` + `aria-describedby` + `aria-invalid` to the control through
 * context. Use with any DS control, or standalone with a native input.
 */
export const Field = forwardRef<HTMLDivElement, FieldProps>(function Field(
  { label, hint, error, required = false, htmlFor, className, children, ...rest },
  ref,
) {
  const generated = useId();
  const id = htmlFor ?? generated;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error), required }}>
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)} {...rest}>
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
            {required && <span className="ml-0.5 text-error-fg">*</span>}
          </label>
        )}
        {children}
        {error ? (
          <p id={errorId} className="text-xs text-error-fg">
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="text-xs text-ink-muted">
              {hint}
            </p>
          )
        )}
      </div>
    </FieldContext.Provider>
  );
});
