/**
 * RDY-214: the ONE shared platform connections map, used by Home and the Platforms page
 * (and by the shell's default ConnectionsOverview from RDY-213).
 *
 * Flat (owner direction): no wrapping card, no node boxes. Bare icon tiles + labels on the canvas,
 * consumers (read data) left, providers (share data) right, a curve per data link.
 *
 * Layout without inline styles or per-id position classes: three grid columns. Each node column is
 * a grid of equal `1fr` rows stretched to the taller column, so node i of n sits at (i + 0.5) / n of
 * the height. The middle column is an SVG with a 0..100 viewBox stretched to the same box
 * (preserveAspectRatio none, non-scaling strokes), so curves meet the icon tiles at any width.
 *
 * Below a 36rem content width (container query) the diagram becomes a divided list of the same
 * platforms with their links written out; that list is also the text equivalent.
 */
import { useState } from 'react';
import { LockSimple } from '@phosphor-icons/react';
import { Badge, Icon, StatusDot, cn, focusRing, type BadgeTone, type StatusTone } from '../../index';
import type { MapData, MapEdge, MapPlatform, Severity } from './home-data';

/** Kit gaps for Leonardo (also in the PR body). */
export const MAP_MISSING_IN_KIT = [
  'ConnectionsMap in @readyph/ui: props `platforms`, `links`, `onNodeSelect(id)`; flat diagram (equal-row node columns + stretched SVG link column, no Card, no node boxes) and the stacked list below 36rem. Replaces the private map in patterns/portal/Platforms.',
  'MapNode: icon tile with StatusDot corner, name, attention Badge (tone from highest severity), relation sub-line; `restricted` variant = name + status only, not interactive.',
  'Severity to Badge tone mapping (critical = error, warning = warning, info = neutral) as a shared helper.',
];

const SEVERITY_TONE: Record<Severity, BadgeTone> = { critical: 'error', warning: 'warning', info: 'neutral' };
const STATUS_WORD: Record<StatusTone, string> = { active: 'Active', degraded: 'Degraded', offline: 'Offline', neutral: 'Unknown' };

export interface ConnectionsMapProps extends MapData {
  /** Click, Enter or Space on a node: opens the platform detail modal (RDY-215). */
  onNodeSelect?: (id: string) => void;
  className?: string;
}

function relation(p: MapPlatform, links: MapEdge[], byId: (id: string) => MapPlatform | undefined) {
  if (p.side === 'provider') {
    const n = new Set(links.filter((l) => l.providerId === p.id).map((l) => l.consumerId)).size;
    return n > 0 ? `Shares with ${n}` : 'No platforms read from it';
  }
  if (p.needsSource) return 'Needs a stock source';
  const reads = links.filter((l) => l.consumerId === p.id);
  if (reads.length === 0) return 'Not connected';
  return reads.map((l) => `${l.capability.toLowerCase()} from ${byId(l.providerId)?.label ?? 'unknown'}`).join(', ');
}

function shortRelation(p: MapPlatform, links: MapEdge[]) {
  if (p.side === 'provider') {
    const n = new Set(links.filter((l) => l.providerId === p.id).map((l) => l.consumerId)).size;
    return n > 0 ? `Shares with ${n}` : 'No consumers';
  }
  if (p.needsSource) return 'Needs a source';
  return links.some((l) => l.consumerId === p.id) ? 'Connected' : 'Not connected';
}

function Tile({ p, hot }: { p: MapPlatform; hot?: boolean }) {
  return (
    <span
      className={cn(
        'relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink transition-colors',
        hot && 'bg-primary-50 text-primary-700',
      )}
    >
      <Icon icon={p.icon} size="md" />
      <span className="absolute -bottom-0.5 -right-0.5">
        <StatusDot status={p.status} size="sm" pulse={false} />
      </span>
    </span>
  );
}

function AttentionBadge({ p }: { p: MapPlatform }) {
  if (p.restricted || !p.attention) return null;
  return (
    <Badge tone={SEVERITY_TONE[p.severity ?? 'info']} size="sm" className="shrink-0">
      {p.attention}
      <span className="sr-only"> need attention</span>
    </Badge>
  );
}

/** Sub-line: warning tone uses `text-warning-fg` (4.5:1+ on canvas in light and dark; `text-warning` was 2.69:1). */
function SubLine({ p, text }: { p: MapPlatform; text: string }) {
  const status = p.status === 'active' ? '' : `${STATUS_WORD[p.status]} · `;
  return (
    <span className={cn('block truncate text-xs', p.needsSource ? 'text-warning-fg' : 'text-ink-subtle')}>
      {status}
      {text}
    </span>
  );
}

function DiagramNode({
  p,
  links,
  hot,
  onHover,
  onSelect,
}: {
  p: MapPlatform;
  links: MapEdge[];
  hot: boolean;
  onHover: (id: string | null) => void;
  onSelect?: (id: string) => void;
}) {
  const left = p.side === 'consumer';
  const row = cn('flex w-full min-w-0 items-center gap-2.5 rounded-lg py-1', left ? 'flex-row-reverse text-right' : 'text-left');
  const name = (
    <span className={cn('flex min-w-0 items-center gap-1.5', left && 'flex-row-reverse')}>
      <span className="truncate text-sm font-semibold text-ink">{p.label}</span>
      <AttentionBadge p={p} />
    </span>
  );
  if (p.restricted) {
    return (
      <div className={cn(row, 'self-center')} aria-label={`${p.label}, ${STATUS_WORD[p.status]}. You do not have access to this platform.`} role="group">
        <Tile p={p} />
        <span className="min-w-0 flex-1">
          {name}
          <span className={cn('flex items-center gap-1 text-xs text-ink-subtle', left && 'justify-end')}>
            <Icon icon={LockSimple} size="sm" />
            {STATUS_WORD[p.status]}
          </span>
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label={`${p.label}, ${p.kind}, ${STATUS_WORD[p.status]}. ${shortRelation(p, links)}.${p.attention ? ` ${p.attention} need attention.` : ''} Open details`}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(p.id)}
      onBlur={() => onHover(null)}
      onClick={() => onSelect?.(p.id)}
      className={cn(row, 'group self-center', focusRing)}
    >
      <Tile p={p} hot={hot} />
      <span className="min-w-0 flex-1">
        {name}
        <SubLine p={p} text={shortRelation(p, links)} />
      </span>
    </button>
  );
}

function Diagram({ platforms, links, onNodeSelect }: ConnectionsMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const consumers = platforms.filter((p) => p.side === 'consumer');
  const providers = platforms.filter((p) => p.side === 'provider');
  const yOf = (list: MapPlatform[], id: string) => ((list.findIndex((p) => p.id === id) + 0.5) / list.length) * 100;
  const linked = (a: string, b: string | null) => links.some((l) => (l.consumerId === a && l.providerId === b) || (l.providerId === a && l.consumerId === b));
  const isHot = (id: string) => hovered === id || linked(id, hovered);

  return (
    <div className="hidden [@container(min-width:36rem)]:block">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(4rem,0.6fr)_minmax(0,1fr)]">
        <ul className="grid auto-rows-[minmax(3.5rem,1fr)]" aria-label="Platforms that read data">
          {consumers.map((p) => (
            <li key={p.id} className="flex">
              <DiagramNode p={p} links={links} hot={isHot(p.id)} onHover={setHovered} onSelect={onNodeSelect} />
            </li>
          ))}
        </ul>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
          {links.map((l) => {
            const y0 = yOf(consumers, l.consumerId);
            const y1 = yOf(providers, l.providerId);
            const hot = hovered === l.consumerId || hovered === l.providerId;
            return (
              <path
                key={`${l.consumerId}:${l.providerId}`}
                d={`M 0 ${y0} C 50 ${y0}, 50 ${y1}, 100 ${y1}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={hot ? 2.5 : 1.5}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={cn('transition-colors', hot ? 'text-primary-600' : 'text-border-strong')}
              />
            );
          })}
        </svg>
        <ul className="grid auto-rows-[minmax(3.5rem,1fr)]" aria-label="Platforms that share data">
          {providers.map((p) => (
            <li key={p.id} className="flex">
              <DiagramNode p={p} links={links} hot={isHot(p.id)} onHover={setHovered} onSelect={onNodeSelect} />
            </li>
          ))}
        </ul>
      </div>
      <p className="flex items-center justify-center gap-3 pt-4 text-xs text-ink-subtle">
        <span>Reads data</span>
        <span aria-hidden="true" className="h-px w-8 bg-border-strong" />
        <span>Shares data · hover a platform to trace its links</span>
      </p>
    </div>
  );
}

/** Below 36rem: every platform as a divided row with its links written out. */
function PlatformRows({ platforms, links, onNodeSelect, alwaysShow }: ConnectionsMapProps & { alwaysShow?: boolean }) {
  const byId = (id: string) => platforms.find((p) => p.id === id);
  return (
    <ul className={cn('flex flex-col', !alwaysShow && '[@container(min-width:36rem)]:hidden')}>
      {platforms.map((p) => {
        const body = (
          <>
            <Tile p={p} />
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm font-semibold text-ink">{p.label}</span>
                <AttentionBadge p={p} />
              </span>
              {p.restricted ? (
                <span className="flex items-center gap-1 text-xs text-ink-subtle">
                  <Icon icon={LockSimple} size="sm" />
                  {STATUS_WORD[p.status]}
                </span>
              ) : (
                <span className={cn('block text-xs', p.needsSource ? 'text-warning-fg' : 'text-ink-subtle')}>
                  {p.status === 'active' ? '' : `${STATUS_WORD[p.status]} · `}
                  {p.side === 'consumer' && !p.needsSource && links.some((l) => l.consumerId === p.id) ? 'Reads ' : ''}
                  {relation(p, links, byId)}
                </span>
              )}
            </span>
          </>
        );
        return (
          <li key={p.id}>
            {p.restricted ? (
              <div className="flex items-center gap-3 py-2.5">{body}</div>
            ) : (
              <button
                type="button"
                onClick={() => onNodeSelect?.(p.id)}
                className={cn('flex w-full items-center gap-3 rounded-lg py-2.5 text-left hover:bg-surface-muted', focusRing)}
              >
                {body}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Plain list of every platform (Platforms page "Platforms" view; same rows as the narrow map). */
export function PlatformList(props: ConnectionsMapProps) {
  return <PlatformRows {...props} alwaysShow />;
}

/**
 * The shared map. With no links yet (e.g. one platform) it shows the platforms as rows plus a hint,
 * since there is nothing to draw between them.
 */
export function ConnectionsMap(props: ConnectionsMapProps) {
  const { platforms, links, className } = props;
  if (links.length === 0) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <PlatformRows {...props} alwaysShow />
        <p className="text-xs text-ink-subtle">Add another platform to share stock, catalog or parts between them.</p>
      </div>
    );
  }
  return (
    <div className={cn('flex flex-col', className)} aria-label={`Connections map, ${platforms.length} platforms`} role="group">
      <Diagram {...props} />
      <PlatformRows {...props} />
    </div>
  );
}
