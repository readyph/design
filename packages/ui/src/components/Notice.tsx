import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export type NoticeTone = 'info' | 'ok' | 'warn' | 'bad';

export interface NoticeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Status tone. `bad` and `warn` announce as an alert; `info` and `ok` as a status. */
  tone?: NoticeTone;
  /** Optional bold first line. */
  title?: ReactNode;
  /** A real `<button>` or `<a>` (for example a `Button` or `ButtonLink`), shown after the text. */
  action?: ReactNode;
  /** Override the live-region role. Default follows the tone. */
  role?: 'status' | 'alert';
  children?: ReactNode;
}

const tones: Record<NoticeTone, string> = {
  info: 'border-info bg-info-bg text-info-ink',
  ok: 'border-ok-dot bg-ok-bg text-ok-ink',
  warn: 'border-warn-dot bg-warn-bg text-warn-ink',
  bad: 'border-bad-dot bg-bad-bg text-bad-ink',
};

const dots: Record<NoticeTone, string> = {
  info: 'bg-info',
  ok: 'bg-ok-dot',
  warn: 'bg-warn-dot',
  bad: 'bg-bad-dot',
};

/** Inline notice (RDY-314): a tinted block with a status dot, optional title and action. Tones use the status text / dot / bg / ink tokens. */
export const Notice = forwardRef<HTMLDivElement, NoticeProps>(function Notice(
  { tone = 'info', title, action, role, className, children, ...rest },
  ref,
) {
  const r = role ?? (tone === 'bad' || tone === 'warn' ? 'alert' : 'status');
  return (
    <div
      ref={ref}
      role={r}
      data-tone={tone}
      className={cn('flex min-w-0 items-start gap-3 rounded-control border px-3 py-2.5 text-ui leading-5 forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]', tones[tone], className)}
      {...rest}
    >
      <span aria-hidden="true" className={cn('mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full forced-colors:bg-[CanvasText]', dots[tone])} />
      <div className="min-w-0 flex-1 break-words">
        {title && <p className="font-medium">{title}</p>}
        {children && <div>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
});
