/**
 * PROTOTYPE (RDY-225, epic RDY-222) - Lab platform map page: standalone Portal page `/lab/platform-map`
 * outside the Portal shell. Page chrome and HTML overlays around the Town Scene (RDY-224, SVG): the scene
 * reports the hovered or focused building and the point of its label, and the page anchors the bubble there.
 *
 * Leda: none on this page (no shell, no Leda panel). Lights are local view state: no Leda action.
 */
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowClockwise, ArrowCounterClockwise, ArrowLeft, ArrowSquareOut, LinkSimple, MapTrifold, Plus, WarningOctagon } from '@phosphor-icons/react';
import { Anchor } from '../../components/Anchor';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ButtonLink } from '../../components/ButtonLink';
import { Card } from '../../components/Card';
import { DataList } from '../../components/DataList';
import { Divider } from '../../components/Divider';
import { EmptyState } from '../../components/EmptyState';
import { Modal } from '../../components/Modal';
import { Skeleton } from '../../components/Skeleton';
import { StatusDot } from '../../components/StatusDot';
import { Switch } from '../../components/Switch';
import { Tag } from '../../components/Tag';
import { Tooltip } from '../../components/Tooltip';
import { TopBar } from '../../components/TopBar';
import { cn, focusRing } from '../../utils/cn';
import { TownScene, connectionsFor, type TownBuilding, type TownStatus } from './TownScene';
import { KIND_LABEL, KIND_SHORT, LAB_PLATFORMS, ROUTES, STATUS_LABEL, STATUS_TONE, plural, type LabPlatform } from './data';

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

/* ---------- Hover bubble ---------- */

function BubbleContent({ p, lightsOn }: { p: LabPlatform; lightsOn: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-sm font-semibold text-ink">{p.label}</p>
        <p className="text-xs text-ink-muted">{KIND_LABEL[p.kind]}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink">
        <span className="inline-flex items-center gap-1.5"><StatusDot status={p.status} size="sm" />{STATUS_LABEL[p.status]}</span>
        <span className={cn(p.alerts > 0 ? 'font-medium text-warning-fg' : 'text-ink-muted')}>{plural(p.alerts, 'alert')}</span>
        <span className="text-ink-muted">Lights {lightsOn ? 'on' : 'off'}</span>
        <span className="text-ink-muted">{plural(p.links.length, 'link')}</span>
      </div>
      <p className="border-t border-border pt-2 text-xs text-ink-subtle">Select for details</p>
    </div>
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

const STATUS_UP: Record<LabPlatform['status'], TownStatus> = { active: 'ACTIVE', degraded: 'DEGRADED', offline: 'OFFLINE' };
const toBuilding = (p: LabPlatform): TownBuilding => ({ id: p.id, label: p.label, kind: p.kind, status: STATUS_UP[p.status], alerts: p.alerts });
const toLinks = (platforms: LabPlatform[]) => platforms.flatMap((p) => p.links.map((l) => ({ from: p.id, to: l.id })));

/** Size of an element in px, kept up to date (used to turn the scene's pixel point into a percent anchor). */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function RotateButtons({ onTurn }: { onTurn: (quarterTurns: number) => void }) {
  return (
    <div className="absolute bottom-3 left-3 flex gap-2">
      <Button variant="secondary" size="sm" leftIcon={ArrowCounterClockwise} onClick={() => onTurn(-1)} aria-label="Rotate map left" />
      <Button variant="secondary" size="sm" leftIcon={ArrowClockwise} onClick={() => onTurn(1)} aria-label="Rotate map right" />
    </div>
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

function Connections({ platforms, onHilite }: { platforms: LabPlatform[]; onHilite: (id: string | null) => void }) {
  const conns = useMemo(() => connectionsFor(toLinks(platforms), new Set(platforms.map((p) => p.id))), [platforms]);
  const name = (id: string) => platforms.find((p) => p.id === id)?.label ?? id;
  if (conns.length === 0) return null;
  return (
    <div className="border-t border-border px-3 py-2">
      <h3 className="pb-1 text-xs font-semibold text-ink-muted">Connections</h3>
      <ul className="flex flex-col">
        {conns.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onMouseEnter={() => onHilite(c.id)}
              onMouseLeave={() => onHilite(null)}
              onFocus={() => onHilite(c.id)}
              onBlur={() => onHilite(null)}
              className={cn('flex w-full items-center gap-2 rounded-base px-1 py-1 text-left text-xs text-ink hover:bg-surface-subtle', focusRing)}
            >
              <svg aria-hidden className="h-1.5 w-4 shrink-0" viewBox="0 0 16 6"><rect width="16" height="6" rx="3" fill={c.color} /></svg>
              <span className="truncate">{name(c.from)} <span className="text-ink-muted">{'\u2194'}</span> {name(c.to)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
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

/* ---------- Detail modal ---------- */

function DetailModal({ p, lightsOn, onLights, onOpenChange }: {
  p: LabPlatform | null; lightsOn: boolean; onLights: (on: boolean) => void; onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      open={p !== null}
      onOpenChange={onOpenChange}
      title={p?.label}
      description={p ? KIND_LABEL[p.kind] : undefined}
      footer={p && (
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
          <ButtonLink href={ROUTES.connect(p.id)} variant="secondary" leftIcon={LinkSimple} className="w-full sm:w-auto">Manage connections</ButtonLink>
          <ButtonLink href={ROUTES.open(p.id)} rightIcon={ArrowSquareOut} className="w-full sm:w-auto">Open platform</ButtonLink>
        </div>
      )}
    >
      {p && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[p.status]} dot>{STATUS_LABEL[p.status]}</Badge>
            <Badge tone={p.alerts > 0 ? 'warning' : 'neutral'}>{plural(p.alerts, 'alert')}</Badge>
          </div>
          <DataList items={[
            { label: 'Version', value: p.version },
            { label: 'Last sync', value: p.lastSync },
            { label: 'Connected', value: p.connectedAt },
          ]} />
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-ink-muted">Linked platforms</h3>
            {p.links.length === 0 ? (
              <p className="text-sm text-ink-muted">Not linked to another platform yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {p.links.map((l) => (
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-ink">{l.label}</span>
                    <span className="flex flex-wrap gap-1">{l.capabilities.map((c) => <Tag key={c}>{c}</Tag>)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Divider />
          <Switch checked={lightsOn} onCheckedChange={onLights} label="Lights" description="View only. Resets when you reload the page." />
        </div>
      )}
    </Modal>
  );
}

/* ---------- Page ---------- */

export function LabPlatformMap({ state = 'default', bubbleFor, modalFor, lightsOff = [] }: LabPlatformMapProps) {
  const platforms = LAB_PLATFORMS;
  const [lights, setLights] = useState<Record<string, boolean>>(() => Object.fromEntries(platforms.map((p) => [p.id, !lightsOff.includes(p.id)])));
  const [bubble, setBubble] = useState<{ id: string; x: number; y: number } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [hilite, setHilite] = useState<string | null>(null);
  const [sceneRef, sceneSize] = useSize<HTMLDivElement>();
  const buildings = useMemo(() => platforms.map(toBuilding), [platforms]);
  const links = useMemo(() => toLinks(platforms), [platforms]);
  const turn = (q: number) => setRotation((r) => Math.round(r / (Math.PI / 2) + q) * (Math.PI / 2));
  const [selected, setSelected] = useState<LabPlatform | null>(platforms.find((p) => p.id === modalFor) ?? null);
  const setLight = (id: string, on: boolean) => setLights((cur) => ({ ...cur, [id]: on }));
  const select = (p: LabPlatform) => { setBubble(null); setSelected(p); };
  const bubblePlatform = bubble ? platforms.find((p) => p.id === bubble.id) : undefined;
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
              <div ref={sceneRef} className="absolute inset-0">
                <TownScene
                  buildings={buildings}
                  links={links}
                  lights={lights}
                  rotation={rotation}
                  onRotationChange={setRotation}
                  highlightLink={hilite}
                  pinnedId={bubbleFor}
                  onHover={(id, pt) => setBubble(id && pt ? { id, x: pt.x, y: pt.y } : null)}
                  onSelect={(id) => { const p = platforms.find((q) => q.id === id); if (p) select(p); }}
                />
                {bubblePlatform && bubble && sceneSize.w > 0 && (
                  <Anchor x={(bubble.x / sceneSize.w) * 100} y={(bubble.y / sceneSize.h) * 100} className="pointer-events-none">
                    <Tooltip open side="top" tone="surface" content={<BubbleContent p={bubblePlatform} lightsOn={lights[bubblePlatform.id]} />} className="w-60 max-w-[calc(100vw-2rem)]">
                      <span className="block size-px" />
                    </Tooltip>
                  </Anchor>
                )}
              </div>
              <RotateButtons onTurn={turn} />
            </SceneFrame>
            <SideList platforms={platforms} lights={lights} setLight={setLight} onSelect={select} onHilite={setHilite} />
          </>
        )}
      </main>

      <DetailModal p={selected} lightsOn={selected ? lights[selected.id] : true}
        onLights={(on) => selected && setLight(selected.id, on)}
        onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
