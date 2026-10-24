/**
 * PROTOTYPE (RDY-225, epic RDY-222) - Lab platform map page: standalone Portal page `/lab/platform-map`
 * outside the Portal shell. Page chrome and HTML overlays around the Town Scene canvas (RDY-224);
 * the scene here is a neutral placeholder with fixed anchor points.
 *
 * Leda: none on this page (no shell, no Leda panel). Lights are local view state: no Leda action.
 */
import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowSquareOut, LinkSimple, MapTrifold, Package, Plus, WarningOctagon, Wrench } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ButtonLink } from '../../components/ButtonLink';
import { Card } from '../../components/Card';
import { DataList } from '../../components/DataList';
import { Divider } from '../../components/Divider';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { Skeleton } from '../../components/Skeleton';
import { StatusDot } from '../../components/StatusDot';
import { Switch } from '../../components/Switch';
import { Tag } from '../../components/Tag';
import { Tooltip } from '../../components/Tooltip';
import { TopBar } from '../../components/TopBar';
import { cn, focusRing } from '../../utils/cn';
import { KIND_LABEL, KIND_SHORT, LAB_PLATFORMS, ROUTES, STATUS_LABEL, STATUS_TONE, plural, type LabPlatform } from './data';

/**
 * Kit gaps for Leonardo (see PR body). The prototype uses the nearest existing piece for each.
 */
export const MISSING_IN_KIT = [
  'Tooltip surface tone (rich bubble: bg-surface, border, arrow in surface colour). Prototype overrides Tooltip className.',
  'Switch aria-label / labelledby prop for label-less switches in lists. Prototype passes an sr-only label.',
  'Scene anchor overlay: a positioned layer that places focusable hit targets at projected (x, y) points without inline styles (CSS variables set by the scene). Prototype uses fixed Tailwind position classes.',
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

const KIND_ICON = { inventory: Package, sms: Wrench } as const;

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

/* ---------- Scene (placeholder) with accessible hit targets ---------- */

const PLOT = 'bg-surface-subtle bg-[radial-gradient(rgb(var(--ds-border-strong))_1px,transparent_1px)] bg-[length:1.5rem_1.5rem]';

/** `message` frames a centered state card (error, empty) and grows with it on phones. */
function SceneFrame({ children, label, message = false }: { children: ReactNode; label: string; message?: boolean }) {
  return (
    <section aria-label={label} className={cn('relative overflow-hidden rounded-lg border border-border lg:min-h-0', message ? 'grid place-items-center px-4 py-10' : 'aspect-[4/3] lg:aspect-auto', PLOT)}>
      {children}
    </section>
  );
}

function Building({ p, lightsOn, bubbleOpen, onBubble, onSelect }: {
  p: LabPlatform; lightsOn: boolean; bubbleOpen: boolean; onBubble: (open: boolean) => void; onSelect: () => void;
}) {
  return (
    <div className={cn('absolute -translate-x-1/2 -translate-y-1/2', p.anchor)}>
      {/* Placeholder for the RDY-224 building art (decorative; the canvas is aria-hidden in the real page). */}
      <div aria-hidden className={cn(
        'relative grid h-12 w-12 place-items-center rounded-lg border shadow-sm transition-colors duration-DEFAULT sm:h-16 sm:w-16',
        lightsOn ? 'border-border-strong bg-surface text-ink' : 'border-border bg-surface-muted text-ink-subtle',
      )}>
        <Icon icon={KIND_ICON[p.kind]} size="md" />
        <StatusDot status={p.status} size="sm" className="absolute -right-1 -top-1 ring-2 ring-surface" />
      </div>
      {/* Accessible fallback: visually hidden but focusable button over the building. */}
      <Tooltip
        open={bubbleOpen}
        onOpenChange={onBubble}
        side="top"
        delayDuration={150}
        content={<BubbleContent p={p} lightsOn={lightsOn} />}
        className="w-60 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-surface p-3 text-ink shadow-lg [&>span>svg]:fill-surface"
      >
        <button type="button" onClick={onSelect} className={cn('absolute -inset-1 rounded-lg', focusRing)}>
          <span className="sr-only">{`${p.label}, ${KIND_LABEL[p.kind]}, ${STATUS_LABEL[p.status]}, ${plural(p.alerts, 'alert')}`}</span>
        </button>
      </Tooltip>
    </div>
  );
}

function PlaceholderCaption() {
  return (
    <p className="absolute bottom-2 left-3 text-xs text-ink-subtle">Town scene placeholder (RDY-224)</p>
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

function SideList({ platforms, lights, setLight, onSelect }: {
  platforms: LabPlatform[]; lights: Record<string, boolean>; setLight: (id: string, on: boolean) => void; onSelect: (p: LabPlatform) => void;
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
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border px-3 py-2 text-xs text-ink-muted">
        {(['active', 'degraded', 'offline'] as const).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5"><StatusDot status={s} size="sm" />{STATUS_LABEL[s]}</span>
        ))}
        <span>Dimmed: lights off</span>
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
  const [bubble, setBubble] = useState<string | null>(bubbleFor ?? null);
  const [selected, setSelected] = useState<LabPlatform | null>(platforms.find((p) => p.id === modalFor) ?? null);
  const setLight = (id: string, on: boolean) => setLights((cur) => ({ ...cur, [id]: on }));
  const select = (p: LabPlatform) => { setBubble(null); setSelected(p); };
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
              {platforms.map((p) => (
                <Building key={p.id} p={p} lightsOn={lights[p.id]} bubbleOpen={bubble === p.id}
                  onBubble={(open) => setBubble((cur) => (open ? p.id : cur === p.id ? null : cur))}
                  onSelect={() => select(p)} />
              ))}
              <PlaceholderCaption />
            </SceneFrame>
            <SideList platforms={platforms} lights={lights} setLight={setLight} onSelect={select} />
          </>
        )}
      </main>

      <DetailModal p={selected} lightsOn={selected ? lights[selected.id] : true}
        onLights={(on) => selected && setLight(selected.id, on)}
        onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
