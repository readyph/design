/**
 * PROTOTYPE (RDY-224 / RDY-225) - shared pieces of the platform map views: the Town Scene with its anchored
 * status bubble and rotate buttons, the connection legend and the platform detail modal. Used by the Lab
 * Platform Map page and by the Portal dashboard (RDY-213) so both show the same scene and actions.
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowClockwise, ArrowCounterClockwise, ArrowSquareOut, LinkSimple } from '@phosphor-icons/react';
import { Anchor } from '../../components/Anchor';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ButtonLink } from '../../components/ButtonLink';
import { DataList } from '../../components/DataList';
import { Divider } from '../../components/Divider';
import { Modal } from '../../components/Modal';
import { StatusDot } from '../../components/StatusDot';
import { Switch } from '../../components/Switch';
import { Tag } from '../../components/Tag';
import { Tooltip } from '../../components/Tooltip';
import { cn, focusRing } from '../../utils/cn';
import { TownScene, connectionsFor, type TownBuilding, type TownStatus } from './TownScene';
import { KIND_LABEL, STATUS_LABEL, STATUS_TONE, plural, type LabPlatform } from './data';

/* ---------- Hover bubble ---------- */

export function BubbleContent({ p, lightsOn }: { p: LabPlatform; lightsOn: boolean }) {
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


const STATUS_UP: Record<LabPlatform['status'], TownStatus> = { active: 'ACTIVE', degraded: 'DEGRADED', offline: 'OFFLINE' };
export const toBuilding = (p: LabPlatform): TownBuilding => ({ id: p.id, label: p.label, kind: p.kind, status: STATUS_UP[p.status], alerts: p.alerts });
export const toLinks = (platforms: LabPlatform[]) => platforms.flatMap((p) => p.links.map((l) => ({ from: p.id, to: l.id })));

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


export function Connections({ platforms, onHilite, flush = false }: { platforms: LabPlatform[]; onHilite: (id: string | null) => void; flush?: boolean }) {
  const conns = useMemo(() => connectionsFor(toLinks(platforms), new Set(platforms.map((p) => p.id))), [platforms]);
  const name = (id: string) => platforms.find((p) => p.id === id)?.label ?? id;
  if (conns.length === 0) return null;
  return (
    <div className={cn(!flush && 'border-t border-border px-3 py-2')}>
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


/* ---------- Detail modal ---------- */

export function DetailModal({ p, lightsOn, onLights, onOpenChange, routes }: {
  routes: MapRoutes;
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
          <ButtonLink href={routes.connect(p.id)} variant="secondary" leftIcon={LinkSimple} className="w-full sm:w-auto">Manage connections</ButtonLink>
          <ButtonLink href={routes.open(p.id)} rightIcon={ArrowSquareOut} className="w-full sm:w-auto">Open platform</ButtonLink>
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
            { label: 'Type', value: KIND_LABEL[p.kind] },
            ...(p.version ? [{ label: 'Version', value: p.version }] : []),
            ...(p.lastSync ? [{ label: 'Last sync', value: p.lastSync }] : []),
            ...(p.connectedAt ? [{ label: 'Connected', value: p.connectedAt }] : []),
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


/** Routes the scene's actions lead to (detail modal buttons). */
export interface MapRoutes {
  open: (id: string) => string;
  connect: (id: string) => string;
}

/**
 * The scene filling its (relative) parent, with the hover or focus bubble anchored at the label point and
 * the rotate buttons. `onSelect` fires on click, tap, Enter or Space.
 */
export function PlatformMapScene({ platforms, lights, bubbleFor, hilite = null, onSelect, bare = false }: {
  bare?: boolean;
  platforms: LabPlatform[];
  lights: Record<string, boolean>;
  bubbleFor?: string;
  hilite?: string | null;
  onSelect: (p: LabPlatform) => void;
}) {
  const [bubble, setBubble] = useState<{ id: string; x: number; y: number } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [sceneRef, size] = useSize<HTMLDivElement>();
  const buildings = useMemo(() => platforms.map(toBuilding), [platforms]);
  const links = useMemo(() => toLinks(platforms), [platforms]);
  const turn = (q: number) => setRotation((r) => Math.round(r / (Math.PI / 2) + q) * (Math.PI / 2));
  const bubblePlatform = bubble ? platforms.find((p) => p.id === bubble.id) : undefined;
  return (
    <>
      <div ref={sceneRef} className="absolute inset-0">
        <TownScene
          buildings={buildings}
          links={links}
          lights={lights}
          rotation={rotation}
          onRotationChange={setRotation}
          highlightLink={hilite}
          pinnedId={bubbleFor}
          bare={bare}
          onHover={(id, pt) => setBubble(id && pt ? { id, x: pt.x, y: pt.y } : null)}
          onSelect={(id) => { const p = platforms.find((q) => q.id === id); if (p) { setBubble(null); onSelect(p); } }}
        />
        {bubblePlatform && bubble && size.w > 0 && (
          <Anchor x={(bubble.x / size.w) * 100} y={(bubble.y / size.h) * 100} className="pointer-events-none">
            <Tooltip open side="top" tone="surface" content={<BubbleContent p={bubblePlatform} lightsOn={lights[bubblePlatform.id]} />} className="w-60 max-w-[calc(100vw-2rem)]">
              <span className="block size-px" />
            </Tooltip>
          </Anchor>
        )}
      </div>
      <RotateButtons onTurn={turn} />
    </>
  );
}
