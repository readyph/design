/**
 * RDY-213 revision: default shell content = the platform connections diagram (owner feedback 3).
 * Flat layout (feedback 2): no cards, no stat tiles. Section heading + plain summary line, the
 * diagram on the canvas (bare icon tiles + labels, no node boxes), then a divided list of the same
 * links (the text equivalent; the only view below a 36rem content width).
 *
 * RDY-214 owns the shared ConnectionsMap; this shows how it sits in the shell. Geometry is the
 * Platforms page map (760 x 360 viewBox stretched to 15rem tall, consumers left, providers right) with fixed positions as
 * Tailwind arbitrary classes (no inline styles) because the mock data is static.
 */
import { useState } from 'react';
import { ArrowRight, Warning } from '@phosphor-icons/react';
import { Button, Icon, StatusDot, cn, focusRing } from '../../index';
import { MAP_CONSUMERS, MAP_LINKS, MAP_PROVIDERS, type MapInstance } from './data';

const VB_W = 760;
const VB_H = 360;
const EDGE_X0 = 276; // consumer node inner edge (16 + 260)
const EDGE_X1 = 484; // provider node inner edge (760 - 16 - 260)

/** y in viewBox units; mirrors the Tailwind top-[..] classes below. */
const CONSUMER_Y: Record<string, number> = { 'st-makati': 60, 'st-bgc': 180, 'st-cebu': 300 };
const PROVIDER_Y: Record<string, number> = { 'inv-central': 120, 'inv-davao': 240 };
const CONSUMER_TOP: Record<string, string> = { 'st-makati': 'top-[16.667%]', 'st-bgc': 'top-[50%]', 'st-cebu': 'top-[83.333%]' };
const PROVIDER_TOP: Record<string, string> = { 'inv-central': 'top-[33.333%]', 'inv-davao': 'top-[66.667%]' };

const byId = (id: string) => [...MAP_CONSUMERS, ...MAP_PROVIDERS].find((i) => i.id === id)!;
const unlinked = MAP_CONSUMERS.filter((c) => !MAP_LINKS.some((l) => l.consumerId === c.id));
const servedBy = (providerId: string) => new Set(MAP_LINKS.filter((l) => l.providerId === providerId).map((l) => l.consumerId)).size;

function sub(inst: MapInstance) {
  if (inst.kind === 'Inventory') {
    const n = servedBy(inst.id);
    return n > 0 ? `Shares with ${n}` : 'No consumers';
  }
  return unlinked.includes(inst) ? 'Needs a source' : 'Connected';
}

function Node({ inst, side, hot, onHover }: { inst: MapInstance; side: 'consumer' | 'provider'; hot: boolean; onHover: (id: string | null) => void }) {
  const consumer = side === 'consumer';
  const needs = unlinked.includes(inst);
  return (
    <button
      type="button"
      aria-label={`${inst.label}, ${inst.kind}, ${inst.status}. ${sub(inst)}`}
      onMouseEnter={() => onHover(inst.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(inst.id)}
      onBlur={() => onHover(null)}
      className={cn(
        'absolute flex w-[34.211%] -translate-y-1/2 items-center gap-2.5 rounded-lg py-1',
        consumer ? 'left-[2.105%] flex-row-reverse text-right' : 'left-[63.684%] text-left',
        consumer ? CONSUMER_TOP[inst.id] : PROVIDER_TOP[inst.id],
        focusRing,
      )}
    >
      <span
        className={cn(
          'relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink transition-colors',
          hot && 'bg-primary-50 text-primary-700',
        )}
      >
        <Icon icon={inst.icon} size="md" />
        <span className="absolute -bottom-0.5 -right-0.5">
          <StatusDot status={inst.status} size="sm" />
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{inst.label}</span>
        <span className={cn('block truncate text-xs', needs ? 'text-warning' : 'text-ink-subtle')}>
          {sub(inst)}
        </span>
      </span>
    </button>
  );
}

function Diagram() {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <div className="hidden [@container(min-width:36rem)]:block">
      <div className="relative h-[15rem] w-full">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
          {MAP_LINKS.map((l) => {
            const y0 = CONSUMER_Y[l.consumerId];
            const y1 = PROVIDER_Y[l.providerId];
            const hot = hovered === l.consumerId || hovered === l.providerId;
            const d = `M ${EDGE_X0} ${y0} C ${EDGE_X0 + 90} ${y0}, ${EDGE_X1 - 90} ${y1}, ${EDGE_X1} ${y1}`;
            return (
              <path
                key={`${l.consumerId}:${l.providerId}`}
                d={d}
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
        {MAP_CONSUMERS.map((c) => (
          <Node key={c.id} inst={c} side="consumer" hot={hovered === c.id || MAP_LINKS.some((l) => l.consumerId === c.id && l.providerId === hovered)} onHover={setHovered} />
        ))}
        {MAP_PROVIDERS.map((p) => (
          <Node key={p.id} inst={p} side="provider" hot={hovered === p.id || MAP_LINKS.some((l) => l.providerId === p.id && l.consumerId === hovered)} onHover={setHovered} />
        ))}
      </div>
      <p className="flex items-center justify-center gap-3 pt-4 text-xs text-ink-subtle">
        <span>Reads data</span>
        <span aria-hidden="true" className="h-px w-8 bg-border-strong" />
        <span>Shares data · hover a platform to trace its links</span>
      </p>
    </div>
  );
}

/** Flat list of the same links: text equivalent of the diagram, and the phone view. */
function LinkRows() {
  return (
    <div className="flex flex-col">
      <h3 className="pb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Data links</h3>
      <ul className="divide-y divide-border border-y border-border">
        {MAP_LINKS.map((l) => {
          const c = byId(l.consumerId);
          const p = byId(l.providerId);
          return (
            <li key={`${l.consumerId}:${l.providerId}`} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2.5 text-sm">
              <StatusDot status={c.status} size="sm" />
              <span className="font-medium text-ink">{c.label}</span>
              <Icon icon={ArrowRight} size="sm" className="text-ink-subtle" />
              <span className="font-medium text-ink">{p.label}</span>
              <span className="w-full pl-4 text-xs text-ink-subtle [@container(min-width:36rem)]:ml-auto [@container(min-width:36rem)]:w-auto [@container(min-width:36rem)]:pl-0">
                Reads {l.capability.toLowerCase()}
              </span>
            </li>
          );
        })}
        {unlinked.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2.5 text-sm">
            <Icon icon={Warning} size="sm" className="text-warning" />
            <span className="font-medium text-ink">{c.label}</span>
            <span className="text-ink-muted">has no stock source</span>
            <Button size="sm" variant="subtle" className="ml-auto">
              Connect
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Default Portal content inside the shell: the platform connections diagram. */
export function ConnectionsOverview() {
  const platforms = MAP_CONSUMERS.length + MAP_PROVIDERS.length;
  return (
    <section aria-labelledby="connections-heading" className="flex flex-col gap-6 px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 id="connections-heading" className="text-base font-semibold text-ink">
            Platform connections
          </h1>
          <p className="text-sm text-ink-muted">
            {platforms} platforms · {MAP_LINKS.length} data links · <span className="text-warning">{unlinked.length} needs a source</span>
          </p>
        </div>
        <Button size="sm" variant="secondary">
          Manage connections
        </Button>
      </header>
      <Diagram />
      <LinkRows />
    </section>
  );
}
