import { ChatCircleText, Clock, Hourglass, ListChecks, Package, Wallet, type Icon } from '@phosphor-icons/react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { cn } from '../utils/cn';
import { PersonAvatar } from './avatarTone';
import type { Job } from './sms/data';
import { STATUS_SHORT, flagOf, reasonOf, serviceTitle, viewOf } from './sms/floorModel';
import { HOUR_H, hmin, mechanicById, px, type packDay } from './sms/scheduleModel';

const REASON_ICON: Record<string, Icon> = { OVERDUE: Clock, PARTS: Package, APPROVAL: Hourglass, PICKUP_UNPAID: Wallet };
const REASON_WORD: Record<string, string> = { OVERDUE: 'Late', PARTS: 'Blocked, waiting on parts', APPROVAL: 'Waiting for approval', PICKUP_UNPAID: 'Ready, unpaid' };

export type PlacedItem = ReturnType<typeof packDay>['placed'][number];

export interface CalCardProps {
  placed: PlacedItem;
  selected: boolean;
  flash: boolean;
  dim: boolean;
  /** Hide the mechanic avatar (one mechanic is already chosen in the toolbar). */
  showMech: boolean;
  onOpen: (j: Job) => void;
  /** One-column placement (phone, mechanic day): top and height in px, full width. Replaces the lane maths. */
  layout?: { top: number; height: number };
  /** Variants for the mechanic's own day (same anatomy): word and dot of the status, tint, hide money, show every line. */
  view?: CalCardView;
  /** A static block in normal flow (mechanic service detail header): full width, natural height, not a button (no tap, no hover), not time-positioned. Needs `view.staff`. */
  inline?: boolean;
}

export interface CalCardView {
  label?: string; dot?: string;
  /** `warn` = waiting tint (parts), `working` = accent border and tint, `done` = dimmed. */
  tone?: 'warn' | 'working' | 'done';
  hideUnpaid?: boolean;
  /** Always show customer, service (2 lines), status and flag; the caller guarantees the height. */
  full?: boolean;
  /** The signed-in staff member's view of their own card (mechanic phone). Absent on the manager Floor, which is unchanged. */
  staff?: CalCardStaff;
}

export interface CalCardStat { kind: 'items' | 'parts'; /** "1/2" */ short: string; /** "1 of 2 items done" (title and accessible name) */ full: string }
export interface CalCardStaff {
  /** The ONE service being worked on: a pulsing "Currently working on" pill at the top right of the first row. */
  current?: boolean;
  /** Compact stats on the status row, icon + short form; the full words are in title and accessible name. */
  stats?: CalCardStat[];
  /** Unread messages from the manager: shown as a chat-bubble icon with a red dot; this is its accessible name, e.g. "Manager replied - 2 new messages". */
  unread?: string | null;
  /** Latest post of the service's feed: kind icon, who, text, relative time (right-aligned). */
  last?: { icon: Icon; who: string; text: string; ago: string } | null;
}

/** The mechanic as a 24px initials avatar; the full name and bay on hover and focus (the card itself is the focus target, so the card carries the same words in its label). */
function MechAvatar({ job }: { job: Job }) {
  const m = mechanicById(job.assigneeId);
  const label = m ? `${m.name}, ${m.bay}` : 'Not assigned';
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>
        <span className="flex-none">{m ? <PersonAvatar personId={m.id} decorative name={m.name} initials={m.initials} size={24} /> : <Avatar decorative tone="pending" name="Not assigned" initials="?" size={24} />}</span>
      </RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content side="top" sideOffset={4} collisionPadding={8} className="z-50 select-none whitespace-nowrap rounded-chip bg-text px-2 py-1 text-small text-surface">{label}</RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

/**
 * Studio-only CalCard (NEW): a calendar card that degrades by height.
 * Always: number + plate (one line, no shrink), customer (wraps). 45 min: + title (1 line) and the flag or status. 60 min and up: title (2 lines), status and flag.
 * No fill (page surface) and no left bar; status stays dot + word. Blocked services use the warning tint and the same flag words as the List, JobRow and panel (flagOf / reasonOf).
 */
export function CalCard({ placed, selected, flash, dim, showMech, onOpen, layout, view, inline }: CalCardProps) {
  const { job, start, end, lane, lanes } = placed;
  const v = viewOf(job); const title = serviceTitle(job);
  const hideMoney = !!view?.hideUnpaid && reasonOf(job) === 'PICKUP_UNPAID';
  const flag = hideMoney ? null : flagOf(job); const reason = hideMoney ? null : reasonOf(job);
  const st = { ...STATUS_SHORT[job.status], ...(view?.label ? { label: view.label } : {}), ...(view?.dot ? { dot: view.dot } : {}) };
  const h = layout ? layout.height : ((end - start) / 60) * HOUR_H - 2;
  // Identity first: number + plate + customer (two lines) always fit (62px). Everything else is added only when the height pays for it.
  const room = h - 8;
  const full = !!view?.full;
  const showTitle = full || room >= 72; const showFlagOrStatus = full || room >= 88; const showBoth = full || room >= 120; const title2 = full || room >= 104;
  const mech = mechanicById(job.assigneeId);
  const time = `${hmin(start)}-${hmin(end)}`;
  const ReasonIcon = reason ? REASON_ICON[reason] : null;
  const flagLine = flag && (
    <span className={cn('flex min-w-0 items-center gap-1 text-[12px] leading-4', flag.tone === 'bad' ? 'font-medium text-bad' : 'font-medium text-text')}>
      {ReasonIcon && <ReasonIcon size={12} weight="bold" aria-hidden className="flex-none" />}<span className="min-w-0 truncate">{flag.word}</span>
    </span>
  );
  const staff = view?.staff;
  const ringTone = view?.tone === 'warn' || reason ? 'ring-warn-bg' : view?.tone === 'working' ? 'ring-accent-tint' : 'ring-surface';
  const FlagIcon = ReasonIcon;
  const staffBody = staff && (
    <>
      {/* Row 1: number + plate left (truncate), working pill / unread bubble right (never wrap, never shrink). */}
      <span className="flex min-h-6 min-w-0 items-center gap-2">
        <span className="flex min-w-0 flex-1 items-baseline gap-2 font-mono text-[12px] leading-4 text-text">
          <span data-jo className="min-w-0 truncate font-semibold">{job.number}</span>
          <span data-plate className="min-w-0 flex-shrink-[2] truncate">{v.plate}</span>
        </span>
        <span className="flex flex-none items-center gap-2">
          {job.status === 'QUOTATION' && <Badge tone="accent" className="h-4 flex-none px-1 text-[11px] leading-4">Quote</Badge>}
          {staff.unread && (
            <span data-unread role="img" aria-label={staff.unread} title={staff.unread} className="relative inline-flex size-[18px] flex-none items-center justify-center text-muted">
              <ChatCircleText size={18} weight="regular" aria-hidden />
              <span data-unread-dot aria-hidden className={cn('absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-bad ring-2', ringTone)} />
            </span>
          )}
          {staff.current && (
            <span data-current className="inline-flex h-5 flex-none items-center gap-1.5 whitespace-nowrap rounded-chip bg-accent px-2 text-[12px] font-semibold leading-5 text-accent-ink">
              <span aria-hidden className="size-1.5 flex-none animate-pulse rounded-full bg-accent-ink motion-reduce:animate-none" />
              <span className="max-[399px]:hidden">Currently working on</span>
              <span aria-hidden className="min-[400px]:hidden">Working now</span>
            </span>
          )}
        </span>
      </span>
      {/* Row 2: customer, then the service (muted, 2 lines). */}
      <span className="mt-1 min-w-0 truncate text-[13px] font-semibold leading-4 text-text">{v.customer}</span>
      <span className="mt-0.5 min-w-0 break-words text-[12px] leading-4 text-muted line-clamp-2">{title}</span>
      <span className="mt-auto flex min-w-0 flex-col">
        {/* Row 3: status left, compact stats right on the same row. */}
        <span className="mt-1.5 flex min-w-0 items-center gap-2">
          <span data-staff-status className="flex min-w-0 flex-1 items-center gap-1.5 text-[14px] font-semibold leading-5"><span aria-hidden className={cn('size-2 flex-none rounded-full', st.dot)} /><span className="min-w-0 truncate">{st.label}</span></span>
          {!!staff.stats?.length && (
            <span className="flex flex-none items-center gap-2.5">
              {staff.stats.map((x) => {
                const SIcon = x.kind === 'items' ? ListChecks : Package;
                return <span key={x.kind} data-staff-stat role="img" aria-label={x.full} title={x.full} className="inline-flex items-center gap-1 whitespace-nowrap text-[12px] leading-4 tabular-nums text-muted"><SIcon size={14} aria-hidden className="flex-none" /><span aria-hidden>{x.short}</span></span>;
              })}
            </span>
          )}
        </span>
        {/* Flags in one wrapping chip row under the status row. */}
        {flag && (
          <span data-staff-flags className="mt-1 flex flex-wrap gap-1">
            <span data-staff-flag className={cn('inline-flex h-5 max-w-full items-center gap-1 rounded-chip border border-control bg-surface px-1.5 text-[12px] font-medium leading-4', flag.tone === 'bad' ? 'text-bad' : 'text-text')}>
              {FlagIcon && <FlagIcon size={12} weight="bold" aria-hidden className="flex-none" />}<span className="min-w-0 truncate">{flag.word}</span>
            </span>
          </span>
        )}
        {/* Row 4: hairline, then the last activity; the time is muted and right-aligned. */}
        {staff.last && (
          <span data-last className="mt-2 flex min-w-0 items-center gap-1.5 border-t border-rule pt-1.5 text-[12px] leading-4 text-muted">
            <staff.last.icon size={12} aria-hidden className="flex-none" />
            <span data-last-text className="min-w-0 flex-1 truncate">{staff.last.who}: &quot;{staff.last.text}&quot;</span>
            <span data-last-ago className="flex-none whitespace-nowrap pl-2 tabular-nums">{staff.last.ago}</span>
          </span>
        )}
      </span>
    </>
  );
  const statusLine = (
    <span className="flex min-w-0 items-center gap-1.5 text-[12px] leading-4"><span aria-hidden className={cn('size-1.5 flex-none rounded-full', st.dot)} /><span className="min-w-0 truncate">{st.label}</span></span>
  );
  if (inline && staff) {
    return (
      <div
        role="group" data-static-card aria-label={`${job.number}, ${v.plate}, ${v.customer}, ${title}, ${st.label}${staff.current ? ', currently working on' : ''}`} data-tone={view?.tone}
        className={cn(
          'flex w-full min-w-0 flex-col rounded-control border p-3 text-left',
          reason || view?.tone === 'warn' ? 'bg-warn-bg' : view?.tone === 'working' ? 'bg-accent-tint' : 'bg-surface',
          view?.tone === 'working' ? 'border-accent' : flag?.tone === 'bad' ? 'border-bad' : 'border-control', view?.tone === 'done' && 'opacity-70',
        )}
      >
        {staffBody}
      </div>
    );
  }
  return (
    <button
      type="button" onClick={() => onOpen(job)} aria-pressed={selected} title={`${job.number}, ${v.customer}, ${v.plate}, ${title}`}
      aria-label={`${job.number}, ${v.plate}, ${v.customer}, ${title}, ${v.vehicle}, ${time}, ${st.label}${flag ? `, ${REASON_WORD[reason!]}: ${flag.word}` : ''}${staff?.current ? ', currently working on' : ''}${staff?.unread ? `, ${staff.unread}` : ''}${mech ? `, ${mech.name}` : ', not assigned'}`}
      data-tone={view?.tone}
      style={layout ? { top: layout.top, height: h, left: 0, right: 0 } : { top: px(start) + 1, height: h, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)` }}
      className={cn(
        'group absolute z-[2] flex min-w-0 flex-col overflow-hidden rounded-control border text-left',
        staff ? 'p-3' : 'px-2 py-1',
        'transition-opacity hover:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent motion-reduce:transition-none',
        reason || view?.tone === 'warn' ? 'bg-warn-bg' : view?.tone === 'working' ? 'bg-accent-tint' : 'bg-surface hover:bg-raised',
        view?.tone === 'working' ? 'border-accent' : flag?.tone === 'bad' ? 'border-bad' : 'border-control', view?.tone === 'done' && 'opacity-70', job.status === 'QUOTATION' && 'border-dashed', (selected || flash) && 'ring-2 ring-accent', dim && 'opacity-40 hover:opacity-100',
      )}
    >
      {staff ? staffBody : (
        <>
      {/* Line 1: number and plate never shrink or truncate; the avatar sits at the end (a 24px row when shown). */}
      <span className="flex min-h-6 min-w-0 items-center gap-x-2">
        <span className="flex-none whitespace-nowrap font-mono text-[12px] font-semibold leading-4 text-text">{job.number}</span>
        <span className="flex-none whitespace-nowrap font-mono text-[12px] leading-4 text-text">{v.plate}</span>
        <span className="ml-auto flex flex-none items-center gap-1">
          {job.status === 'QUOTATION' && <Badge tone="accent" className="h-4 flex-none px-1 text-[11px] leading-4">Quote</Badge>}
          {!showFlagOrStatus && ReasonIcon && <ReasonIcon size={14} weight="bold" aria-hidden className={flag?.tone === 'bad' ? 'text-bad' : 'text-text'} />}
          {showMech && <MechAvatar job={job} />}
        </span>
      </span>
      {/* Line 2: the customer wraps, it is never cut. */}
      <span className="min-w-0 break-words text-[13px] font-medium leading-4 text-text">{v.customer}</span>
      {showTitle && <span className={cn('mt-0.5 min-w-0 break-words text-[12px] leading-4 text-muted', title2 ? 'line-clamp-2' : 'line-clamp-1')}>{title}</span>}
      {showFlagOrStatus && (
        <span className="mt-auto flex min-w-0 flex-col">
          {showBoth && statusLine}
          {flagLine ?? (!showBoth ? statusLine : null)}
        </span>
      )}
        </>
      )}
    </button>
  );
}
