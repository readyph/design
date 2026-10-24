import type { ReactNode } from 'react';
import { ArrowLeft, WarningOctagon } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { Notice } from '../../components/Notice';
import { cn, focusRing } from '../../utils/cn';

const WIDTH = { default: 'max-w-6xl', detail: 'max-w-5xl', form: 'max-w-3xl' } as const;

/** The shipped page container: centred, space-y-6, p-4 sm:p-6. Narrower on detail pages and forms. */
export function Page({ children, width = 'default', className }: { children: ReactNode; width?: keyof typeof WIDTH; className?: string }) {
  return <div className={cn('mx-auto w-full space-y-6 p-4 sm:p-6', WIDTH[width], className)}>{children}</div>;
}

/** Small uppercase caption used by the Inventory dashboard feed. */
export function Caption({ children }: { children: ReactNode }) {
  return <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-subtle">{children}</p>;
}

/** Detail pages go back with an arrow and the parent name, not breadcrumbs. */
export function BackButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn('inline-flex items-center gap-1.5 rounded text-sm text-ink-muted hover:text-ink', focusRing)}>
      <Icon icon={ArrowLeft} size="sm" /> {label}
    </button>
  );
}

/** Error notice with a retry action; the button sits in a gap-2 control group, not a margin. */
export function RetryNotice({ title, children, onRetry }: { title: string; children?: ReactNode; onRetry?: () => void }) {
  return (
    <Notice tone="error" title={title} icon={WarningOctagon}>
      <div className="flex flex-wrap items-center gap-2">
        <span>{children}</span>
        <Button size="sm" variant="secondary" onClick={onRetry}>Retry</Button>
      </div>
    </Notice>
  );
}
