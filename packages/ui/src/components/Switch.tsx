import { forwardRef, useId, type ReactNode } from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { Lock } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Read only. Also use it with `lockNote` to say why. */
  disabled?: boolean;
  name?: string;
  id?: string;
  label?: ReactNode;
  /** One line under the label: what turning it on does. */
  description?: ReactNode;
  /** Example question Leda can now answer, shown under the description in italics. */
  example?: ReactNode;
  /** Why the switch is locked, e.g. "Managed by your administrator". Shown with a lock icon. */
  lockNote?: ReactNode;
  /** Accessible name when there is no visible `label`. */
  'aria-label'?: string;
  /** Id of the element naming the switch when there is no visible `label`. */
  'aria-labelledby'?: string;
  className?: string;
}

/**
 * Switch row (C36): 34x20 track, 14px thumb, 14/20 label with optional description, example and lock note.
 * Stack rows with `gap-field-y`. Without a `label` it renders the bare switch.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, defaultChecked, onCheckedChange, disabled, name, id, label, description, example, lockNote, className, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby },
  ref,
) {
  const auto = useId();
  const switchId = id ?? auto;
  const labelId = `${switchId}-label`;
  const descId = `${switchId}-desc`;
  const noteId = `${switchId}-note`;
  const describedBy = [description || example ? descId : null, lockNote ? noteId : null].filter(Boolean).join(' ') || undefined;

  const control = (
    <RadixSwitch.Root
      ref={ref}
      id={switchId}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      name={name}
      aria-label={label ? undefined : ariaLabel}
      aria-labelledby={label ? labelId : ariaLabelledby}
      aria-describedby={describedBy}
      className={cn(
        'group relative inline-flex h-5 w-[34px] shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-hover',
        'border-faint bg-raised hover:bg-raised-2 data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=checked]:hover:border-accent-hover data-[state=checked]:hover:bg-accent-hover',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-raised disabled:data-[state=checked]:hover:bg-accent',
        focusRing,
        !label && className,
      )}
    >
      <RadixSwitch.Thumb className="block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-faint transition-transform duration-hover motion-reduce:transition-none data-[state=checked]:translate-x-4 data-[state=checked]:bg-accent-ink" />
    </RadixSwitch.Root>
  );

  if (!label) return control;

  return (
    <label
      htmlFor={switchId}
      className={cn('flex items-start gap-3 max-sm:min-h-11', disabled ? 'cursor-not-allowed' : 'cursor-pointer', className)}
    >
      {control}
      <div className="flex min-w-0 flex-col">
        <span id={labelId} className={cn('text-body', disabled ? 'text-muted' : 'text-text')}>
          {label}
        </span>
        {(description || example) && (
          <span id={descId} className="flex flex-col">
            {description && <span className="text-small text-muted">{description}</span>}
            {example && <span className="text-small italic text-muted">{example}</span>}
          </span>
        )}
        {lockNote && (
          <span id={noteId} className="mt-1 inline-flex items-center gap-1.5 text-small text-muted">
            <Lock aria-hidden size={12} weight="bold" className="shrink-0" />
            {lockNote}
          </span>
        )}
      </div>
    </label>
  );
});
