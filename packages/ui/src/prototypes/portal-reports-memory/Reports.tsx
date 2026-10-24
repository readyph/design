/**
 * PROTOTYPE (RDY-179, epic RDY-173 features 3, 6, 7) - Portal Reports in the Slack-style shell.
 * Same content and actions as `portal/src/modules/reports/ReportsPage.tsx`; layout, density and
 * theme only. List is a full-width dense table (search + kind filter); a row opens the report
 * detail (KPI strip, trend, details table). Leda: top-bar Ask Leda on every view, "Generate with
 * Leda" on the list, "Ask Leda about this report" on the detail.
 * Built only from @readyph/ui components and tokens. Never export from `src/index.ts`.
 */
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChartBar,
  CurrencyCircleDollar,
  FileText,
  Package,
  Users,
  WaveTriangle,
  Wrench,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { SearchBar } from '../../components/SearchBar';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { Sparkline } from '../../components/Sparkline';
import { Stat } from '../../components/Stat';
import { Table, type TableColumn } from '../../components/Table';
import type { LedaState, ShellTheme } from '../portal-shell/Shell';
import { PageShell, RetryNotice, useAskLeda, type ViewState } from './common';
import { contentsOf, humanize, isNumeric, kindLabel, reports as allReports, type Report, type ReportRow } from './data';

const kindIcon: Record<string, PhosphorIcon> = {
  sales: CurrencyCircleDollar,
  inventory: Package,
  customers: Users,
  service: Wrench,
};

/* ---------------------------------------------------------------- list */

function ReportsList({
  state,
  initialQuery = '',
  onOpen,
  onAskLeda,
}: {
  state: ViewState;
  initialQuery?: string;
  onOpen: (r: Report) => void;
  onAskLeda: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [kind, setKind] = useState('all');
  const source = state === 'empty' ? [] : allReports;
  const kinds = useMemo(() => Array.from(new Set(allReports.map((r) => r.kind))), []);
  const q = query.trim().toLowerCase();
  const rows = source.filter(
    (r) =>
      (kind === 'all' || r.kind === kind) &&
      (!q || r.title.toLowerCase().includes(q) || (r.summary ?? '').toLowerCase().includes(q)),
  );

  const columns: TableColumn<Report>[] = [
    {
      key: 'title',
      header: 'Report',
      className: 'w-full max-w-0 md:w-auto md:max-w-none',
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(r);
          }}
          className="flex w-full min-w-0 items-center gap-2 rounded-sm text-left font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
        >
          <Icon icon={kindIcon[r.kind] ?? FileText} size="sm" className="shrink-0 text-ink-subtle" />
          <span className="truncate md:whitespace-nowrap">{r.title}</span>
        </button>
      ),
    },
    {
      key: 'kind',
      header: 'Kind',
      className: 'hidden sm:table-cell',
      render: (r) => (
        <Badge tone="neutral" size="sm">
          {kindLabel[r.kind] ?? humanize(r.kind)}
        </Badge>
      ),
    },
    {
      key: 'summary',
      header: 'Summary',
      className: 'hidden w-full max-w-0 lg:table-cell',
      render: (r) => <span className="block truncate text-ink-muted">{r.summary ?? 'No summary'}</span>,
    },
    {
      key: 'contents',
      header: 'Contents',
      className: 'hidden whitespace-nowrap xl:table-cell',
      render: (r) => <span className="text-ink-muted">{contentsOf(r)}</span>,
    },
    {
      key: 'updated',
      header: 'Updated',
      align: 'right',
      className: 'whitespace-nowrap',
      render: (r) => <span className="text-ink-muted">{r.updated}</span>,
    },
  ];

  const filtersActive = Boolean(q) || kind !== 'all';
  const empty =
    state === 'empty' ? (
      <EmptyState
        icon={ChartBar}
        title="No reports yet"
        description="Save a report here, or ask Leda to generate one from your platforms' data."
        action={
          <Button leftIcon={WaveTriangle} onClick={onAskLeda}>
            Generate with Leda
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={ChartBar}
        title="No matching reports"
        description="Try a different search or kind."
        action={
          <Button
            variant="secondary"
            onClick={() => {
              setQuery('');
              setKind('all');
            }}
          >
            Clear filters
          </Button>
        }
      />
    );

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchBar
          size="sm"
          placeholder="Search reports"
          aria-label="Search reports"
          value={query}
          onValueChange={setQuery}
          className="w-full sm:w-64"
        />
        <Select
          size="sm"
          aria-label="Kind"
          value={kind}
          onValueChange={setKind}
          className="w-36"
          options={[
            { value: 'all', label: 'All kinds' },
            ...kinds.map((k) => ({ value: k, label: kindLabel[k] ?? humanize(k) })),
          ]}
        />
        <div className="ml-auto flex items-center gap-3">
          {state === 'ready' && (
            <span className="text-xs text-ink-subtle">
              {filtersActive ? `${rows.length} of ${source.length}` : source.length} reports
            </span>
          )}
          <Button leftIcon={WaveTriangle} onClick={onAskLeda}>
            Generate with Leda
          </Button>
        </div>
      </div>

      {state === 'error' ? (
        <RetryNotice title="Couldn't load reports">Something went wrong fetching your saved reports.</RetryNotice>
      ) : (
        <Table
          columns={columns}
          data={state === 'loading' ? [] : rows}
          loading={state === 'loading'}
          rowKey={(r) => r.id}
          onRowClick={onOpen}
          empty={empty}
          dense
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- detail */

function KpiStrip({ kpis }: { kpis: { label: string; value: string }[] }) {
  return (
    <div className="overflow-hidden rounded-panel border border-border bg-surface">
      <dl className="-mb-px -mr-px flex flex-wrap">
        {kpis.map((k) => (
          <div key={k.label} className="min-w-[9rem] flex-1 border-b border-r border-border px-3 py-2">
            <Stat label={k.label} value={k.value} className="[&_span]:text-xl" />
          </div>
        ))}
      </dl>
    </div>
  );
}

function TrendPanel({ series }: { series: number[] }) {
  const first = series[0];
  const last = series[series.length - 1];
  return (
    <section aria-label="Trend" className="flex min-w-0 flex-col gap-2 rounded-panel border border-border bg-surface p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-medium text-ink-muted">Trend · {series.length} periods</h3>
        <span className="text-xs tabular-nums text-ink-subtle">
          {first} → {last}
        </span>
      </div>
      <Sparkline points={series} width={640} height={128} area className="h-auto w-full" />
      <p className="sr-only">Values: {series.join(', ')}</p>
    </section>
  );
}

function DetailsTable({ rows }: { rows: ReportRow[] }) {
  const keys = Object.keys(rows[0] ?? {});
  const numeric = new Set(keys.filter((k) => rows.every((r) => r[k] == null || isNumeric(r[k]))));
  const columns: TableColumn<ReportRow>[] = keys.map((k, i) => ({
    key: k,
    header: humanize(k),
    align: numeric.has(k) ? 'right' : 'left',
    className: i === 0 ? 'w-full font-medium' : 'whitespace-nowrap',
    render: (r) => <span className={numeric.has(k) ? 'tabular-nums' : undefined}>{r[k] == null ? '' : String(r[k])}</span>,
  }));
  return (
    <section aria-label="Details" className="flex min-w-0 flex-col overflow-hidden rounded-panel border border-border bg-surface">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <h3 className="text-xs font-medium text-ink-muted">Details</h3>
        <span className="text-xs tabular-nums text-ink-subtle">
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>
      <Table columns={columns} data={rows} rowKey={(_, i) => i} dense className="rounded-none border-0 border-t" />
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading report" className="flex flex-col gap-3">
      <Skeleton height="1.5rem" width="40%" />
      <Skeleton height="4rem" />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Skeleton height="10rem" />
        <Skeleton height="10rem" />
      </div>
    </div>
  );
}

function ReportDetail({
  report,
  state,
  onBack,
  onAskLeda,
}: {
  report: Report;
  state: ViewState;
  onBack: () => void;
  onAskLeda: () => void;
}) {
  const { kpis = [], series = [], rows = [] } = report.data;
  const hasData = kpis.length > 0 || series.length > 1 || rows.length > 0;
  return (
    <article aria-labelledby="report-title" className="flex min-w-0 flex-col gap-3">
      <header className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <IconButton icon={ArrowLeft} label="Back to reports" size="sm" onClick={onBack} />
        <div className="min-w-0 flex-1 basis-60">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="report-title" className="text-base font-semibold text-ink">
              {report.title}
            </h2>
            <Badge tone="neutral" size="sm">
              {kindLabel[report.kind] ?? humanize(report.kind)}
            </Badge>
          </div>
          <p className="text-xs text-ink-subtle">
            {report.summary ? `${report.summary} · ` : ''}Updated {report.updated}
          </p>
        </div>
        <Button variant="secondary" leftIcon={WaveTriangle} onClick={onAskLeda} className="ml-11 sm:ml-0">
          Ask Leda about this
        </Button>
      </header>

      {state === 'loading' ? (
        <DetailSkeleton />
      ) : state === 'error' ? (
        <RetryNotice title="Couldn't load this report">Something went wrong fetching the report.</RetryNotice>
      ) : !hasData ? (
        <div className="rounded-panel border border-border bg-surface">
          <EmptyState
            icon={ChartBar}
            title="Nothing to display"
            description="This report has no chartable data yet. Ask Leda to fill it from your platforms."
            action={
              <Button leftIcon={WaveTriangle} onClick={onAskLeda}>
                Ask Leda to fill it
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {kpis.length > 0 && <KpiStrip kpis={kpis} />}
          {(series.length > 1 || rows.length > 0) && (
            <div
              className={
                series.length > 1 && rows.length > 0
                  ? 'grid grid-cols-1 gap-3 xl:grid-cols-2'
                  : 'grid grid-cols-1 gap-3'
              }
            >
              {series.length > 1 && <TrendPanel series={series} />}
              {rows.length > 0 && <DetailsTable rows={rows} />}
            </div>
          )}
        </>
      )}
    </article>
  );
}

/* ---------------------------------------------------------------- page */

export interface ReportsPageProps {
  theme?: ShellTheme;
  /** Open a report on mount (detail view). */
  reportId?: string;
  state?: ViewState;
  /** Prefill the list search (no-results state). */
  query?: string;
  leda?: LedaState;
}

export function ReportsPage({ theme = 'light', reportId, state = 'ready', query, leda: initialLeda = 'closed' }: ReportsPageProps) {
  const [openId, setOpenId] = useState<string | undefined>(reportId);
  const { leda, ask } = useAskLeda(initialLeda);
  const open = allReports.find((r) => r.id === openId);
  return (
    <PageShell theme={theme} page="reports" leda={leda}>
      {open ? (
        <ReportDetail report={open} state={state} onBack={() => setOpenId(undefined)} onAskLeda={ask} />
      ) : (
        <ReportsList state={state} initialQuery={query} onOpen={(r) => setOpenId(r.id)} onAskLeda={ask} />
      )}
    </PageShell>
  );
}
