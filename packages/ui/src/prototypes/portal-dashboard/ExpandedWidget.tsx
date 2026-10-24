/**
 * RDY-216 prototype (epic RDY-212, feature 6): a Leda widget expanded into the content panel.
 *
 * - Today a list widget over the inline row limit opens a modal (portal LedaActionBlock). Here,
 *   Expand on any Leda widget replaces the Home content (connections diagram) with the full widget;
 *   the widget title becomes the page heading (no top bar) and a "Back to platforms" control returns Home with
 *   the scroll position restored.
 * - One expanded widget at a time: expanding another replaces it. The source message in the Leda
 *   chat is marked "Expanded"; follow-up prompts can refer to it (composer placeholder names it).
 * - Below lg the Leda drawer closes on Expand so the widget fills the content.
 * - Owner direction (RDY-213 review): the content panel is flat. No cards and no stat tiles; the
 *   expanded views use summary lines, hairline rows and dividers. The chat keeps the previous Portal
 *   Leda chat (widgets render as today's LedaWidget blocks, plus the Expand control).
 *
 * Composition only: every piece is an existing @readyph/ui export; gaps are in MISSING_IN_KIT_216.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ArrowLeft, ArrowsOutSimple, ChartBar, ChartLineUp, Package, SquaresFour, Warning } from '@phosphor-icons/react';
import { Badge, Button, Icon, IconButton, LedaWidget, Stat, StatusDot, cn } from '../../index';
import { ConnectionsOverview } from './ConnectionsOverview';
import { DashboardShell, type LedaAttachmentContext, type LedaMessage } from './DashboardShell';
import {
  INLINE_ROWS,
  LOW_STOCK,
  PLATFORM_OVERVIEW,
  SALES_14D,
  WEEK_BY_PLATFORM,
  WEEK_STATS,
  WIDGET_CONVERSATION,
  WIDGET_TITLE,
  urgency,
  type LowStockRow,
  type WidgetId,
} from './expandedWidgetData';

/** Kit gaps found while building this prototype (also in the PR body). */
export const MISSING_IN_KIT_216 = [
  'LedaWidget `onExpand` + `expanded` props: header Expand control (ArrowsOutSimple IconButton, label "Expand <title>") and an "Expanded" marker on the source widget; prototype passes both through `headerActions`.',
  'LedaWidget.Table `limit` + `total`: inline row cap with "Showing top N of M" meta and a "Show all M" footer that expands (replaces the planned fullscreen modal in portal LedaActionBlock).',
  'Expanded widget view (page pattern, project-owned in Portal): back control + source line + flat body; LedaStatGrid needs a `flat` variant (hairline rows, no tile fill) for the content panel, prototype uses Stat in a divided grid.',
  'Chart x labels: LedaChart truncates "Oct 10" style labels at phone width; prototype passes day numbers and names the month in the summary line.',
  'Shell (RDY-219/221): LedaSidePanel needs page-owned message attachments and a composer placeholder override, plus a way to close the drawer from an attachment (prototype adds ledaMessages / renderLedaAttachment / ledaPlaceholder to DashboardShell).',
];

const money = (k: number) => `₱${k}k`;
const SALES_TOTAL = SALES_14D.reduce((a, d) => a + d.value, 0);
const SALES_PEAK = SALES_14D.reduce((a, d) => (d.value > a.value ? d : a));
const SALES_LOW = SALES_14D.reduce((a, d) => (d.value < a.value ? d : a));
const URGENT = LOW_STOCK.filter((r) => r.daysLeft <= 2).length;
const NEEDS_ATTENTION = PLATFORM_OVERVIEW.filter((p) => p.status !== 'active').length;

/* ------------------------------------------------------- in-chat widget -- */

function UrgencyBadge({ days }: { days: number }) {
  const u = urgency(days);
  return (
    <Badge tone={u.tone} size="sm">
      {u.label}
    </Badge>
  );
}

function ChatWidget({ id, expanded, onExpand }: { id: WidgetId; expanded: boolean; onExpand: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const title = WIDGET_TITLE[id];

  // Keep the marked source in view when a story mounts with it expanded (after the chat's own
  // scroll-to-bottom).
  useEffect(() => {
    if (!expanded) return;
    const t = window.setTimeout(() => {
      ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    }, 400);
    return () => window.clearTimeout(t);
  }, [expanded]);

  const headerActions = expanded ? (
    <Badge tone="info" size="sm">
      Expanded
    </Badge>
  ) : (
    <IconButton icon={ArrowsOutSimple} label={`Expand ${title}`} variant="subtle" size="sm" onClick={onExpand} />
  );

  let body;
  if (id === 'low-stock') {
    const rows = LOW_STOCK.slice(0, INLINE_ROWS);
    body = (
      <LedaWidget.Table<LowStockRow>
        icon={Package}
        tone="warning"
        title={title}
        meta={`Showing top ${rows.length} of ${LOW_STOCK.length}`}
        headerActions={headerActions}
        columns={[
          {
            key: 'item',
            header: 'Item',
            render: (r) => <span className="block max-w-[11rem] truncate">{r.item}</span>,
          },
          {
            key: 'onHand',
            header: 'On hand',
            align: 'right',
            render: (r) => <span className="tabular-nums">{r.onHand}</span>,
          },
          {
            key: 'left',
            header: 'Runs out',
            align: 'right',
            render: (r) => <UrgencyBadge days={r.daysLeft} />,
          },
        ]}
        data={rows}
        rowKey={(r) => r.sku}
        footer={
          !expanded && (
            <Button size="sm" variant="subtle" rightIcon={ArrowsOutSimple} onClick={onExpand}>
              Show all {LOW_STOCK.length}
            </Button>
          )
        }
      />
    );
  } else if (id === 'week-stats') {
    body = (
      <LedaWidget icon={ChartBar} title={title} meta="Oct 17 to 23 vs the week before" headerActions={headerActions}>
        {/* Owner direction: no stat tiles, even in the chat. Flat 2-up metrics on hairlines. */}
        <dl className="grid grid-cols-2 gap-x-4">
          {WEEK_STATS.slice(0, 4).map((st) => (
            <div key={st.label} className="border-b border-border/50 py-3">
              <dt className="sr-only">{st.label}</dt>
              <dd>
                <Stat label={st.label} value={st.value} delta={st.delta} deltaTone={st.deltaTone} />
              </dd>
            </div>
          ))}
        </dl>
      </LedaWidget>
    );
  } else if (id === 'sales-chart') {
    body = (
      <LedaWidget.Chart
        icon={ChartLineUp}
        tone="success"
        title={title}
        meta="All storefronts"
        headerActions={headerActions}
        kind="bar"
        data={SALES_14D.map((d) => d.value)}
        total={money(SALES_TOTAL)}
        delta={{ value: '+6.1% vs previous 14 days' }}
        height={96}
      />
    );
  } else {
    body = (
      <LedaWidget
        icon={SquaresFour}
        tone="info"
        title={title}
        meta={`${PLATFORM_OVERVIEW.length} platforms · ${NEEDS_ATTENTION} need attention`}
        headerActions={headerActions}
      >
        <LedaWidget.Facts
          items={PLATFORM_OVERVIEW.slice(0, 4).map((p) => ({
            label: p.label,
            value: (
              <span className="inline-flex items-center gap-1.5">
                <StatusDot status={p.status} size="sm" />
                {p.statusText}
              </span>
            ),
          }))}
        />
      </LedaWidget>
    );
  }

  return (
    <div ref={ref} data-expanded={expanded || undefined} className="scroll-my-4">
      {body}
    </div>
  );
}

/* ------------------------------------------------- expanded content views -- */

const sectionLabel = 'pb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle';

function LowStockView() {
  return (
    <>
      <p className="text-sm text-ink-muted">
        {LOW_STOCK.length} items at or below their reorder point · <span className="text-error-fg">{URGENT} run out within 2 days</span>
      </p>
      {/* Wide content: the full table, flat (hairline rows, no outer box). */}
      <div className={cn('hidden', '[@container(min-width:40rem)]:block')}>
        <LedaWidget.Table<LowStockRow>
          columns={[
            {
              key: 'item',
              header: 'Item',
              render: (r) => <span className="font-medium">{r.item}</span>,
            },
            {
              key: 'sku',
              header: 'SKU',
              render: (r) => <span className="text-ink-muted">{r.sku}</span>,
            },
            {
              key: 'location',
              header: 'Location',
              render: (r) => <span className="text-ink-muted">{r.location}</span>,
            },
            {
              key: 'onHand',
              header: 'On hand',
              align: 'right',
              render: (r) => <span className="tabular-nums">{r.onHand}</span>,
            },
            {
              key: 'reorderAt',
              header: 'Reorder at',
              align: 'right',
              render: (r) => <span className="tabular-nums text-ink-muted">{r.reorderAt}</span>,
            },
            {
              key: 'left',
              header: 'Runs out',
              align: 'right',
              render: (r) => <UrgencyBadge days={r.daysLeft} />,
            },
          ]}
          data={LOW_STOCK}
          rowKey={(r) => r.sku}
          className="pt-1"
        />
      </div>
      {/* Narrow content: divided rows. */}
      <ul className={cn('flex flex-col', '[@container(min-width:40rem)]:hidden')}>
        {LOW_STOCK.map((r) => (
          <li key={r.sku} className="flex items-start gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{r.item}</p>
              <p className="text-xs text-ink-subtle">
                {r.location} · {r.onHand} of {r.reorderAt} · {r.sku}
              </p>
            </div>
            <UrgencyBadge days={r.daysLeft} />
          </li>
        ))}
      </ul>
    </>
  );
}

function WeekStatsView() {
  return (
    <>
      <p className="text-sm text-ink-muted">Oct 17 to 23, compared with Oct 10 to 16 · all platforms</p>
      {/* Flat metrics: no tiles, no fills; hairline rows between them. */}
      <dl className="grid grid-cols-2 [@container(min-width:48rem)]:grid-cols-3">
        {WEEK_STATS.map((s) => (
          <div key={s.label} className="py-4 pr-4">
            <dt className="sr-only">{s.label}</dt>
            <dd>
              <Stat label={s.label} value={s.value} delta={s.delta} deltaTone={s.deltaTone} points={s.points} />
            </dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className={sectionLabel}>By platform</h3>
        <ul className="flex flex-col">
          {WEEK_BY_PLATFORM.map((p) => (
            <li key={p.platform} className="flex flex-wrap items-center gap-x-4 gap-y-0.5 py-2.5 text-sm">
              <span className="flex min-w-0 flex-1 items-center gap-2 font-medium text-ink">
                <StatusDot status={p.status} size="sm" />
                {p.platform}
              </span>
              <span className="tabular-nums text-ink">{p.sales}</span>
              <span className="tabular-nums text-ink-muted">{p.orders} orders</span>
              <span className={cn('w-16 text-right tabular-nums', p.tone === 'success' ? 'text-success-fg' : 'text-error-fg')}>{p.change}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function SalesChartView() {
  return (
    <>
      <p className="text-sm text-ink-muted">
        October 10 to 23 · all storefronts · average {money(Math.round(SALES_TOTAL / SALES_14D.length))} a day, best {SALES_PEAK.label} (
        {money(SALES_PEAK.value)}), lowest {SALES_LOW.label} ({money(SALES_LOW.value)})
      </p>
      <div className="pt-5">
        <LedaWidget.Chart
          kind="bar"
          data={SALES_14D.map((d) => ({
            label: d.label.replace('Oct ', ''),
            value: d.value,
          }))}
          total={money(SALES_TOTAL)}
          delta={{ value: '+6.1% vs previous 14 days' }}
          height={240}
          showLabels
        />
      </div>
    </>
  );
}

function PlatformOverviewView() {
  return (
    <>
      <p className="text-sm text-ink-muted">
        {PLATFORM_OVERVIEW.length} platforms · <span className="text-warning">{NEEDS_ATTENTION} need attention</span>
      </p>
      <ul className="flex flex-col">
        {PLATFORM_OVERVIEW.map((p) => (
          <li key={p.id} className="py-3 text-sm">
            {/* Wide content: one grid row. */}
            <div className="hidden items-center gap-x-4 [@container(min-width:40rem)]:grid [@container(min-width:40rem)]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
              <span className="flex min-w-0 items-center gap-2.5">
                <StatusDot status={p.status} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{p.label}</span>
                  <span className="block truncate text-xs text-ink-subtle">{p.kind}</span>
                </span>
              </span>
              <span className="text-ink">{p.statusText}</span>
              <span className="text-ink-muted">Synced {p.synced}</span>
              <span className="text-ink-muted">{p.links}</span>
              <Button size="sm" variant="subtle">
                Open
              </Button>
            </div>
            {/* Narrow content: name and Open on one line, meta stacked under the name. */}
            <div className="flex items-start gap-2.5 [@container(min-width:40rem)]:hidden">
              <span className="pt-1.5">
                <StatusDot status={p.status} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-ink">{p.label}</span>
                <span className="block text-xs text-ink-subtle">
                  {p.kind} · {p.statusText} · synced {p.synced} · {p.links}
                </span>
              </span>
              <Button size="sm" variant="subtle">
                Open
              </Button>
            </div>
            {p.note && (
              <p className="mt-1 flex items-center gap-1.5 pl-[1.125rem] text-xs text-warning [@container(min-width:40rem)]:pl-0">
                <Icon icon={Warning} size="sm" />
                {p.note}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

const VIEWS: Record<WidgetId, () => ReactElement> = {
  'low-stock': LowStockView,
  'week-stats': WeekStatsView,
  'sales-chart': SalesChartView,
  'platform-overview': PlatformOverviewView,
};

function ExpandedView({ id, onBack, focusOnMount }: { id: WidgetId; onBack: () => void; focusOnMount: boolean }) {
  const backRef = useRef<HTMLButtonElement>(null);
  const View = VIEWS[id];
  useEffect(() => {
    if (focusOnMount) backRef.current?.focus();
  }, [id, focusOnMount]);
  // No top bar (revision 2): the widget title is the page heading.
  return (
    <section aria-labelledby="expanded-widget-heading" className="flex flex-col gap-4 px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <Button ref={backRef} size="sm" variant="subtle" leftIcon={ArrowLeft} onClick={onBack} className="-ml-3">
          Back to platforms
        </Button>
        <p className="text-xs text-ink-subtle">From Leda · today 10:24</p>
      </div>
      <h1 id="expanded-widget-heading" className="text-base font-semibold text-ink">
        {WIDGET_TITLE[id]}
      </h1>
      <View />
    </section>
  );
}

/* -------------------------------------------------------------- page ----- */

export interface ExpandedWidgetPrototypeProps {
  /** Widget shown expanded on mount (review stories); omit for Home. */
  initialExpanded?: WidgetId;
  /** Chat history (keep identity stable). */
  conversation?: LedaMessage[];
  ledaOpen?: boolean;
  ledaDrawerOpen?: boolean;
}

export function ExpandedWidgetPrototype({
  initialExpanded,
  conversation = WIDGET_CONVERSATION,
  ledaOpen = true,
  ledaDrawerOpen = false,
}: ExpandedWidgetPrototypeProps) {
  const [expanded, setExpanded] = useState<WidgetId | null>(initialExpanded ?? null);
  const [interacted, setInteracted] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const homeScroll = useRef(0);

  const scroller = () => pageRef.current?.closest('main') ?? null;

  const expand = (id: WidgetId, ctx: LedaAttachmentContext) => {
    const main = scroller();
    if (!expanded && main) homeScroll.current = main.scrollTop;
    setInteracted(true);
    setExpanded(id);
    ctx.dismiss();
    if (main) main.scrollTop = 0;
  };

  const back = () => {
    setExpanded(null);
    window.requestAnimationFrame(() => {
      const main = scroller();
      if (main) main.scrollTop = homeScroll.current;
    });
  };

  return (
    <DashboardShell
      active="home"
      ledaOpen={ledaOpen}
      ledaDrawerOpen={ledaDrawerOpen}
      ledaMessages={conversation}
      ledaPlaceholder={expanded ? `Ask about ${WIDGET_TITLE[expanded].toLowerCase()}…` : undefined}
      renderLedaAttachment={(m, ctx) => {
        const id = m.attachment as WidgetId;
        return <ChatWidget id={id} expanded={expanded === id} onExpand={() => expand(id, ctx)} />;
      }}
    >
      <div ref={pageRef}>{expanded ? <ExpandedView id={expanded} onBack={back} focusOnMount={interacted} /> : <ConnectionsOverview />}</div>
    </DashboardShell>
  );
}
