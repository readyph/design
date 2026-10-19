import { forwardRef, type ReactNode } from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { cn, focusRing } from '../utils/cn';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  id?: string;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
}

/** On/off toggle built on Radix Switch. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, defaultChecked, onCheckedChange, disabled, name, id, label, description, className },
  ref,
) {
  const control = (
    <RadixSwitch.Root
      ref={ref}
      id={id}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      name={name}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-neutral-300 transition-colors duration-DEFAULT',
        'data-[state=checked]:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50',
        focusRing,
        !label && className,
      )}
    >
      <RadixSwitch.Thumb className="block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-DEFAULT data-[state=checked]:translate-x-[1.125rem]" />
    </RadixSwitch.Root>
  );

  if (!label) return control;

  return (
    <label className={cn('flex cursor-pointer items-start gap-3', disabled && 'cursor-not-allowed', className)}>
      {control}
      <span className="flex flex-col">
        <span className={cn("text-sm", disabled ? "text-ink-muted" : "text-ink")}>{label}</span>
        {description && <span className="text-xs text-ink-muted">{description}</span>}
      </span>
    </label>
  );
});
