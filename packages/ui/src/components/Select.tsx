import { forwardRef, type ReactNode } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { CaretUpDown, Check, CaretUp, CaretDown } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';
import { Icon } from './Icon';
import { useField } from './Field';
import type { InputSize } from './Input';

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  size?: InputSize;
  invalid?: boolean;
  disabled?: boolean;
  name?: string;
  className?: string;
  /** Accessible name for the trigger when there is no visible <label>/Field. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const sizes: Record<InputSize, string> = {
  sm: 'h-sm text-sm',
  md: 'h-md text-sm',
  lg: 'h-lg text-base',
};

/** Single-select dropdown built on Radix Select (full keyboard + ARIA). */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  { options, value, defaultValue, onValueChange, placeholder = 'Select…', size = 'sm', invalid, disabled, name, className, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy },
  ref,
) {
  const field = useField();
  const isInvalid = invalid ?? field?.invalid ?? false;
  return (
    <RadixSelect.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled} name={name}>
      <RadixSelect.Trigger
        ref={ref}
        id={field?.id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-invalid={isInvalid || undefined}
        aria-describedby={field?.describedBy}
        className={cn(
          'inline-flex w-full items-center justify-between gap-2 rounded-control border bg-surface px-3 text-ink transition-colors duration-DEFAULT data-[placeholder]:text-ink-subtle disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-subtle',
          isInvalid ? 'border-error' : 'border-border hover:border-border-strong',
          focusRing,
          sizes[size],
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <Icon icon={CaretUpDown} size="sm" className="text-ink-subtle" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-popover max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-surface shadow-lg"
        >
          <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-ink-subtle">
            <Icon icon={CaretUp} size="sm" />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-1">
            {options.map((opt) => (
              <RadixSelect.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-3 text-sm text-ink outline-none',
                  'data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-700',
                  'data-[disabled]:pointer-events-none data-[disabled]:text-ink-subtle',
                )}
              >
                <RadixSelect.ItemIndicator className="absolute left-2 inline-flex">
                  <Icon icon={Check} size="sm" className="text-primary-600" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center text-ink-subtle">
            <Icon icon={CaretDown} size="sm" />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
});
