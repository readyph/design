/**
 * RDY-213 follow-up (RDY-224 scene): default shell content = the Town Scene instead of the connections
 * diagram. Same data as the diagram (data.ts MAP_*), mapped to the Lab platform model so the scene, hover
 * bubble, detail modal (Open / Manage connections) and connection legend are the shared pieces from
 * prototypes/lab-platform-map. The scene sits directly on the content background; the legend is a Card that also highlights a
 * connection on hover or focus; consumers without a source keep their Connect action.
 */
import { useMemo, useState } from 'react';
import { Warning } from '@phosphor-icons/react';
import { Button, ButtonLink, Card, Icon } from '../../index';
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

  return (
    <section aria-labelledby="connections-heading" className="flex flex-col gap-4 px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 id="connections-heading" className="text-base font-semibold text-ink">Platform connections</h1>
          <p className="text-sm text-ink-muted">
            {platforms.length} platforms · {MAP_LINKS.length} data links · <span className="text-warning">{unlinked.length} needs a source</span>
          </p>
        </div>
        <ButtonLink href={ROUTES.connect('')} size="sm" variant="secondary">Manage connections</ButtonLink>
      </header>
      <div className="grid gap-4 [@container(min-width:56rem)]:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="relative h-[clamp(14rem,min(56vh,40vw+4rem),38rem)] min-w-0">
          <PlatformMapScene platforms={platforms} lights={lights} bubbleFor={bubbleFor} hilite={hilite} onSelect={setSelected} bare />
        </div>
        <Card className="flex flex-col gap-3 self-start border border-border shadow-none">
          <Connections platforms={platforms} onHilite={setHilite} flush />
          {unlinked.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-sm">
              <Icon icon={Warning} size="sm" className="text-warning" />
              <span className="font-medium text-ink">{c.label}</span>
              <span className="text-ink-muted">has no stock source</span>
              <Button size="sm" variant="subtle" className="ml-auto">Connect</Button>
            </div>
          ))}
        </Card>
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
