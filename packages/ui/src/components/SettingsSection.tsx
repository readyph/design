import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface SettingsSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned section actions. */
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * A titled settings block: a heading/description column beside its controls.
 * Stacks on small screens. A standalone building block — compose pages freely.
 */
export const SettingsSection = forwardRef<HTMLElement, SettingsSectionProps>(function SettingsSection(
  { title, description, actions, className, children, ...rest },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn('grid gap-4 py-6 md:grid-cols-[18rem_1fr]', className)}
      {...rest}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>
        {actions && <div className="md:hidden">{actions}</div>}
      </div>
      <div className="flex flex-col gap-4">
        {children}
        {actions && <div className="hidden justify-end md:flex">{actions}</div>}
      </div>
    </section>
  );
});
