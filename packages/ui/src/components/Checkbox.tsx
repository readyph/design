import { forwardRef, type ReactNode } from 'react';
import * as RadixCheckbox from '@radix-ui/react-checkbox';
import { Check, Minus } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';

export interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  id?: string;
  /** Inline label to the right of the box. */
  label?: ReactNode;
  /** Secondary description under the label. */
  description?: ReactNode;
  className?: string;
}

/** Checkbox with optional label + description. Built on Radix Checkbox. */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { checked, defaultChecked, onCheckedChange, disabled, required, name, value, id, label, description, className },
  ref,
) {
  const box = (
    <RadixCheckbox.Root
      ref={ref}
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      required={required}
      name={name}
      value={value}
      className={cn(
        'grid h-[1.125rem] w-[1.125rem] shrink-0 place-items-center rounded-sm border bg-surface transition-colors duration-DEFAULT',
        'border-border-strong hover:border-primary-500',
        'data-[state=checked]:border-primary-600 data-[state=checked]:bg-primary-600',
        'data-[state=indeterminate]:border-primary-600 data-[state=indeterminate]:bg-primary-600',
        'disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        !label && className,
      )}
    >
      <RadixCheckbox.Indicator className="text-white">
        {checked === 'indeterminate' ? <Icon icon={Minus} size={14} weight="bold" /> : <Icon icon={Check} size={14} weight="bold" />}
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (!label) return box;

  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5', disabled && 'cursor-not-allowed', className)}>
      <span className="mt-0.5">{box}</span>
      <span className="flex flex-col">
        <span className={cn("text-sm", disabled ? "text-ink-muted" : "text-ink")}>{label}</span>
        {description && <span className="text-xs text-ink-muted">{description}</span>}
      </span>
    </label>
  );
});
