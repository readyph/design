/**
 * PROTOTYPE (RDY-225, epic RDY-222) - Lab platform map page: standalone Portal page `/lab/platform-map`
 * outside the Portal shell. Page chrome and HTML overlays around the Town Scene (RDY-224, SVG): the scene
 * reports the hovered or focused building and the point of its label, and the page anchors the bubble there.
 *
 * Leda: none on this page (no shell, no Leda panel). Lights are local view state: no Leda action.
 */
import { useState, type ReactNode } from 'react';
import { ArrowLeft, MapTrifold, Plus, WarningOctagon } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ButtonLink } from '../../components/ButtonLink';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Tag } from '../../components/Tag';
import { StatusDot } from '../../components/StatusDot';
import { Switch } from '../../components/Switch';
import { TopBar } from '../../components/TopBar';
import { cn, focusRing } from '../../utils/cn';
import { Connections, DetailModal, PlatformMapScene } from './PlatformMapView';
import { KIND_SHORT, LAB_PLATFORMS, ROUTES, STATUS_LABEL, plural, type LabPlatform } from './data';

/**
 * Kit gaps for Leonardo (see PR body). The prototype uses the nearest existing piece for each.
 */
export const MISSING_IN_KIT = [
  'Scene colours with no token (lamp yellow, amber, peach, teal, clay greys, island, link colours, tree greens): see MISSING_IN_KIT in town/palette.ts.',
  'Bubble placed over the scene uses Anchor (percent of the scene) with a 1px trigger, because Tooltip anchors to a trigger element, not a point.',
] as const;

export type LabState = 'default' | 'loading' | 'error' | 'empty';

export interface LabPlatformMapProps {
  state?: LabState;
  /** Platform whose hover bubble is pinned open (review only; hover and focus open it normally). */
  bubbleFor?: string;
  /** Platform whose detail modal starts open. */
  modalFor?: string;
  /** Platforms whose lights start off (view-only local state, resets on reload). */
  lightsOff?: string[];
}

/* ---------- Top bar ---------- */

function LabTopBar() {
  return (
    <TopBar
      className="shrink-0 gap-2 border-b border-border bg-surface px-2 sm:gap-3 sm:px-4"
      start={
        <>
          <ButtonLink href={ROUTES.portal} variant="subtle" size="sm" leftIcon={ArrowLeft}>Portal</ButtonLink>
          <span aria-hidden className="h-5 w-px bg-border" />
          <h1 className="truncate text-sm font-semibold text-ink">Platform map</h1>
          <Tag className="shrink-0">Experiment</Tag>
        </>
      }
    />
  );
}

/* ---------- Scene frame, bubble anchor, rotate buttons ---------- */

/** `message` frames a centered state card (error, empty) and grows with it on phones. */
function SceneFrame({ children, label, message = false }: { children: ReactNode; label: string; message?: boolean }) {
  return (
    <section aria-label={label} className={cn('relative overflow-hidden rounded-lg border border-border bg-surface-subtle lg:min-h-0', message ? 'grid place-items-center px-4 py-10' : 'aspect-[4/3] lg:aspect-auto')}>
      {children}
    </section>
  );
}

/* ---------- Side list (legend) ---------- */

function LegendRow({ p, lightsOn, onLights, onSelect }: { p: LabPlatform; lightsOn: boolean; onLights: (on: boolean) => void; onSelect: () => void }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <button type="button" onClick={onSelect} className={cn('flex min-w-0 flex-1 items-center gap-2.5 rounded-base text-left', focusRing)}>
        <StatusDot status={p.status} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-ink">{p.label}</span>
          <span className="truncate text-xs text-ink-muted">{STATUS_LABEL[p.status]} · {KIND_SHORT[p.kind]}</span>
        </span>
      </button>
      {p.alerts > 0 && <Badge tone="warning" size="sm">{plural(p.alerts, 'alert')}</Badge>}
      <Switch checked={lightsOn} onCheckedChange={onLights} className="gap-0" label={<span className="sr-only">{`Lights, ${p.label}`}</span>} />
    </li>
  );
}

function SideList({ platforms, lights, setLight, onSelect, onHilite }: {
  platforms: LabPlatform[]; lights: Record<string, boolean>; setLight: (id: string, on: boolean) => void; onSelect: (p: LabPlatform) => void; onHilite: (id: string | null) => void;
}) {
  return (
    <Card padding="none" className="flex min-h-0 flex-col border border-border shadow-none lg:max-h-full lg:self-start">
      <div className="flex items-baseline justify-between gap-2 px-3 pb-1 pt-3">
        <h2 className="text-sm font-semibold text-ink">Platforms <span className="font-normal text-ink-muted">{platforms.length}</span></h2>
        <span className="text-xs text-ink-muted">Lights</span>
      </div>
      <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {platforms.map((p) => (
          <LegendRow key={p.id} p={p} lightsOn={lights[p.id]} onLights={(on) => setLight(p.id, on)} onSelect={() => onSelect(p)} />
        ))}
      </ul>
      <Connections platforms={platforms} onHilite={onHilite} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-3 py-2 text-xs text-ink-muted">
        {(['active', 'degraded', 'offline'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5"><StatusDot status={s} size="sm" />{STATUS_LABEL[s]}</span>
        ))}
        <span>Lights off: dark windows</span>
      </div>
    </Card>
  );
}

function SideListSkeleton() {
  return (
    <Card padding="none" className="border border-border shadow-none lg:self-start" aria-hidden>
      <div className="px-3 pb-1 pt-3"><Skeleton variant="text" width="6rem" /></div>
      <div className="flex flex-col gap-3 p-3">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} height={36} />)}
      </div>
    </Card>
  );
}

/* ---------- Page ---------- */

export function LabPlatformMap({ state = 'default', bubbleFor, modalFor, lightsOff = [] }: LabPlatformMapProps) {
  const platforms = LAB_PLATFORMS;
  const [lights, setLights] = useState<Record<string, boolean>>(() => Object.fromEntries(platforms.map((p) => [p.id, !lightsOff.includes(p.id)])));
  const [hilite, setHilite] = useState<string | null>(null);
  const [selected, setSelected] = useState<LabPlatform | null>(platforms.find((p) => p.id === modalFor) ?? null);
  const setLight = (id: string, on: boolean) => setLights((cur) => ({ ...cur, [id]: on }));
  const select = (p: LabPlatform) => setSelected(p);
  const withList = state === 'default' || state === 'loading';

  return (
    <div className="ds-root flex min-h-screen flex-col bg-canvas font-sans text-ink lg:h-screen">
      <LabTopBar />
      <main className={cn('grid min-h-0 flex-1 grid-cols-1 content-start gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-rows-[minmax(0,1fr)] lg:content-stretch', withList && 'lg:grid-cols-[minmax(0,1fr)_20rem]')}>
        {state === 'loading' && (
          <>
            <SceneFrame label="Platform map, loading">
              <Skeleton variant="rect" className="absolute inset-0 h-full w-full rounded-none opacity-60" />
              <span className="sr-only">Loading the map</span>
            </SceneFrame>
            <SideListSkeleton />
          </>
        )}

        {state === 'error' && (
          <SceneFrame label="Platform map" message>
            <div className="contents">
              <Card className="w-full max-w-sm border border-border">
                <EmptyState icon={WarningOctagon} title="Couldn't load the map" description="Check your connection and try again."
                  action={<Button variant="secondary" size="sm">Retry</Button>} />
              </Card>
            </div>
          </SceneFrame>
        )}

        {state === 'empty' && (
          <SceneFrame label="Platform map" message>
            <div className="contents">
              <Card className="w-full max-w-sm border border-border">
                <EmptyState icon={MapTrifold} title="No platforms yet" description="Add Inventory or a Service Management branch and it appears here as a building."
                  action={<ButtonLink href={ROUTES.add} size="sm" leftIcon={Plus}>Add a platform</ButtonLink>} />
              </Card>
            </div>
          </SceneFrame>
        )}

        {state === 'default' && (
          <>
            <SceneFrame label="Platform map">
              <PlatformMapScene platforms={platforms} lights={lights} bubbleFor={bubbleFor} hilite={hilite} onSelect={select} />
            </SceneFrame>
            <SideList platforms={platforms} lights={lights} setLight={setLight} onSelect={select} onHilite={setHilite} />
          </>
        )}
      </main>

      <DetailModal routes={ROUTES} p={selected} lightsOn={selected ? lights[selected.id] : true}
        onLights={(on) => selected && setLight(selected.id, on)}
        onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
