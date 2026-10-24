import { forwardRef, type InputHTMLAttributes } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import { useField } from './Field';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  inputSize?: InputSize;
  /** Mark invalid when used outside a `<Field error>`. */
  invalid?: boolean;
  leftIcon?: PhosphorIcon;
  rightIcon?: PhosphorIcon;
}

const sizes: Record<InputSize, string> = {
  sm: 'h-sm text-sm',
  md: 'h-md text-sm',
  lg: 'h-lg text-base',
};

export const inputBase =
  'w-full rounded-base border bg-surface text-ink placeholder:text-ink-subtle transition-colors duration-DEFAULT outline-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle';

export function inputState(invalid: boolean): string {
  return invalid
    ? 'border-error focus-visible:border-error focus-visible:ring-2 focus-visible:ring-error/40'
    : 'border-border hover:border-border-strong focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-focus/40';
}

/** Text input. Reads id/aria/invalid from a surrounding `<Field>` when present. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', invalid, leftIcon, rightIcon, className, id, ...rest },
  ref,
) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  const pad = inputSize === 'lg' ? 'px-3.5' : 'px-3';

  const input = (
    <input
      ref={ref}
      id={id ?? field?.id}
      aria-invalid={isInvalid || undefined}
      aria-describedby={field?.describedBy}
      aria-required={field?.required || undefined}
      className={cn(
        inputBase,
        inputState(isInvalid),
        sizes[inputSize],
        pad,
        leftIcon && 'pl-9',
        rightIcon && 'pr-9',
        className,
      )}
      {...rest}
    />
  );

  if (!leftIcon && !rightIcon) return input;

  return (
    <div className="relative">
      {leftIcon && (
        <Icon icon={leftIcon} size="sm" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
      )}
      {input}
      {rightIcon && (
        <Icon icon={rightIcon} size="sm" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
      )}
    </div>
  );
});
