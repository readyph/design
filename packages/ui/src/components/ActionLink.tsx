import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { ArrowLeft, CaretRight } from '@phosphor-icons/react';
import { cn, focusForced } from '../utils/cn';

/*
 * RDY-380 I1. Transcribed from inventory-home FINAL/links.css 8-23 (+ quiet 24-26), home.html 121-123, links.css 47-50.
 * Hover changes text colour only (and the caret with it): no tint, border, background or padding shift.
 */
const ring =
  'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ' + focusForced;

const action =
  'inline-flex items-center gap-[3px] rounded-[4px] text-[13px] leading-[18px] font-semibold whitespace-nowrap no-underline cursor-pointer bg-transparent border-0 ' +
  'text-accent hover:text-lk-hover active:text-lk-hover active:opacity-[.85] focus-visible:outline-offset-[1px] ' +
  'group-hover/row:text-lk-hover group-focus-visible/row:text-lk-hover';

const quietCls =
  'inline-flex items-center gap-[3px] text-[13px] leading-[18px] text-muted font-normal whitespace-nowrap cursor-default';

type Common = { caret?: boolean; quiet?: boolean; children?: ReactNode; className?: string };
export type ActionLinkProps = Common &
  (({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>) | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>));

/**
 * Action link (I1). A real `a` (with `href`) or `button`; accent, 600, no underline, optional caret where it leads somewhere.
 * `quiet` renders muted plain text (status words such as "Settled"), never a link. Place inside a `group/row` clickable row
 * to take the hover colour when the row is hovered. The last table column is right-aligned by the caller.
 */
export const ActionLink = forwardRef<HTMLAnchorElement | HTMLButtonElement, ActionLinkProps>(function ActionLink(props, ref) {
  const { caret = false, quiet = false, children, className, ...rest } = props as Common & Record<string, unknown>;
  const icon = caret ? <CaretRight size={12} weight="bold" aria-hidden="true" /> : null;
  if (quiet) return <span className={cn(quietCls, className)}>{children}</span>;
  const cls = cn(action, ring, 'px-1', className);
  if (typeof (rest as { href?: string }).href === 'string') {
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
        {icon}
      </a>
    );
  }
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
      {icon}
    </button>
  );
});

const back =
  'inline-flex items-center gap-1.5 h-auto p-0 border-0 bg-transparent rounded-[4px] text-[14px] font-semibold text-text no-underline cursor-pointer ' +
  'hover:text-muted focus-visible:outline-offset-2 max-[760px]:h-11 max-[760px]:px-2';

export type BackLinkProps = { children: ReactNode; className?: string } & (
  | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>)
  | ({ href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>)
);

/** Back link (I1): plain text link with a left arrow, `--text`, 14px, 600, hover `--muted`; 44px tall at 760px and below. Replaces the Breadcrumbs back control (C42) on Inventory. */
export const BackLink = forwardRef<HTMLAnchorElement | HTMLButtonElement, BackLinkProps>(function BackLink(props, ref) {
  const { children, className, ...rest } = props as { children: ReactNode; className?: string } & Record<string, unknown>;
  const cls = cn(back, ring, className);
  const inner = (
    <>
      <ArrowLeft size={14} aria-hidden="true" />
      {children}
    </>
  );
  if (typeof (rest as { href?: string }).href === 'string') {
    return (
      <a ref={ref as React.Ref<HTMLAnchorElement>} className={cls} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    );
  }
  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
});
