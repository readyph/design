/**
 * RDY-214 prototype: Portal Home inside the RDY-213 shell.
 *
 * Owner direction: the connections map is the main content; no cards, no stats in cards; the Leda
 * column stays the fixed flush column with the previous chat. Below the map, a flat Needs attention
 * strip (top 5 across platforms, most severe first) with divided rows.
 *
 * Leda entry points: "What needs my attention?" is the first suggested prompt in the panel on Home;
 * every attention row has "Ask Leda", which opens the panel with the input prefilled for that item.
 */
import { useState } from 'react';
import { ArrowRight, CheckCircle, Sparkle, Warning } from '@phosphor-icons/react';
import { Badge, Button, ButtonLink, EmptyState, Icon, Link, Skeleton, cn, type BadgeTone } from '../../index';
import { DashboardShell, type DashboardShellProps, type LedaPrefill } from './DashboardShell';
import { ConnectionsOverview } from './ConnectionsOverview';
import {
  ATTENTION_ITEMS,
  ATTENTION_WITHOUT_SMS,
  HOME_LEDA_SUGGESTIONS,
  MAP_DEFAULT,
  type AttentionItem,
  type MapData,
  type Severity,
} from './home-data';

export type AttentionState = 'ready' | 'loading' | 'empty' | 'degraded';

const SEVERITY: Record<Severity, { label: string; tone: BadgeTone }> = {
  critical: { label: 'Critical', tone: 'error' },
  warning: { label: 'Warning', tone: 'warning' },
  info: { label: 'Info', tone: 'neutral' },
};

const TOP = 5;

/** Container-query row: badge | title + platform | actions; actions wrap under the text when narrow. */
const rowGrid =
  'grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 py-3 [@container(min-width:40rem)]:grid-cols-[5.5rem_minmax(0,1fr)_auto] [@container(min-width:40rem)]:items-center';

function AttentionRow({ item, onAskLeda }: { item: AttentionItem; onAskLeda: (item: AttentionItem) => void }) {
  const sev = SEVERITY[item.severity];
  return (
    <li className={rowGrid}>
      <Badge tone={sev.tone} size="sm" dot className="mt-0.5 justify-self-start [@container(min-width:40rem)]:mt-0">
        {sev.label}
      </Badge>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{item.title}</p>
        <p className="text-xs text-ink-subtle">{item.platform}</p>
      </div>
      <div className="col-start-2 flex flex-wrap items-center gap-2 [@container(min-width:40rem)]:col-start-3">
        <Button size="sm" variant="subtle" leftIcon={Sparkle} onClick={() => onAskLeda(item)} aria-label={`Ask Leda about: ${item.title}`}>
          Ask Leda
        </Button>
        <ButtonLink size="sm" variant="secondary" rightIcon={ArrowRight} href={item.href} aria-label={`Open: ${item.title}, ${item.platform}`}>
          Open
        </ButtonLink>
      </div>
    </li>
  );
}

function LoadingRows() {
  return (
    <ul aria-busy="true" aria-label="Loading items" className="divide-y divide-border border-y border-border">
      {[0, 1, 2].map((i) => (
        <li key={i} className={rowGrid}>
          <Skeleton className="h-5 w-16 rounded-full" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="h-3 w-1/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function NeedsAttention({
  state = 'ready',
  onAskLeda,
  exclude = [],
}: {
  state?: AttentionState;
  onAskLeda: (item: AttentionItem) => void;
  /** Item ids shown elsewhere on the page (RDY-217: approvals), so nothing appears twice. */
  exclude?: string[];
}) {
  const all = (state === 'degraded' ? ATTENTION_WITHOUT_SMS : state === 'ready' ? ATTENTION_ITEMS : []).filter((i) => !exclude.includes(i.id));
  const items = all.slice(0, TOP);
  return (
    <section aria-labelledby="attention-heading" className="flex flex-col gap-3 px-4 pb-8 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-baseline gap-2">
          <h2 id="attention-heading" className="text-base font-semibold text-ink">
            Needs attention
          </h2>
          {items.length > 0 && (
            <span className="text-sm text-ink-muted">
              Top {items.length} of {all.length}
            </span>
          )}
        </div>
        {all.length > TOP && (
          <Link href="/attention" className="text-sm">
            View all
          </Link>
        )}
      </header>

      {state === 'degraded' && (
        <p role="status" className="flex items-start gap-2 text-sm text-ink-muted">
          <Icon icon={Warning} size="sm" className="mt-0.5 shrink-0 text-warning-fg" />
          <span>
            <span className="font-medium text-warning-fg">Repair shop is not responding.</span> Its items may be missing from this list. Last checked 2 min ago.{' '}
            <Link href="#" className="whitespace-nowrap">
              Try again
            </Link>
          </span>
        </p>
      )}

      {state === 'loading' ? (
        <LoadingRows />
      ) : state === 'empty' ? (
        <EmptyState icon={CheckCircle} title="All clear" description="Nothing needs your attention across your platforms." className="max-w-none border-y border-border py-8" />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {items.map((it) => (
            <AttentionRow key={it.id} item={it} onAskLeda={onAskLeda} />
          ))}
        </ul>
      )}
    </section>
  );
}

export interface DashboardHomeProps extends Omit<DashboardShellProps, 'children' | 'active' | 'ledaSuggestions' | 'ledaPrefill'> {
  map?: MapData;
  attention?: AttentionState;
  onNodeSelect?: (id: string) => void;
}

/** Home page composed in the shell; owns the Ask Leda prefill. */
export function DashboardHome({ map = MAP_DEFAULT, attention = 'ready', onNodeSelect, ...shell }: DashboardHomeProps) {
  const [prefill, setPrefill] = useState<LedaPrefill | undefined>();
  const ask = (item: AttentionItem) => setPrefill({ text: `Help me with "${item.title}" on ${item.platform}.`, key: Date.now() });
  const empty = map.platforms.length === 0;
  return (
    <DashboardShell {...shell} active="home" ledaSuggestions={HOME_LEDA_SUGGESTIONS} ledaPrefill={prefill}>
      <div className={cn('flex flex-col', !empty && 'gap-2')}>
        <ConnectionsOverview data={map} onNodeSelect={onNodeSelect} onAddPlatform={shell.onAddPlatform} />
        {!empty && <NeedsAttention state={attention} onAskLeda={ask} />}
      </div>
    </DashboardShell>
  );
}
