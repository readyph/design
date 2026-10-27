import { forwardRef, Fragment, type MouseEventHandler, type ReactNode } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { cn, focusRing } from '../utils/cn';

export interface Crumb {
  /** Visible text. Long labels truncate with an ellipsis (full text in the tooltip). */
  label: string;
  /** Link target. Without `href` and `onClick` the crumb is plain text. */
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  /** Optional leading logo (trail variant only), e.g. `<PlatformLogo decorative name="..." />`. */
  logo?: ReactNode;
  /** Leading Phosphor icon (`where` variant). */
  icon?: PhosphorIcon;
}

export type BreadcrumbsVariant = 'trail' | 'sheet' | 'phone' | 'where';

export interface BreadcrumbsProps {
  /** Root first, current last. The last item is the current page and is never a link. */
  items: Crumb[];
  /**
   * `trail` (default): plain crumbs, 12/16 muted, with optional logos.
   * `sheet`: for the sheet bar. A bordered link-style back control ("← Team") then "/ {current}".
   * `phone`: for the phone top bar. Plain "‹ Team" back link only.
   * `sheet` and `phone` take the back target from the item before the current one.
   */
  variant?: BreadcrumbsVariant;
  /** Accessible name of the nav landmark. Default "Breadcrumb". */
  'aria-label'?: string;
  /** Layout only (margins, width). Applied to a wrapper, never to the nav itself. */
  className?: string;
}

const link = 'min-w-0 truncate transition-colors duration-hover';

function Action({ crumb, className, children }: { crumb: Crumb; className: string; children: ReactNode }) {
  if (crumb.href) {
    return (
      <a href={crumb.href} onClick={crumb.onClick} title={crumb.label} className={className}>
        {children}
      </a>
    );
  }
  if (crumb.onClick) {
    return (
      <button type="button" onClick={crumb.onClick} title={crumb.label} className={className}>
        {children}
      </button>
    );
  }
  return (
    <span title={crumb.label} className={className}>
      {children}
    </span>
  );
}

/**
 * Back link and breadcrumb (C42). One landmark `nav`; the current item carries `aria-current="page"`.
 * Back links are plain text, never filled or pill. The sheet back control is bordered, transparent.
 */
export const Breadcrumbs = forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
  { items, variant = 'trail', className, 'aria-label': label = 'Breadcrumb' },
  ref,
) {
  const current = items[items.length - 1];
  const back = items.length > 1 ? items[items.length - 2] : undefined;

  let body: ReactNode;
  if (variant === 'phone') {
    body = back && (
      <Action
        crumb={back}
        className={cn(
          link,
          'inline-flex max-w-full items-center gap-1 text-ui font-medium text-muted hover:text-text max-sm:min-h-11 max-sm:min-w-11',
          focusRing,
        )}
      >
        <span aria-hidden className="text-header leading-none">‹</span>
        <span className="truncate">{back.label}</span>
      </Action>
    );
  } else if (variant === 'where') {
    // The prototype's "you are here" line (`.where`): 13/18 muted, links 28px with a hover tint, "/" in the control colour, the current place 500 in text colour.
    body = (
      <ol className="flex min-w-0 list-none items-center gap-2 p-0 text-ui text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const Icon = item.icon;
          const inner = (
            <>
              {Icon && <Icon size={16} aria-hidden />}
              <span className="min-w-0 truncate">{item.label}</span>
            </>
          );
          return (
            <Fragment key={i}>
              <li className="flex min-w-0 items-center">
                {last ? (
                  <b aria-current="page" title={item.label} className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap font-medium text-text">
                    {inner}
                  </b>
                ) : (
                  <Action crumb={item} className={cn('-ml-1.5 inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-control px-1.5 text-muted transition-colors duration-hover hover:bg-raised hover:text-text', focusRing)}>
                    {inner}
                  </Action>
                )}
              </li>
              {!last && (
                <li aria-hidden className="text-control">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    );
  } else if (variant === 'sheet') {
    body = (
      <ol className="flex min-w-0 list-none items-center gap-2 p-0">
        {back && (
          <li className="flex min-w-0 max-w-[14rem] shrink">
            <Action
              crumb={back}
              className={cn(
                link,
                'inline-flex h-8 max-w-full items-center gap-1.5 rounded-control border border-control bg-transparent px-2.5 text-ui font-medium text-text hover:border-muted max-sm:min-h-11',
                focusRing,
              )}
            >
              <span aria-hidden>←</span>
              <span className="truncate">{back.label}</span>
            </Action>
          </li>
        )}
        <li className="flex min-w-[4.5rem] items-baseline gap-2 text-ui">
          {back && (
            <span aria-hidden className="text-muted">
              /
            </span>
          )}
          <span aria-current="page" title={current.label} className="truncate font-semibold text-text">
            {current.label}
          </span>
        </li>
      </ol>
    );
  } else {
    body = (
      <ol className="flex min-w-0 list-none flex-nowrap items-center gap-x-1.5 p-0 text-small text-muted">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const content = (
            <>
              {item.logo && <span className="inline-flex shrink-0 [&>*]:shrink-0">{item.logo}</span>}
              <span className="truncate">{item.label}</span>
            </>
          );
          return (
            <Fragment key={i}>
              <li className={cn('flex min-w-0 items-center', last ? 'max-w-[45%] shrink-0' : i === items.length - 2 ? 'shrink' : 'shrink-[0.15]')}>
                {last ? (
                  <span aria-current="page" title={item.label} className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-text">
                    {content}
                  </span>
                ) : (
                  <Action
                    crumb={item}
                    className={cn(
                      'inline-flex min-w-0 items-center gap-1.5 rounded-chip',
                      (item.href || item.onClick) && cn('transition-colors duration-hover hover:text-text', focusRing),
                    )}
                  >
                    {content}
                  </Action>
                )}
              </li>
              {!last && (
                <li aria-hidden className="shrink-0 whitespace-nowrap text-muted">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    );
  }

  return (
    <div className={cn('min-w-0', variant === 'sheet' && 'min-w-[9rem]', className)}>
      <nav ref={ref} aria-label={label} className="min-w-0">
        {body}
      </nav>
    </div>
  );
});
