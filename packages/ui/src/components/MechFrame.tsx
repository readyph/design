import { type ReactNode } from 'react';
import { Check, CaretLeft, CaretRight, CheckCircle, Circle, HourglassMedium, Wrench } from '@phosphor-icons/react';
import { Badge } from './Badge';
import { cn } from '../utils/cn';
import { branch } from './sms/data';
import { PersonAvatar } from './avatarTone';
import { BizMark } from './BizMark';
import type { Mechanic } from './sms/data';

/**
 * Studio-only MechFrame: the mechanic's own phone shell. Revision 13: no bottom nav. Two fixed bars sit above the scroller (flex-none, opaque, outside `#mech-main`):
 * the app header (business logo + name LEFT, the signed-in user's avatar RIGHT = the only way into Profile) and a breadcrumb bar (Services > ...) whose first
 * element on non-root screens is a plain ghost back chevron. A centred 520px column at any width. Nothing is `fixed`, so it also works inside an iframe.
 */
export interface MechCrumb { label: string; onClick?: () => void }
export interface MechFrameProps {
  /** Screen title for screen readers (the visible location is the breadcrumb trail). */
  title: string;
  /** Root first, current last. Every crumb but the last is tappable and goes back to that level. */
  crumbs: MechCrumb[];
  me: Mechanic;
  onProfile: () => void;
  profileActive?: boolean;
  /** A pinned action bar above the bottom edge (only on pushed forms such as Need a part). */
  bar?: ReactNode;
  snack?: ReactNode;
  children: ReactNode;
  /** Overlays (modals, sheets) render here, inside the column. */
  overlay?: ReactNode;
  /** The content runs edge to edge with no top padding (the home: its sticky day header sits directly under the bars and insets itself). */
  flush?: boolean;
}

const crumbFocus = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';

/** Studio stand-in for the library Breadcrumbs (it has no phone bar with a ghost back chevron + 13px trail). See component-requests.md. */
export function MechCrumbs({ crumbs }: { crumbs: MechCrumb[] }) {
  const prev = crumbs.length > 1 ? crumbs[crumbs.length - 2] : undefined;
  return (
    <nav aria-label="Breadcrumb" data-crumbs className="flex h-10 flex-none items-center gap-1 overflow-hidden border-b border-rule bg-surface px-4 text-[13px] leading-5">
      {prev && (
        <button type="button" data-crumb-back onClick={prev.onClick} aria-label={`Back to ${prev.label}`}
          className={cn('-ml-3 mr-0.5 grid size-10 flex-none place-items-center rounded-full border-0 bg-transparent p-0 text-muted shadow-none transition-colors hover:text-text', crumbFocus)}>
          <CaretLeft size={20} aria-hidden />
        </button>
      )}
      <ol className="flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden whitespace-nowrap p-0">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={i} className={cn('flex items-center gap-1', last ? 'min-w-0 shrink' : 'flex-none')}>
              {last
                ? <span aria-current="page" title={c.label} className="block min-w-0 truncate font-medium text-text">{c.label}</span>
                : <button type="button" onClick={c.onClick} className={cn('inline-flex h-10 flex-none items-center bg-transparent p-0 text-muted transition-colors hover:text-text hover:underline', crumbFocus)}>{c.label}</button>}
              {!last && <CaretRight size={12} aria-hidden className="flex-none text-muted" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function MechFrame({ title, crumbs, me, onProfile, profileActive, bar, snack, children, overlay, flush }: MechFrameProps) {
  return (
    <div className="flex min-h-dvh justify-center bg-surface">
      <div className="relative flex h-dvh w-full max-w-[520px] flex-col border-x border-rule bg-surface text-text">
        {/* Fixed bar 1: business logo + name left, the signed-in user's avatar right (opens Profile). */}
        <header className="flex-none border-b border-rule bg-surface px-4 pb-2 pt-[calc(4px+env(safe-area-inset-top))]">
          <div className="flex min-h-11 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <BizMark size={32} />
              <p className="min-w-0 leading-5"><span className="block truncate text-[14px] font-semibold text-text">{branch.business}</span><span className="block truncate text-[12px] text-muted">{branch.name}</span></p>
            </div>
            <span className="flex-1" />
            <button type="button" onClick={onProfile} aria-current={profileActive ? 'page' : undefined} title={me.name}
              className={cn('-mr-1 grid size-10 flex-none place-items-center rounded-full bg-transparent p-0 transition-shadow hover:ring-2 hover:ring-control', crumbFocus, profileActive && 'ring-2 ring-accent')}>
              <PersonAvatar personId={me.id} name={me.name} initials={me.initials} size={32} />
              <span className="sr-only">Profile</span>
            </button>
          </div>
          <h1 className="sr-only">{title}</h1>
        </header>
        {/* Fixed bar 2: breadcrumbs (and the back control), directly under the header. */}
        <MechCrumbs crumbs={crumbs} />
        <main id="mech-main" tabIndex={-1} className={cn('min-h-0 flex-1 overflow-y-auto bg-surface pb-6 text-[14px] leading-6 outline-none', flush ? 'px-0 pt-0' : 'px-4 pt-4')}>{children}</main>
        {snack && <div role="status" aria-live="polite" className={cn('pointer-events-none absolute inset-x-4 z-30 rounded-card bg-text px-4 py-3 text-[14px] font-medium text-surface', bar ? 'bottom-24' : 'bottom-6')}>{snack}</div>}
        {bar && <div className="flex-none border-t border-rule bg-surface px-4 py-3">{bar}</div>}
        {overlay}
      </div>
    </div>
  );
}

/**
 * A section, the way Today separates them: a small caption with a hairline under it (Today's Status view: `text-[13px] font-semibold`, `border-b border-control`,
 * the count / hint as plain muted text) and its rows under it. No box, no fill, no pill. Rows are `NotifyItem`s or plain blocks inset 16px like a NotifyItem's text.
 */
export function MechSection({ title, count, hint, children, className }: { title: string; count?: number; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-label={title} className={cn('mt-6 first:mt-0', className)}>
      <h2 className="mb-2 flex items-baseline gap-2 border-b border-control pb-1 text-[13px] font-semibold">{title}{count != null && <span className="font-normal text-muted">{count}</span>}{hint && <span className="ml-auto font-normal text-muted">{hint}</span>}</h2>
      {children}
    </section>
  );
}

/** The check circle used as a NotifyItem marker: empty ring, accent fill when done. 18px, like the desktop Checkbox (the whole row is the tap target). */
export function CheckMark({ on, square }: { on: boolean; square?: boolean }) {
  return <span aria-hidden className={cn('grid size-[18px] flex-none place-items-center border-[1.5px]', square ? 'rounded-control' : 'rounded-full', on ? 'border-accent bg-accent text-surface' : 'border-control bg-surface')}>{on && <Check size={12} weight="bold" />}</span>;
}

/** The four status words, each with an icon, as a soft pill: To do, Working, Waiting for part, Done. */
const STATUS = {
  'To do': { Icon: Circle, tone: 'neutral' },
  Working: { Icon: Wrench, tone: 'accent' },
  'Waiting for part': { Icon: HourglassMedium, tone: 'warn' },
  Done: { Icon: CheckCircle, tone: 'ok' },
} as const;
export function MechStatus({ word, className }: { word: keyof typeof STATUS; className?: string }) {
  const { Icon, tone } = STATUS[word];
  return <Badge tone={tone} className={cn('h-6 gap-1 px-2', className)}><Icon size={14} weight={word === 'To do' ? 'regular' : 'fill'} aria-hidden />{word}</Badge>;
}

/** The status word as NotifyItem props (marker icon + quiet Badge tag), so lists read like the right panel. */
export function statusRow(word: keyof typeof STATUS) {
  const { Icon, tone } = STATUS[word];
  const markerTone = tone === 'ok' ? 'ok' : tone === 'warn' ? 'warn' : 'muted';
  return { marker: <Icon size={20} weight={word === 'To do' ? 'regular' : 'fill'} />, markerTone: markerTone as 'ok' | 'warn' | 'muted', tag: word, tagTone: tone };
}
