/**
 * RDY-215 prototype: live platform detail modal (epic RDY-212, feature 5).
 *
 * Opens from a connections-map node or a rail platform tile in the RDY-213 DashboardShell.
 * Flat layout per owner direction: no cards and no stat tiles. Key numbers are one row of plain
 * figures split by hairline dividers; lists are divided rows. Only the degraded/offline banner
 * uses a tinted Notice, because it is an alert.
 *
 * Desktop: centred over the content area (not the viewport) and sized to it, so it sits beside
 * the fixed Leda column (24rem at lg, 28rem from xl). Below sm it is a full-screen sheet.
 * Radix Dialog gives the focus trap, Esc to close and focus return to the opening node.
 *
 * Leda entry points: "Ask Leda about this platform" (closes the modal, opens the Leda column and
 * prefills the composer; the platform goes to Leda as silent page context, no visible chip per
 * the RDY-213 owner review), and Leda's own activity rows ("Leda drafted ...").
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowClockwise,
  ArrowSquareOut,
  CaretRight,
  LinkSimple,
  LockSimple,
  Warning,
  WarningOctagon,
  Info,
  WaveTriangle,
  CheckCircle,
} from '@phosphor-icons/react';
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Icon,
  IconButton,
  Modal,
  Notice,
  Skeleton,
  StatusDot,
  cn,
  focusRing,
  type BadgeTone,
} from '../../index';
import {
  REFRESH_SECONDS,
  type DetailState,
  type KeyNumber,
  type PlatformOverview,
  type Severity,
} from './platformDetail.data';

/** Kit gaps found while building this prototype (also in the PR body). */
export const MISSING_IN_KIT = [
  'Modal `placement="content"` (or a `container` prop): centre and size the dialog over the shell content area beside the fixed Leda column; prototype uses arbitrary lg:/xl: left and max-w calc() classes with the rail (3.5rem) and leda-panel widths.',
  'Modal `sheetBelow="sm"`: full-screen sheet on phones (inset-0, no rounding/border, fade instead of the translate-based scale keyframe); prototype overrides with max-sm: classes.',
  'StatRow (flat key numbers): plain figures in one row split by hairline dividers, 4 up / 2 up by container width, `warn` and `stale` tones, skeleton variant. Today `Stat` is a tile, which the owner ruled out.',
  'ListSection + ListRow: section heading with count, border-y divided rows, row as a link with leading severity, trailing caret, empty-row copy. Composed by hand here and in ConnectionsOverview.',
  'LiveStamp: "Updated 4s ago" with a quiet live dot that ticks and resets on refetch, stale tone when the provider fails.',
  'LedaSidePanel `prefill(text, context)` API so a page can open the column with a drafted question and silent context; prototype writes to the composer through the DOM.',
  'Notice `action` slot (Retry now); prototype places the button inside children.',
];

const SEVERITY: Record<Severity, { tone: BadgeTone; label: string; icon: typeof Warning; ink: string }> = {
  high: { tone: 'error', label: 'High', icon: WarningOctagon, ink: 'text-error-fg' },
  medium: { tone: 'warning', label: 'Medium', icon: Warning, ink: 'text-warning-fg' },
  low: { tone: 'neutral', label: 'Low', icon: Info, ink: 'text-ink-subtle' },
};

const STATUS_LABEL = { active: 'Active', degraded: 'Degraded', offline: 'Offline', neutral: 'Unknown' } as const;

/** Data state implied by platform health when a story does not force one. */
export function stateFor(o: PlatformOverview): DetailState {
  return o.status === 'offline' ? 'offline' : o.status === 'degraded' ? 'degraded' : 'ready';
}

function ago(s: number) {
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  const h = Math.floor(s / 3600);
  return `${h} hour${h > 1 ? 's' : ''} ago`;
}

/* ---------------------------------------------------------- live stamp -- */

/** Ticks every second; a healthy provider is refetched every 30s (counter resets). */
function useLiveSeconds(start: number, live: boolean) {
  const [s, setS] = useState(start);
  useEffect(() => setS(start), [start]);
  useEffect(() => {
    const t = window.setInterval(() => setS((v) => (live && v + 1 >= REFRESH_SECONDS ? 0 : v + 1)), 1000);
    return () => window.clearInterval(t);
  }, [live]);
  return [s, () => setS(0)] as const;
}

function LiveStamp({ seconds, state, onRefresh }: { seconds: number; state: DetailState; onRefresh: () => void }) {
  const stale = state === 'degraded' || state === 'offline';
  if (state === 'restricted') return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-subtle">
      {state === 'loading' ? (
        'Loading…'
      ) : (
        <>
          <StatusDot status={stale ? 'degraded' : 'active'} size="sm" pulse={!stale} />
          <span aria-live="off" className={cn('tabular-nums', stale && 'text-warning-fg')}>
            {stale ? 'Stale · ' : ''}Updated {ago(seconds)}
          </span>
          <IconButton icon={ArrowClockwise} label="Refresh now" variant="subtle" size="sm" className="-my-1" onClick={onRefresh} />
        </>
      )}
    </span>
  );
}

/* --------------------------------------------------------- key numbers -- */

/** Divider and padding per cell: 2 up below a 40rem body, 4 up above (hairlines, no tiles). */
const CELL = [
  'pr-4',
  'border-l pl-4 pr-4',
  'border-t pr-4 [@container(min-width:40rem)]:border-l [@container(min-width:40rem)]:border-t-0 [@container(min-width:40rem)]:pl-4',
  'border-l border-t pl-4 pr-4 [@container(min-width:40rem)]:border-t-0',
];

function KeyNumbers({ numbers, state }: { numbers: KeyNumber[]; state: DetailState }) {
  const stale = state === 'degraded' || state === 'offline';
  return (
    <dl className="grid grid-cols-2 border-y border-border [@container(min-width:40rem)]:grid-cols-4">
      {numbers.map((n, i) => (
        <div key={n.label} className={cn('flex min-w-0 flex-col gap-0.5 border-border py-3', CELL[i])}>
          <dt className="truncate text-xs text-ink-muted">{n.label}</dt>
          <dd className={cn('text-xl font-semibold tabular-nums', stale ? 'text-ink-muted' : n.warn ? 'text-warning-fg' : 'text-ink')}>{n.value}</dd>
          {n.hint && <dd className="truncate text-xs text-ink-subtle">{n.hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

function KeyNumbersSkeleton() {
  return (
    <div className="grid grid-cols-2 border-y border-border [@container(min-width:40rem)]:grid-cols-4" aria-hidden="true">
      {CELL.map((c, i) => (
        <div key={i} className={cn('flex flex-col gap-2 border-border py-3', c)}>
          <Skeleton variant="text" className="h-3 w-16" />
          <Skeleton variant="text" className="h-6 w-12" />
          <Skeleton variant="text" className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- lists -- */

function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col">
      <h3 id={id} className="flex items-baseline gap-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
        {title}
        {count != null && count > 0 && <span className="font-normal normal-case tracking-normal tabular-nums">{count}</span>}
      </h3>
      <ul className="divide-y divide-border border-y border-border">{children}</ul>
    </section>
  );
}

function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 py-3 text-sm text-ink-subtle">
      <Icon icon={CheckCircle} size="sm" className="text-success-fg" />
      {children}
    </li>
  );
}

const rowLink = cn('group -mx-2 flex items-start gap-3 rounded-base px-2 py-2.5 hover:bg-surface-subtle', focusRing);

function AttentionList({ items }: { items: PlatformOverview['attention'] }) {
  return (
    <Section id="pd-attention" title="Actions needed" count={items.length}>
      {items.length === 0 ? (
        <EmptyRow>Nothing needs action.</EmptyRow>
      ) : (
        items.map((a) => (
          <li key={a.id}>
            <a href={a.href} className={rowLink}>
              <Badge tone={SEVERITY[a.severity].tone} size="sm" className="mt-0.5 w-14 shrink-0 justify-center">
                {SEVERITY[a.severity].label}
              </Badge>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{a.title}</span>
                <span className="block text-xs text-ink-subtle">{a.meta}</span>
              </span>
              <Icon icon={CaretRight} size="sm" className="mt-1 shrink-0 text-ink-subtle group-hover:text-ink" />
              <span className="sr-only">(opens in the platform)</span>
            </a>
          </li>
        ))
      )}
    </Section>
  );
}

function AlertList({ items }: { items: PlatformOverview['alerts'] }) {
  return (
    <Section id="pd-alerts" title="Alerts" count={items.length}>
      {items.length === 0 ? (
        <EmptyRow>No alerts from this platform.</EmptyRow>
      ) : (
        items.map((l) => (
          <li key={l.id} className="flex items-start gap-3 py-2.5">
            <Icon icon={SEVERITY[l.severity].icon} size="sm" weight="fill" className={cn('mt-0.5 shrink-0', SEVERITY[l.severity].ink)} />
            <span className="sr-only">{SEVERITY[l.severity].label} severity:</span>
            <span className="min-w-0 flex-1 text-sm text-ink">{l.text}</span>
            <span className="shrink-0 text-xs text-ink-subtle">{l.since}</span>
          </li>
        ))
      )}
    </Section>
  );
}

function ActivityList({ items }: { items: PlatformOverview['activity'] }) {
  return (
    <Section id="pd-activity" title="Recent activity">
      {items.length === 0 ? (
        <EmptyRow>No activity yet today.</EmptyRow>
      ) : (
        items.slice(0, 10).map((e) => (
          <li key={e.id}>
            <a href={e.href} className={rowLink}>
              <span className="w-16 shrink-0 pt-px text-xs tabular-nums text-ink-subtle">{e.time}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-ink">{e.summary}</span>
                <span className={cn('flex items-center gap-1 text-xs', e.actor === 'Leda' ? 'text-primary-700' : 'text-ink-subtle')}>
                  {e.actor === 'Leda' && <Icon icon={WaveTriangle} size="sm" weight="bold" />}
                  {e.actor}
                </span>
              </span>
              <Icon icon={CaretRight} size="sm" className="mt-1 shrink-0 text-ink-subtle group-hover:text-ink" />
            </a>
          </li>
        ))
      )}
    </Section>
  );
}

function ListSkeleton({ title, rows }: { title: string; rows: number }) {
  return (
    <div className="flex flex-col" aria-hidden="true">
      <span className="pb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{title}</span>
      <div className="divide-y divide-border border-y border-border">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <Skeleton variant="text" className="h-4 w-14" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton variant="text" className="h-3.5 w-3/4" />
              <Skeleton variant="text" className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- modal -- */

export interface PlatformDetailModalProps {
  overview: PlatformOverview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fetch/permission state; defaults from platform health. */
  state?: DetailState;
  /** Leda column docked on desktop (positions the modal over the content area). */
  ledaDocked?: boolean;
  onAskLeda?: (overview: PlatformOverview) => void;
}

/**
 * Desktop: centre over the content area = between the rail (3.5rem) and the Leda column, and cap
 * the width to it. Phone: full-screen sheet with a fade (the scale keyframe carries a translate).
 */
const PLACE_DOCKED =
  'lg:left-[calc((100vw+3.5rem-24rem)/2)] lg:max-w-[min(56rem,calc(100vw-3.5rem-24rem-3rem))] xl:left-[calc((100vw+3.5rem-28rem)/2)] xl:max-w-[min(56rem,calc(100vw-3.5rem-28rem-3rem))]';
const PLACE_COLLAPSED = 'lg:left-[calc((100vw+3.5rem-2.5rem)/2)] lg:max-w-[min(56rem,calc(100vw-3.5rem-2.5rem-3rem))]';
const SHEET =
  'max-sm:left-0 max-sm:top-0 max-sm:h-[100dvh] max-sm:max-h-none max-sm:w-full max-sm:max-w-none max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none max-sm:border-0 max-sm:data-[state=open]:animate-[ds-fade-in_150ms_ease]';

export function PlatformDetailModal({ overview, open, onOpenChange, state, ledaDocked = true, onAskLeda }: PlatformDetailModalProps) {
  const st: DetailState = state ?? (overview ? stateFor(overview) : 'loading');
  const [seconds, refresh] = useLiveSeconds(overview?.updatedAgo ?? 0, st === 'ready');
  if (!overview) return null;
  const o = overview;
  const restricted = st === 'restricted';
  const loading = st === 'loading';

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="2xl" className={cn('[container-type:inline-size]', ledaDocked ? PLACE_DOCKED : PLACE_COLLAPSED, SHEET)}>
      {/* Header */}
      <div className="flex shrink-0 items-start gap-3 border-b border-border px-5 py-4 pr-14">
        <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink">
          <Icon icon={o.icon} size="md" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Modal.Header className="p-0 [&>h2]:truncate">{o.label}</Modal.Header>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span>{o.kind}</span>
            <StatusDot status={o.status} label={STATUS_LABEL[o.status]} pulse={false} />
            <LiveStamp seconds={seconds} state={st} onRefresh={refresh} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div aria-busy={loading} className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [container-type:inline-size]">
        {restricted ? (
          <EmptyState
            icon={LockSimple}
            title="You can see this platform's status only"
            description={`Ask an admin for access to ${o.kind === 'Inventory' ? 'Inventory' : 'Service Management'} to see numbers, actions and activity.`}
          />
        ) : (
          <div className="flex flex-col gap-6">
            {st === 'degraded' && (
              <Notice tone="warning" title={`Couldn't refresh ${o.label}`}>
                <p className="text-ink-muted">Showing numbers from {o.lastSync ?? ago(o.updatedAgo)}. We retry every {REFRESH_SECONDS} seconds.</p>
                <Button size="sm" variant="secondary" leftIcon={ArrowClockwise} className="mt-2" onClick={refresh}>
                  Retry now
                </Button>
              </Notice>
            )}
            {st === 'offline' && (
              <Notice tone="neutral" icon={LinkSimple} title={`${o.label} is offline`}>
                <span className="text-ink-muted">Last synced {o.lastSync ?? ago(o.updatedAgo)}. Numbers below are the last known values; actions and activity return when it reconnects.</span>
              </Notice>
            )}

            {loading ? <KeyNumbersSkeleton /> : <KeyNumbers numbers={o.numbers} state={st} />}

            {st !== 'offline' && (
              <div className="grid grid-cols-1 gap-6 [@container(min-width:44rem)]:grid-cols-2 [@container(min-width:44rem)]:gap-8">
                {loading ? (
                  <>
                    <ListSkeleton title="Actions needed" rows={3} />
                    <ListSkeleton title="Recent activity" rows={5} />
                  </>
                ) : (
                  <>
                    <div className="flex min-w-0 flex-col gap-6">
                      <AttentionList items={o.attention} />
                      <AlertList items={o.alerts} />
                    </div>
                    <ActivityList items={o.activity} />
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <Modal.Footer className="shrink-0 flex-col-reverse items-stretch border-t border-border sm:flex-row sm:items-center">
        {restricted ? (
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        ) : (
          <>
            <ButtonLink href={`/platforms?connect=${o.id}`} variant="subtle" leftIcon={LinkSimple} className="sm:mr-auto">
              Manage connection
            </ButtonLink>
            <Button variant="secondary" leftIcon={WaveTriangle} onClick={() => onAskLeda?.(o)}>
              {/* Short label when the dialog is narrow (1024 with Leda docked); full name for AT. */}
              <span className="hidden sm:inline [@container(min-width:44rem)]:hidden">
                Ask Leda<span className="sr-only"> about this platform</span>
              </span>
              <span className="sm:hidden [@container(min-width:44rem)]:inline">Ask Leda about this platform</span>
            </Button>
            <ButtonLink href={`/open/${o.id}`} rightIcon={ArrowSquareOut} disabled={st === 'offline' || loading}>
              Open platform
            </ButtonLink>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}
