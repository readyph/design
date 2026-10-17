import type { ReactNode } from 'react';
import { WarningOctagon } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Notice } from '../../components/Notice';
import { cn } from '../../utils/cn';

/** One flex wrapper per page: sections stack with gap-6 (LR-3). The shell supplies the page padding. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-6', className)}>{children}</div>;
}

/** A section heading with its content, heading to content gap-3. */
export function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
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
