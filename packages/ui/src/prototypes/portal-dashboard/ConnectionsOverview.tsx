/**
 * Platform connections section: heading, plain summary line (no stat tiles, no cards) and the
 * shared ConnectionsMap. RDY-213 shell default content; RDY-214 Home leads with it.
 *
 * RDY-214 contrast fix: the "needs a source" count uses `text-warning-fg` (#92400e light, 6.3:1 on
 * the canvas) instead of `text-warning` (2.69:1).
 */
import { ShareNetwork, Plus } from '@phosphor-icons/react';
import { Button, EmptyState } from '../../index';
import { ConnectionsMap } from './ConnectionsMap';
import { MAP_DEFAULT, type MapData } from './home-data';

export interface ConnectionsOverviewProps {
  data?: MapData;
  onNodeSelect?: (id: string) => void;
  onAddPlatform?: () => void;
}

export function ConnectionsSummary({ data }: { data: MapData }) {
  const needs = data.platforms.filter((p) => p.needsSource).length;
  return (
    <p className="text-sm text-ink-muted">
      {data.platforms.length} {data.platforms.length === 1 ? 'platform' : 'platforms'} · {data.links.length}{' '}
      {data.links.length === 1 ? 'data link' : 'data links'}
      {needs > 0 && (
        <>
          {' · '}
          <span className="font-medium text-warning-fg">{needs} needs a source</span>
        </>
      )}
    </p>
  );
}

export function NoPlatforms({ onAddPlatform }: { onAddPlatform?: () => void }) {
  return (
    <EmptyState
      icon={ShareNetwork}
      title="No platforms connected yet"
      description="Add Inventory, a storefront or a repair shop. Connected platforms and the data they share show up here."
      action={
        <Button leftIcon={Plus} onClick={onAddPlatform}>
          Add platform
        </Button>
      }
    />
  );
}

/** Default Portal content inside the shell: the platform connections map. */
export function ConnectionsOverview({ data = MAP_DEFAULT, onNodeSelect, onAddPlatform }: ConnectionsOverviewProps) {
  if (data.platforms.length === 0) {
    return (
      <section aria-label="Platform connections" className="px-4 py-5 sm:px-6">
        <NoPlatforms onAddPlatform={onAddPlatform} />
      </section>
    );
  }
  return (
    <section aria-labelledby="connections-heading" className="flex flex-col gap-6 px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="connections-heading" className="text-base font-semibold text-ink">
            Platform connections
          </h2>
          <ConnectionsSummary data={data} />
        </div>
        <Button size="sm" variant="secondary">
          Manage connections
        </Button>
      </header>
      <ConnectionsMap {...data} onNodeSelect={onNodeSelect} />
    </section>
  );
}
