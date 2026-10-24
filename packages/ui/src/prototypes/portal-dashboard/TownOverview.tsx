/**
 * RDY-213 follow-up (RDY-224 scene): default shell content = the Town Scene instead of the connections
 * diagram. Same data as the diagram (data.ts MAP_*), mapped to the Lab platform model so the scene, hover
 * bubble, detail modal (Open / Manage connections) and connection legend are the shared pieces from
 * prototypes/lab-platform-map. The text list below the scene is the legend, which also highlights a
 * connection on hover or focus; consumers without a source keep their Connect action.
 */
import { useMemo, useState } from 'react';
import { Warning } from '@phosphor-icons/react';
import { Button, ButtonLink, Icon, Switch, cn } from '../../index';
import { Connections, DetailModal, PlatformMapScene } from '../lab-platform-map/PlatformMapView';
import { ROUTES, type LabKind, type LabPlatform } from '../lab-platform-map/data';
import { MAP_CONSUMERS, MAP_LINKS, MAP_PROVIDERS, type MapInstance } from './data';

const KIND: Record<MapInstance['kind'], LabKind> = { Inventory: 'inventory', Storefront: 'store' };
const unlinked = MAP_CONSUMERS.filter((c) => !MAP_LINKS.some((l) => l.consumerId === c.id));
const ALL = [...MAP_CONSUMERS, ...MAP_PROVIDERS];

/** Dashboard instances as Lab platforms: provider/consumer links both ways, "needs a source" as one alert. */
export function dashboardPlatforms(): LabPlatform[] {
  const name = (id: string) => ALL.find((i) => i.id === id)!.label;
  return ALL.map((i) => ({
    id: i.id,
    label: i.label,
    kind: KIND[i.kind],
    status: i.status as LabPlatform['status'],
    alerts: unlinked.includes(i) ? 1 : 0,
    links: MAP_LINKS.filter((l) => l.consumerId === i.id || l.providerId === i.id).map((l) => {
      const other = l.consumerId === i.id ? l.providerId : l.consumerId;
      return { id: other, label: name(other), capabilities: [l.capability] };
    }),
  }));
}

export interface TownOverviewProps {
  /** Platform whose hover bubble is pinned open (review only). */
  bubbleFor?: string;
  /** Platform whose detail modal starts open. */
  modalFor?: string;
}

/** Default Portal content inside the shell: the platform connections as the town scene. */
export function TownOverview({ bubbleFor, modalFor }: TownOverviewProps) {
  const platforms = useMemo(dashboardPlatforms, []);
  const [lights, setLights] = useState<Record<string, boolean>>(() => Object.fromEntries(platforms.map((p) => [p.id, p.status !== 'offline'])));
  const [selected, setSelected] = useState<LabPlatform | null>(platforms.find((p) => p.id === modalFor) ?? null);
  const [hilite, setHilite] = useState<string | null>(null);
  const allOn = platforms.every((p) => lights[p.id]);

  return (
    <section aria-labelledby="connections-heading" className="flex flex-col gap-4 px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 id="connections-heading" className="text-base font-semibold text-ink">Platform connections</h1>
          <p className="text-sm text-ink-muted">
            {platforms.length} platforms · {MAP_LINKS.length} data links · <span className="text-warning">{unlinked.length} needs a source</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Switch checked={allOn} onCheckedChange={(on) => setLights(Object.fromEntries(platforms.map((p) => [p.id, on])))} label="All lights" />
          <ButtonLink href={ROUTES.connect('')} size="sm" variant="secondary">Manage connections</ButtonLink>
        </div>
      </header>
      <div className={cn('relative h-[clamp(18rem,56vh,38rem)] overflow-hidden rounded-lg border border-border bg-surface-subtle')}>
        <PlatformMapScene platforms={platforms} lights={lights} bubbleFor={bubbleFor} hilite={hilite} onSelect={setSelected} />
      </div>
      <div className="flex flex-col">
        <Connections platforms={platforms} onHilite={setHilite} />
        {unlinked.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-border px-3 py-2.5 text-sm">
            <Icon icon={Warning} size="sm" className="text-warning" />
            <span className="font-medium text-ink">{c.label}</span>
            <span className="text-ink-muted">has no stock source</span>
            <Button size="sm" variant="subtle" className="ml-auto">Connect</Button>
          </div>
        ))}
      </div>
      <DetailModal
        routes={ROUTES}
        p={selected}
        lightsOn={selected ? lights[selected.id] : true}
        onLights={(on) => selected && setLights((cur) => ({ ...cur, [selected.id]: on }))}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </section>
  );
}
