/**
 * PROTOTYPE (RDY-177, epic RDY-173 features 1, 2, 5) - Portal Home in the Slack-style shell.
 * Dense two-column page: greeting + period, Leda composer, KPI strip, revenue by platform,
 * platform cards (status, alerts, last sync) on the left; activity feed on the right.
 *
 * Built only from @readyph/ui 0.7 components and tokens (no <style>, no hex, no inline style);
 * replaces the `.rpb` block in the Portal's DashboardPage. Kit gaps are listed in MISSING_IN_KIT
 * for Leonardo. Never export anything from this folder in `src/index.ts`.
 *
 * Leda entry points: the Home composer (and its suggestion chips) opens the Leda side panel with
 * the question; activity rows written by Leda-confirmed actions carry a "via Leda" marker.
 */
import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  ClockCounterClockwise,
  Package,
  Plus,
  Warning,
  WaveTriangle,
  Wrench,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge, type BadgeTone } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { Input } from '../../components/Input';
import { LedaWidget } from '../../components/LedaWidget';
import { Link } from '../../components/Link';
import { ProgressBar } from '../../components/ProgressBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Skeleton } from '../../components/Skeleton';
import { Stat } from '../../components/Stat';
import { StatusDot, type StatusTone } from '../../components/StatusDot';
import { cn } from '../../utils/cn';
import { Shell, type ChromeVariant, type LedaState, type ShellRole, type ShellTheme } from '../portal-shell/Shell';

/** For Leonardo: what this prototype composes by hand because the kit does not ship it yet. */
export const MISSING_IN_KIT = [
  'RevenueChart rework: small radius (rounded-panel), tokens instead of the hex PALETTE and inline colours, horizontal by-platform bars with direct labels (value, share, change), `period` + `onPeriodChange` + `periodOptions` replacing the dead `sortOptions` menu; omit `periodOptions` to hide the control. Previewed with Card + ProgressBar rows.',
  'Meter semantics for share bars: ProgressBar renders role="progressbar"; a `Meter` (role="meter") or a `variant="meter"` is the right element for revenue share.',
  'ActivityFeed (new): rows with actor Avatar, sentence (actor, action, target), relative time with <time dateTime>, `source="leda"` marker, `loading` (skeleton rows), `empty`, and cursor `onLoadMore` / `hasMore` / `loadingMore`. Previewed with a Card + list.',
  'Badge `icon` prop (the "via Leda" marker puts a 12px WaveTriangle inside a primary Badge).',
  'StatTile / KPI strip: Stat grid in one hairline card (gap-px on bg-border) as a kit pattern, with `caption` per tile for the comparison period.',
  'PlatformStatusCard (new): name, status Badge (Online / Degraded / Offline), 2 headline metrics, provider alerts, last sync, Open link; offline variant with Reconnect.',
  'Home composer: a single-line Leda prompt (Input + Ask + Suggestions) as `LedaComposer`; LedaWidget.Suggestions chips need rounded-control (rounded-full today).',
  'EmptyState `size="sm"` (py-6, 32px icon) for empty states inside cards.',
];

/* ------------------------------------------------------------------ data */

export type Period = 'today' | 'week' | 'month' | 'quarter';
export type ProvidersState = 'live' | 'pending';
export type ActivityState = 'ready' | 'loading' | 'empty';
export type PlatformsState = 'mixed' | 'offline';

const periodOptions: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
];

interface PeriodData {
  /** Honest range caption: the exact range and what it is compared with. */
  range: string;
  compare: string;
  revenue: string;
  revenueDelta: string;
  revenueUp: boolean;
  jobsDone: string;
  jobsDelta: string;
  newCustomers: string;
  customersDelta: string;
  inventory: { value: string; amount: number; delta: string };
  sms: { value: string; amount: number; delta: string };
  spark: number[];
}

const byPeriod: Record<Period, PeriodData> = {
  today: {
    range: 'Fri 24 Oct, 00:00 to 10:45',
    compare: 'vs same time yesterday',
    revenue: '₱48,210',
    revenueDelta: '+6.1%',
    revenueUp: true,
    jobsDone: '7',
    jobsDelta: '-2',
    newCustomers: '3',
    customersDelta: '+1',
    inventory: { value: '₱29,640', amount: 29640, delta: '+9.8%' },
    sms: { value: '₱18,570', amount: 18570, delta: '+0.7%' },
    spark: [2, 4, 3, 6, 5, 7, 8],
  },
  week: {
    range: 'Mon 20 to Fri 24 Oct',
    compare: 'vs Mon 13 to Fri 17 Oct',
    revenue: '₱286,400',
    revenueDelta: '+3.2%',
    revenueUp: true,
    jobsDone: '41',
    jobsDelta: '+5',
    newCustomers: '14',
    customersDelta: '+2',
    inventory: { value: '₱171,900', amount: 171900, delta: '+4.4%' },
    sms: { value: '₱114,500', amount: 114500, delta: '+1.5%' },
    spark: [5, 6, 5, 7, 8, 7, 9],
  },
  month: {
    range: '1 to 24 Oct',
    compare: 'vs 1 to 24 Sep',
    revenue: '₱1,240,800',
    revenueDelta: '+12.4%',
    revenueUp: true,
    jobsDone: '168',
    jobsDelta: '+21',
    newCustomers: '52',
    customersDelta: '+9',
    inventory: { value: '₱772,300', amount: 772300, delta: '+15.9%' },
    sms: { value: '₱468,500', amount: 468500, delta: '+7.1%' },
    spark: [4, 5, 7, 6, 8, 9, 11],
  },
  quarter: {
    range: '1 Oct to 24 Oct (Q4 to date)',
    compare: 'vs 1 Jul to 24 Jul',
    revenue: '₱1,240,800',
    revenueDelta: '-2.3%',
    revenueUp: false,
    jobsDone: '168',
    jobsDelta: '-11',
    newCustomers: '52',
    customersDelta: '-4',
    inventory: { value: '₱772,300', amount: 772300, delta: '-0.8%' },
    sms: { value: '₱468,500', amount: 468500, delta: '-4.7%' },
    spark: [9, 8, 8, 7, 8, 7, 7],
  },
};

const toneFor = (delta: string): 'success' | 'error' => (delta.startsWith('-') ? 'error' : 'success');

/* --------------------------------------------------------------- greeting */

function Greeting({
  providers,
  period,
  onPeriod,
}: {
  providers: ProvidersState;
  period: Period;
  onPeriod: (p: Period) => void;
}) {
  const d = byPeriod[period];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="min-w-0 text-sm text-ink-muted">
        <span className="font-semibold text-ink">Good morning, Earvin</span>
        <span aria-hidden="true"> · </span>
        {providers === 'live' ? (
          <>
            <span className="whitespace-nowrap">{d.range}</span>
            <span aria-hidden="true"> · </span>
            <span className="whitespace-nowrap">{d.compare}</span>
          </>
        ) : (
          <span className="whitespace-nowrap">Month to date, 1 to 24 Oct</span>
        )}
      </p>
      {providers === 'live' && (
        <SegmentedControl
          size="sm"
          aria-label="Period for KPIs and revenue"
          className="ml-auto p-0.5"
          value={period}
          onChange={(v) => onPeriod(v as Period)}
          options={periodOptions}
        />
      )}
    </div>
  );
}

/* --------------------------------------------------------------- composer */

const SUGGESTIONS = ['Which platform needs attention?', 'Summarise this week', 'What is low on stock?'];

/** Leda entry point: submitting (or picking a chip) opens the Leda side panel with the question. */
function LedaComposer({ onAsk }: { onAsk: (q: string) => void }) {
  const [q, setQ] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onAsk(q.trim() || SUGGESTIONS[0]);
    setQ('');
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-2" aria-label="Ask Leda">
      <div className="flex min-w-0 gap-2">
        <div className="min-w-0 flex-1">
          <Input
            leftIcon={WaveTriangle}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask Leda about your business…"
            aria-label="Message Leda"
          />
        </div>
        <Button type="submit" rightIcon={ArrowRight}>
          Ask
        </Button>
      </div>
      <LedaWidget.Suggestions
        items={SUGGESTIONS}
        onSelect={onAsk}
        className="gap-1.5 [&>button:nth-child(3)]:hidden sm:[&>button:nth-child(3)]:inline-flex [&>button]:rounded-control"
      />
    </form>
  );
}

/* -------------------------------------------------------------- KPI strip */

function KpiStrip({ period }: { period: Period }) {
  const d = byPeriod[period];
  const tiles = [
    { label: 'Revenue', value: d.revenue, change: d.revenueDelta, points: d.spark },
    { label: 'Jobs completed', value: d.jobsDone, change: d.jobsDelta },
    { label: 'New customers', value: d.newCustomers, change: d.customersDelta },
    { label: 'Open jobs', value: '18', change: null, note: 'Right now · 3 overdue' },
  ];
  return (
    <Card
      padding="none"
      className="grid grid-cols-2 gap-px overflow-hidden bg-border [@container(min-width:36rem)]:grid-cols-4"
    >
      {tiles.map((t) => {
        const tone = t.change ? toneFor(t.change) : 'neutral';
        return (
          <Stat
            key={t.label}
            label={t.label}
            value={t.value}
            delta={
              t.change ? (
                <>
                  {t.change}
                  <span className="sr-only"> {d.compare}</span>
                </>
              ) : (
                t.note
              )
            }
            deltaTone={tone}
            points={t.points}
            sparklineTone={tone === 'error' ? 'error' : 'primary'}
            className="bg-surface px-3 py-2.5 [&>div>span]:text-xl [&_svg]:hidden [@container(min-width:56rem)]:[&_svg]:block"
          />
        );
      })}
    </Card>
  );
}

/* -------------------------------------------------------- revenue by platform */

function RevenueByPlatform({ period, providers }: { period: Period; providers: ProvidersState }) {
  const d = byPeriod[period];
  const rows = [
    { id: 'inventory', label: 'Inventory', icon: Package, ...d.inventory },
    { id: 'sms', label: 'Service Management', icon: Wrench, ...d.sms },
  ];
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const max = Math.max(...rows.map((r) => r.amount));
  return (
    <Card padding="sm" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h2 className="text-sm font-semibold text-ink">Revenue by platform</h2>
        <p className="text-xs text-ink-subtle">
          {providers === 'live' ? `${d.range} · ${d.compare}` : 'Month to date · other periods arrive with live metrics'}
        </p>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tabular-nums text-ink">{d.revenue}</span>
        {providers === 'live' && (
          <span className={cn('text-xs font-medium', d.revenueUp ? 'text-success-fg' : 'text-error-fg')}>
            {d.revenueDelta}
          </span>
        )}
      </div>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r) => {
          const share = Math.round((r.amount / total) * 100);
          return (
            <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 [@container(min-width:36rem)]:grid-cols-[11rem_minmax(0,1fr)_auto]">
              <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
                <Icon icon={r.icon} size="sm" className="shrink-0 text-ink-muted" />
                {r.label}
              </span>
              <ProgressBar
                value={(r.amount / max) * 100}
                size="sm"
                label={`${r.label}: ${r.value}, ${share}% of revenue`}
                className="order-last col-span-2 rounded-sm [@container(min-width:36rem)]:order-none [@container(min-width:36rem)]:col-span-1 [&>div]:rounded-sm"
              />
              <span className="flex items-baseline justify-end gap-2 whitespace-nowrap text-sm tabular-nums">
                <span className="font-medium text-ink">{r.value}</span>
                <span className="w-8 text-right text-xs text-ink-subtle">{share}%</span>
                {providers === 'live' && (
                  <span className={cn('w-12 text-right text-xs', toneFor(r.delta) === 'success' ? 'text-success-fg' : 'text-error-fg')}>
                    {r.delta}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* --------------------------------------------------------- platform cards */

interface PlatformCardData {
  id: string;
  name: string;
  icon: PhosphorIcon;
  status: 'online' | 'degraded' | 'offline';
  metrics: { label: string; value: string }[];
  alerts: string[];
  synced: string;
}

const statusMeta: Record<PlatformCardData['status'], { label: string; tone: BadgeTone; dot: StatusTone }> = {
  online: { label: 'Online', tone: 'success', dot: 'active' },
  degraded: { label: 'Degraded', tone: 'warning', dot: 'degraded' },
  offline: { label: 'Offline', tone: 'neutral', dot: 'offline' },
};

const platformData = (state: PlatformsState): PlatformCardData[] => [
  {
    id: 'inventory',
    name: 'Inventory',
    icon: Package,
    status: 'online',
    metrics: [
      { label: 'Products', value: '1,284' },
      { label: 'Open POs', value: '6' },
    ],
    alerts: ['7 items low on stock'],
    synced: 'Synced 2 min ago',
  },
  state === 'offline'
    ? {
        id: 'sms',
        name: 'Service Management',
        icon: Wrench,
        status: 'offline',
        metrics: [],
        alerts: [],
        synced: 'Disconnected 24 Oct, 09:12',
      }
    : {
        id: 'sms',
        name: 'Service Management',
        icon: Wrench,
        status: 'degraded',
        metrics: [
          { label: 'Jobs today', value: '12' },
          { label: 'Open jobs', value: '18' },
        ],
        alerts: ['3 jobs overdue', 'Payments data link missing'],
        synced: 'Last good sync 41 min ago',
      },
];

function PlatformCard({ p, role }: { p: PlatformCardData; role: ShellRole }) {
  const s = statusMeta[p.status];
  return (
    <Card padding="sm" className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon icon={p.icon} size="sm" className="shrink-0 text-ink-muted" />
        <h3 className="min-w-0 flex-1 text-sm font-semibold text-ink">{p.name}</h3>
        <Badge tone={s.tone} size="sm" dot className="rounded-sm">
          {s.label}
        </Badge>
      </div>
      {p.metrics.length > 0 ? (
        <dl className="grid grid-cols-2 gap-2">
          {p.metrics.map((m) => (
            <div key={m.label} className="min-w-0">
              <dt className="text-xs text-ink-subtle">{m.label}</dt>
              <dd className="text-base font-semibold tabular-nums text-ink">{m.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-ink-muted">
          Not connected. Metrics, alerts and Leda answers for this platform pause until it is reconnected.
        </p>
      )}
      {p.alerts.length > 0 && (
        <ul className="flex flex-col gap-1" aria-label={`${p.name} alerts`}>
          {p.alerts.map((a) => (
            <li key={a} className="flex items-center gap-1.5 text-xs text-warning-fg">
              <Icon icon={Warning} size="sm" className="shrink-0" />
              {a}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2">
        <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-subtle">
          <StatusDot status={s.dot} size="sm" pulse={false} />
          {p.synced}
        </span>
        {p.status === 'offline' ? (
          role === 'admin' && (
            <Button size="sm" variant="secondary" className="h-7 px-2 text-xs">
              Reconnect
            </Button>
          )
        ) : (
          <Link href={`#${p.id}`} className="shrink-0 text-xs">
            Open<span className="sr-only"> {p.name}</span>
          </Link>
        )}
      </div>
    </Card>
  );
}

function PlatformCards({ role, state }: { role: ShellRole; state: PlatformsState }) {
  return (
    <section aria-labelledby="home-platforms" className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 id="home-platforms" className="text-sm font-semibold text-ink">
          Platforms
        </h2>
        <Link href="#platforms" className="text-xs">
          Manage
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 [@container(min-width:30rem)]:grid-cols-2 [@container(min-width:56rem)]:grid-cols-3">
        {platformData(state).map((p) => (
          <PlatformCard key={p.id} p={p} role={role} />
        ))}
        {role === 'admin' && (
          <button
            type="button"
            className="hidden min-h-24 items-center justify-center gap-2 rounded-panel border border-dashed border-border-strong text-sm text-ink-muted hover:bg-surface-subtle hover:text-ink [@container(min-width:56rem)]:flex"
          >
            <Icon icon={Plus} size="sm" />
            Connect a platform
          </button>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- activity feed */

interface ActivityRow {
  id: string;
  actor: string;
  action: string;
  target: string;
  context?: string;
  time: string;
  iso: string;
  source: 'rest' | 'leda';
}

const firstPage: ActivityRow[] = [
  { id: 'a1', actor: 'Earvin Gemenez', action: 'invited', target: 'Ana Reyes', context: 'to Service Management as Member', time: '10:42', iso: '2026-10-24T10:42', source: 'leda' },
  { id: 'a2', actor: 'Maria Santos', action: 'changed the role of', target: 'Paolo Cruz', context: 'to Admin', time: '10:05', iso: '2026-10-24T10:05', source: 'rest' },
  { id: 'a3', actor: 'System', action: 'marked', target: 'Service Management', context: 'as degraded (sync errors)', time: '09:40', iso: '2026-10-24T09:40', source: 'rest' },
  { id: 'a4', actor: 'Earvin Gemenez', action: 'created purchase order', target: 'PO-1042', context: 'in Inventory', time: '09:12', iso: '2026-10-24T09:12', source: 'leda' },
  { id: 'a5', actor: 'Paolo Cruz', action: 'renamed', target: 'Inventory', context: 'to "Main warehouse"', time: 'Yesterday', iso: '2026-10-23T17:20', source: 'rest' },
  { id: 'a6', actor: 'Maria Santos', action: 'connected', target: 'Service Management', time: 'Yesterday', iso: '2026-10-23T14:02', source: 'rest' },
  { id: 'a7', actor: 'Earvin Gemenez', action: 'resent the invite to', target: 'Lito Ramos', time: 'Wed', iso: '2026-10-22T11:30', source: 'rest' },
];

const secondPage: ActivityRow[] = [
  { id: 'b1', actor: 'Maria Santos', action: 'suspended', target: 'Jun Dizon', time: 'Tue', iso: '2026-10-21T16:45', source: 'rest' },
  { id: 'b2', actor: 'Earvin Gemenez', action: 'saved a memory', target: '"Close books on the 25th"', time: 'Mon', iso: '2026-10-20T08:15', source: 'leda' },
  { id: 'b3', actor: 'Paolo Cruz', action: 'disconnected', target: 'Fleet (trial)', time: '18 Oct', iso: '2026-10-18T10:00', source: 'rest' },
];

function ActivityItem({ r }: { r: ActivityRow }) {
  return (
    <li className="flex gap-2 px-3 py-2 hover:bg-surface-subtle">
      <Avatar name={r.actor} size="xs" className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-ink-muted">
          <span className="font-medium text-ink">{r.actor}</span> {r.action}{' '}
          <span className="font-medium text-ink">{r.target}</span>
          {r.context && <> {r.context}</>}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-subtle">
          <time dateTime={r.iso}>{r.time}</time>
          {r.source === 'leda' && (
            <Badge tone="primary" size="sm" className="gap-1 rounded-sm px-1.5 py-0">
              <Icon icon={WaveTriangle} size={12} />
              via Leda
            </Badge>
          )}
        </p>
      </div>
    </li>
  );
}

export function ActivityFeed({ state }: { state: ActivityState }) {
  const [page, setPage] = useState<'one' | 'loading' | 'two'>('one');
  useEffect(() => setPage('one'), [state]);
  const rows = page === 'two' ? [...firstPage, ...secondPage] : firstPage;
  return (
    <Card padding="none" className="flex min-w-0 flex-col" aria-labelledby="home-activity" role="region">
      <div className="flex h-10 items-center justify-between gap-2 border-b border-border px-3">
        <h2 id="home-activity" className="text-sm font-semibold text-ink">
          Recent activity
        </h2>
        <span className="text-xs text-ink-subtle">All platforms</span>
      </div>
      {state === 'loading' && (
        <ul aria-busy="true" aria-label="Loading activity" className="flex flex-col">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex gap-2 px-3 py-2">
              <Skeleton variant="circle" className="h-6 w-6 shrink-0" />
              <div className="flex flex-1 flex-col gap-1.5 pt-0.5">
                <Skeleton variant="text" className={cn('h-3', i % 2 ? 'w-3/4' : 'w-11/12')} />
                <Skeleton variant="text" className="h-2.5 w-12" />
              </div>
            </li>
          ))}
        </ul>
      )}
      {state === 'empty' && (
        <EmptyState
          icon={ClockCounterClockwise}
          title="No activity yet"
          description="Invites, role changes, platform connections and actions you confirm with Leda show here."
          className="py-8 [&>span]:h-10 [&>span]:w-10"
        />
      )}
      {state === 'ready' && (
        <>
          <ol className="flex flex-col py-1">
            {rows.map((r) => (
              <ActivityItem key={r.id} r={r} />
            ))}
          </ol>
          <div className="border-t border-border p-1.5">
            {page === 'two' ? (
              <p className="py-1 text-center text-xs text-ink-subtle">No older activity</p>
            ) : (
              <Button
                variant="subtle"
                fullWidth
                loading={page === 'loading'}
                className="h-7 text-xs"
                onClick={() => {
                  setPage('loading');
                  window.setTimeout(() => setPage('two'), 600);
                }}
              >
                Load more
              </Button>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------- page */

export interface HomePageProps {
  role?: ShellRole;
  providers?: ProvidersState;
  activity?: ActivityState;
  platforms?: PlatformsState;
  initialPeriod?: Period;
  onAsk?: (q: string) => void;
}

/**
 * Layout follows the page's own width (container queries), not the viewport, because the docked
 * Leda panel takes 360px: two columns (main + 22rem activity) from 60rem of content, else one
 * column with the feed after the platform cards. Inside the main column: KPIs 4-up and revenue
 * bars inline from 36rem, platform cards 2-up from 30rem, sparkline and 3-up cards from 56rem. Users without the activity permission get no
 * feed and the main column takes the full width.
 */
export function HomePage({
  role = 'admin',
  providers = 'live',
  activity = 'ready',
  platforms = 'mixed',
  initialPeriod = 'month',
  onAsk = () => {},
}: HomePageProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod);
  useEffect(() => setPeriod(initialPeriod), [initialPeriod]);
  const effective: Period = providers === 'live' ? period : 'month';
  const canSeeActivity = role === 'admin';
  return (
    <div className="flex min-w-0 flex-col gap-3 [container-type:inline-size]">
      <Greeting providers={providers} period={effective} onPeriod={setPeriod} />
      <div className={cn('grid grid-cols-1 items-start gap-3', canSeeActivity && '[@container(min-width:60rem)]:grid-cols-[minmax(0,1fr)_22rem]')}>
        <div className="flex min-w-0 flex-col gap-3 [container-type:inline-size]">
          <LedaComposer onAsk={onAsk} />
          <KpiStrip period={effective} />
          <RevenueByPlatform period={effective} providers={providers} />
          <PlatformCards role={role} state={platforms} />
        </div>
        {canSeeActivity && <ActivityFeed state={activity} />}
      </div>
    </div>
  );
}

/* --------------------------------------------------------- page in shell */

export interface HomeProps extends Omit<HomePageProps, 'onAsk'> {
  theme?: ShellTheme;
  chrome?: ChromeVariant;
  leda?: LedaState;
}

/** Home inside the RDY-175 shell. The composer opens the Leda side panel with a conversation. */
export function Home({ theme = 'light', chrome = 'ink', leda: initialLeda = 'closed', role = 'admin', ...page }: HomeProps) {
  const [leda, setLeda] = useState<LedaState>(initialLeda);
  useEffect(() => setLeda(initialLeda), [initialLeda]);
  // The shell owns its panel state and follows changes of `leda`; going through `closed` makes a
  // second Ask re-open the panel after the user closed it.
  const ask = () => {
    setLeda('closed');
    window.requestAnimationFrame(() => setLeda('conversation'));
  };
  return (
    <Shell theme={theme} chrome={chrome} role={role} leda={leda} initialPage="home">
      <HomePage role={role} onAsk={ask} {...page} />
    </Shell>
  );
}
