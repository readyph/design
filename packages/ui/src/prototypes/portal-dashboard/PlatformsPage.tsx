/**
 * RDY-214: the Platforms page in the shell, using the SAME shared ConnectionsMap as Home.
 * Existing layout kept: summary line, Platforms / Connections switch and Add platform on one row,
 * then the view. Flat per owner direction (the "Platforms" view is a divided list, not cards).
 */
import { useState } from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button, SegmentedControl } from '../../index';
import { DashboardShell, type DashboardShellProps } from './DashboardShell';
import { ConnectionsMap, PlatformList } from './ConnectionsMap';
import { ConnectionsSummary, NoPlatforms } from './ConnectionsOverview';
import { MAP_DEFAULT, type MapData } from './home-data';

export interface PlatformsPageProps extends Omit<DashboardShellProps, 'children' | 'active'> {
  map?: MapData;
  view?: 'platforms' | 'connections';
  onNodeSelect?: (id: string) => void;
}

export function PlatformsPage({ map = MAP_DEFAULT, view: initialView = 'connections', onNodeSelect, ...shell }: PlatformsPageProps) {
  const [view, setView] = useState(initialView);
  return (
    <DashboardShell {...shell} active="platforms">
      <div className="flex flex-col gap-6 px-4 py-5 sm:px-6">
        {map.platforms.length === 0 ? (
          <NoPlatforms onAddPlatform={shell.onAddPlatform} />
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-3">
              <ConnectionsSummary data={map} />
              <div className="flex flex-wrap items-center gap-2">
                <SegmentedControl
                  aria-label="View"
                  value={view}
                  onChange={(v) => setView(v as typeof view)}
                  options={[
                    { value: 'platforms', label: 'Platforms' },
                    { value: 'connections', label: 'Connections' },
                  ]}
                />
                <Button size="sm" leftIcon={Plus} onClick={shell.onAddPlatform}>
                  Add platform
                </Button>
              </div>
            </header>
            {view === 'connections' ? (
              <ConnectionsMap {...map} onNodeSelect={onNodeSelect} />
            ) : (
              <PlatformList {...map} onNodeSelect={onNodeSelect} />
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
