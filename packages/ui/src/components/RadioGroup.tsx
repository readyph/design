import { forwardRef, type ReactNode } from 'react';
import * as RadixRadio from '@radix-ui/react-radio-group';
import { cn, focusRing } from '../utils/cn';

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

/** A set of mutually exclusive options. Built on Radix RadioGroup. */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  { options, value, defaultValue, onValueChange, disabled, required, name, orientation = 'vertical', className },
  ref,
) {
  return (
    <RadixRadio.Root
      ref={ref}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
      name={name}
      orientation={orientation}
      className={cn('flex gap-3', orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap', className)}
    >
      {options.map((opt) => (
        <label
          key={opt.value}
          className={cn('flex items-start gap-2.5', opt.disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
        >
          <RadixRadio.Item
            value={opt.value}
            disabled={opt.disabled}
            className={cn(
              'mt-0.5 grid h-[1.125rem] w-[1.125rem] shrink-0 place-items-center rounded-full border bg-surface transition-colors duration-DEFAULT',
              'border-border-strong hover:border-primary-500 data-[state=checked]:border-primary-600',
              focusRing,
            )}
          >
            <RadixRadio.Indicator className="block h-2.5 w-2.5 rounded-full bg-primary-600" />
          </RadixRadio.Item>
          <span className="flex flex-col">
            <span className={cn("text-sm", opt.disabled ? "text-ink-muted" : "text-ink")}>{opt.label}</span>
            {opt.description && <span className="text-xs text-ink-muted">{opt.description}</span>}
          </span>
        </label>
      ))}
    </RadixRadio.Root>
  );
});
