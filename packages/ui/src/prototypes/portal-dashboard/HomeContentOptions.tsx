/**
 * RDY-217 prototype: owner-choice content options for Portal Home, all inside the RDY-213 shell and
 * built on the RDY-214 pieces (shared ConnectionsOverview map). Revision 2: the Needs attention strip
 * is removed from every option, so each option now adds one thing (or nothing) around the map.
 *
 * Owner direction applied to every option: no cards, no stats in cards (the KPI strip is flat
 * typography on dividers), the connections map stays the main content, the Leda column stays the
 * full-height column with the previous chat.
 *
 * Options: A baseline (RDY-214, reference), B KPI strip, C Pending approvals, D Activity feed (needs a
 * new API, out of scope for v1), E Combined (KPI strip + approvals).
 *
 * Leda entry points: per-option suggested prompts in the panel; "Ask Leda" on every approval row
 * (prefills the panel); each KPI is a link into its platform; activity rows link to
 * the source platform.
 */
import { useState } from 'react';
import { ArrowRight, CheckCircle, Sparkle } from '@phosphor-icons/react';
import { Badge, Button, ButtonLink, EmptyState, Icon, Link, Stat } from '../../index';
import { DashboardShell, type DashboardShellProps, type LedaPrefill } from './DashboardShell';
import { ConnectionsOverview } from './ConnectionsOverview';
import { HOME_LEDA_SUGGESTIONS, MAP_DEFAULT, type MapData } from './home-data';
import { ACTIVITY, APPROVALS, KPIS, OPTION_LEDA_SUGGESTIONS, type Approval } from './options-data';

export type HomeOption = 'baseline' | 'kpi' | 'approvals' | 'combined' | 'activity';

export const OPTION_META: Record<HomeOption, { name: string; note?: string }> = {
  baseline: { name: 'Option A · Baseline (RDY-214): the map only' },
  kpi: { name: 'Option B · KPI strip above the map' },
  approvals: { name: 'Option C · Pending approvals under the map' },
  activity: { name: 'Option D · Recent activity under the map', note: 'Needs a new tenant activity feed API. Out of scope for v1.' },
  combined: { name: 'Option E · Combined: KPI strip above the map, approvals below' },
};

/* ------------------------------------------------------------ Option A -- */

/** Four flat figures on hairline dividers: no tiles, no fills, no borders around each figure. */
export function KpiStrip() {
  return (
    <section aria-label="Today across your platforms" className="px-4 pt-5 sm:px-6">
      <ul className={'grid grid-cols-2 gap-x-6 gap-y-5 py-4 [@container(min-width:40rem)]:grid-cols-4 [@container(min-width:40rem)]:gap-x-0'}>
        {KPIS.map((k) => (
          <li key={k.id} className={'min-w-0  [@container(min-width:40rem)]:px-5 [@container(min-width:40rem)]:first:pl-0'}>
            <Link href={k.href} underline="none" className="flex w-full flex-col items-stretch rounded-md hover:text-ink">
              <Stat label={k.label} value={k.value} delta={k.delta} deltaTone={k.deltaTone} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------ Option B -- */

type Resolution = 'approved' | 'declined';

const approvalGrid = 'grid grid-cols-1 items-start gap-x-4 gap-y-2 py-3 [@container(min-width:40rem)]:grid-cols-[minmax(0,1fr)_auto] [@container(min-width:40rem)]:items-center';

function ApprovalRow({
  item,
  resolution,
  onResolve,
  onUndo,
  onAskLeda,
}: {
  item: Approval;
  resolution?: Resolution;
  onResolve: (id: string, r: Resolution) => void;
  onUndo: (id: string) => void;
  onAskLeda: (item: Approval) => void;
}) {
  if (resolution) {
    return (
      <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm text-ink-muted">
        <Icon icon={CheckCircle} size="sm" className="text-success-fg" />
        <span role="status">{resolution === 'approved' ? item.approvedNote : `Declined: ${item.title}.`}</span>
        <Button size="sm" variant="subtle" onClick={() => onUndo(item.id)}>
          Undo
        </Button>
      </li>
    );
  }
  return (
    <li className={approvalGrid}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{item.title}</p>
        <p className="text-xs text-ink-subtle">
          {item.platform} · {item.detail} · {item.requestedBy}, {item.requestedAgo}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {item.kind === 'leda' ? (
          <Button size="sm" variant="secondary" leftIcon={Sparkle} onClick={() => onAskLeda(item)} aria-label={`Review in Leda: ${item.title}`}>
            Review in Leda
          </Button>
        ) : (
          <>
            <Button size="sm" variant="subtle" leftIcon={Sparkle} onClick={() => onAskLeda(item)} aria-label={`Ask Leda about: ${item.title}`}>
              Ask Leda
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onResolve(item.id, 'declined')} aria-label={`Decline: ${item.title}`}>
          Decline
            </Button>
            <Button size="sm" onClick={() => onResolve(item.id, 'approved')} aria-label={`Approve: ${item.title}`}>
              Approve
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export function PendingApprovals({ onAskLeda, empty = false }: { onAskLeda: (item: Approval) => void; empty?: boolean }) {
  const [done, setDone] = useState<Record<string, Resolution>>({});
  const items = empty ? [] : APPROVALS;
  const open = items.filter((i) => !done[i.id]).length;
  return (
    <section id="approvals" aria-labelledby="approvals-heading" className="flex flex-col gap-3 px-4 pb-6 sm:px-6">
      <header className="flex items-baseline gap-2">
        <h2 id="approvals-heading" className="text-base font-semibold text-ink">
          Waiting for your approval
        </h2>
        {items.length > 0 && <span className="text-sm text-ink-muted">{open} open</span>}
      </header>
      {items.length === 0 ? (
        <EmptyState icon={CheckCircle} title="Nothing to approve" description="Requests from your platforms that need a decision show up here." className="max-w-none border-y border-border py-8" />
      ) : (
        <ul className="flex flex-col">
          {items.map((it) => (
            <ApprovalRow
              key={it.id}
              item={it}
              resolution={done[it.id]}
              onResolve={(id, r) => setDone((d) => ({ ...d, [id]: r }))}
              onUndo={(id) => setDone(({ [id]: _removed, ...rest }) => rest)}
              onAskLeda={onAskLeda}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ Option D -- */

export function RecentActivity() {
  return (
    <section aria-labelledby="activity-heading" className="flex flex-col gap-3 px-4 pb-8 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="activity-heading" className="text-base font-semibold text-ink">
          Recent activity
        </h2>
        <Link href="/activity" className="text-sm">
          View all
        </Link>
      </header>
      <ul className="flex flex-col">
        {ACTIVITY.map((e) => (
          <li key={e.id} className={'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 py-3'}>
            <div className="min-w-0">
              <p className="text-sm text-ink">
                <span className="font-medium">{e.actor}</span> {e.text}
              </p>
              <p className="text-xs text-ink-subtle">{e.platform}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-subtle">
              <span className="whitespace-nowrap">{e.ago}</span>
              <ButtonLink size="sm" variant="subtle" rightIcon={ArrowRight} href={e.href} aria-label={`Open: ${e.actor} ${e.text}`}>
                Open
              </ButtonLink>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* --------------------------------------------------------------- frame -- */

/** Review-only label naming the option; it is not part of the proposed page. */
function OptionLabel({ option }: { option: HomeOption }) {
  const m = OPTION_META[option];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-surface-muted px-4 py-2 text-xs text-ink-muted sm:px-6">
      <span className="font-medium text-ink">{m.name}</span>
      {m.note && (
        <Badge tone="warning" size="sm">
          {m.note}
        </Badge>
      )}
    </div>
  );
}

export interface HomeContentOptionsProps extends Omit<DashboardShellProps, 'children' | 'active' | 'ledaSuggestions' | 'ledaPrefill'> {
  option?: HomeOption;
  map?: MapData;
  /** Show the empty state of the approvals section. */
  approvalsEmpty?: boolean;
  onNodeSelect?: (id: string) => void;
}

export function HomeContentOptions({ option = 'combined', map = MAP_DEFAULT, approvalsEmpty = false, onNodeSelect, ...shell }: HomeContentOptionsProps) {
  const [prefill, setPrefill] = useState<LedaPrefill | undefined>();
  const ask = (text: string) => setPrefill({ text, key: Date.now() });
  const askApproval = (i: Approval) => ask(i.kind === 'leda' ? `Open your proposal: ${i.title}.` : `Should I approve "${i.title}"?`);
  const hasKpi = option === 'kpi' || option === 'combined';
  const hasApprovals = option === 'approvals' || option === 'combined';
  const suggestions =
    option === 'baseline' ? HOME_LEDA_SUGGESTIONS : option === 'activity' ? OPTION_LEDA_SUGGESTIONS.activity : hasApprovals ? OPTION_LEDA_SUGGESTIONS.approvals : OPTION_LEDA_SUGGESTIONS.kpi;
  const showLower = map.platforms.length > 0;
  return (
    <DashboardShell {...shell} active="home" ledaSuggestions={[...suggestions]} ledaPrefill={prefill}>
      <OptionLabel option={option} />
      {hasKpi && showLower && <KpiStrip />}
      <ConnectionsOverview data={map} onNodeSelect={onNodeSelect} onAddPlatform={shell.onAddPlatform} />
      {showLower && hasApprovals && <PendingApprovals onAskLeda={askApproval} empty={approvalsEmpty} />}
      {showLower && option === 'activity' && <RecentActivity />}
    </DashboardShell>
  );
}
