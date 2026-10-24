/**
 * PROTOTYPE (RDY-224) - Lab platform map: the isometric town scene (SVG).
 *
 * Contract for the page (RDY-225) and delivery (RDY-230):
 *   buildings, links, lights, onHover(id, point), onSelect(id)
 * `point` is in CSS px relative to the scene's top-left corner: the top centre of the
 * building's floating label, so a bubble can be anchored above it.
 * Camera: drag to rotate, or pass `rotation` (radians, controlled) / `defaultRotation`.
 * Lights default per status (ACTIVE and DEGRADED on, OFFLINE off) and take a `lights` map.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../utils/cn';
import './town-scene.css';
import { Engine, type LabelTokens } from './town/engine';
import { connectionsFor } from './town/links';
import type { Plat } from './town/core';

export interface ScreenPoint {
  x: number;
  y: number;
}
export type TownStatus = 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
export interface TownBuilding {
  id: string;
  label: string;
  /** Platform kind: `inventory` = warehouse, `sms` = service shop, store kinds = store, anything else = office. */
  kind: string;
  status: TownStatus;
  alerts: number;
}
export interface TownLink {
  from: string;
  to: string;
}
export interface TownRenderStats {
  /** Scene build time (ms). */
  buildMs: number;
  /** One frame draw time (ms). */
  drawMs: number;
  /** Depth-sorted objects in the scene. */
  items: number;
}

export interface TownSceneProps {
  buildings: readonly TownBuilding[];
  /** Platform-to-platform links; deduped, one connection per pair. */
  links?: readonly TownLink[];
  /** Lights per building id. Missing ids: on for ACTIVE / DEGRADED, off for OFFLINE. */
  lights?: Readonly<Record<string, boolean>>;
  /** Hovered or keyboard-focused building with its label point; `null` when the pointer leaves. */
  onHover?: (id: string | null, point: ScreenPoint | null) => void;
  /** Click, tap, Enter or Space on a building or its label. */
  onSelect?: (id: string) => void;
  /** Camera rotation in radians (controlled). Quarter turns are PI / 2. */
  rotation?: number;
  defaultRotation?: number;
  onRotationChange?: (radians: number) => void;
  /** Platform whose label point is reported through onHover (a pinned bubble for review). */
  pinnedId?: string | null;
  /** Connection id (`from~to`) to emphasise, e.g. the legend row under the pointer. */
  highlightLink?: string | null;
  /** `roads` = delivery vans on the roads, `power` = poles and wires. */
  mode?: 'roads' | 'power';
  /** Accessible name of the scene. */
  label?: string;
  onRenderStats?: (stats: TownRenderStats) => void;
  className?: string;
}

const STATUS_TEXT = { ACTIVE: 'Active', DEGRADED: 'Degraded', OFFLINE: 'Offline' } as const;
const KIND_TEXT: Record<string, string> = { inventory: 'Inventory platform', sms: 'SMS platform', pos: 'POS platform' };
const STORE_KINDS = new Set(['pos', 'store', 'storefront', 'other']);

/** Kind to building type: inventory warehouse, sms service shop, store kinds store, anything else office. */
export function typeFor(kind: string): 'warehouse' | 'service' | 'store' | 'office' {
  if (kind === 'inventory') return 'warehouse';
  if (kind === 'sms') return 'service';
  return STORE_KINDS.has(kind) ? 'store' : 'office';
}
export const defaultLights = (buildings: readonly TownBuilding[]): Record<string, boolean> =>
  Object.fromEntries(buildings.map((b) => [b.id, b.status !== 'OFFLINE']));
export { connectionsFor };

const BADGE: Record<string, string> = { inventory: 'IN', sms: 'SM', pos: 'PS', store: 'PS', storefront: 'PS' };

function toPlat(b: TownBuilding, on: boolean): Plat {
  const kind = KIND_TEXT[b.kind] ?? `${b.kind.charAt(0).toUpperCase()}${b.kind.slice(1)} platform`;
  return {
    id: b.id, type: typeFor(b.kind), name: b.label, sub: `${kind} · ${STATUS_TEXT[b.status]}`,
    badge: BADGE[b.kind] ?? b.kind.slice(0, 2).toUpperCase(), lights: on, alerts: b.alerts, status: b.status,
  };
}

function describe(b: TownBuilding, on: boolean): string {
  const alerts = b.alerts > 0 ? `, ${b.alerts} alert${b.alerts === 1 ? '' : 's'}` : '';
  return `${b.label}: ${KIND_TEXT[b.kind] ?? b.kind}, ${STATUS_TEXT[b.status]}${alerts}, lights ${on ? 'on' : 'off'}`;
}

const rgbOf = (el: Element, name: string, fallback: string) => {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const p = raw.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
  return p.length >= 3 ? `rgb(${p[0]},${p[1]},${p[2]})` : fallback;
};
const lum = (c: string) => { const m = c.match(/\d+/g)!.map(Number); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };

function readTokens(el: Element): { tokens: LabelTokens; dark: boolean } {
  const ink = rgbOf(el, '--ds-ink', 'rgb(23,23,23)'), canvas = rgbOf(el, '--ds-canvas', 'rgb(236,236,237)');
  return {
    dark: lum(canvas) < lum(ink),
    tokens: {
      ink, inkMuted: rgbOf(el, '--ds-ink-muted', 'rgb(82,82,82)'), surface: rgbOf(el, '--ds-surface', 'rgb(255,255,255)'),
      border: rgbOf(el, '--ds-border', 'rgb(229,229,229)'), focus: rgbOf(el, '--ds-focus', 'rgb(59,130,246)'),
      error: rgbOf(el, '--ds-error', 'rgb(220,38,38)'), onError: 'rgb(255,255,255)',
    },
  };
}

export function TownScene({
  buildings, links = [], lights, onHover, onSelect, rotation, defaultRotation = 0, onRotationChange, highlightLink = null, pinnedId = null,
  mode = 'roads', label = 'Platform town map', onRenderStats, className,
}: TownSceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const refs = { base: useRef<SVGGElement>(null), links: useRef<SVGGElement>(null), glowl: useRef<SVGGElement>(null), objects: useRef<SVGGElement>(null), labels: useRef<SVGGElement>(null) };
  const engineRef = useRef<Engine | null>(null);
  const [viewBox, setViewBox] = useState('-930 -210 1860 1260');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const lightsOn = useMemo(() => ({ ...defaultLights(buildings), ...lights }), [buildings, lights]);
  const latest = useRef({ onHover, onSelect, onRotationChange, onRenderStats, hoverId, lightsOn });
  latest.current = { onHover, onSelect, onRotationChange, onRenderStats, hoverId, lightsOn };

  // Engine: created once the layers exist; stopped on unmount.
  useLayoutEffect(() => {
    const L = { base: refs.base.current!, links: refs.links.current!, glowl: refs.glowl.current!, objects: refs.objects.current!, labels: refs.labels.current! };
    const e = new Engine(L);
    e.onViewBox = setViewBox;
    e.setTarget(rotation ?? defaultRotation);
    e.setThetaNow(rotation ?? defaultRotation);
    engineRef.current = e;
    e.start();
    return () => { e.stop(); engineRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Label point (CSS px relative to the scene) for a platform. */
  const pointFor = useCallback((id: string): ScreenPoint | null => {
    const e = engineRef.current, svg = svgRef.current, wrap = wrapRef.current;
    const a = e?.labelAnchor(id);
    const ctm = svg?.getScreenCTM?.();
    if (!a || !svg || !wrap || !ctm) return null;
    const r = wrap.getBoundingClientRect();
    return { x: ctm.a * a.x + ctm.c * a.y + ctm.e - r.left, y: ctm.b * a.x + ctm.d * a.y + ctm.f - r.top };
  }, []);

  // Theme: read tokens now and whenever the theme attribute changes.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const apply = () => { const t = readTokens(el); engineRef.current?.setDark(t.dark); engineRef.current?.setTokens(t.tokens); };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => mo.disconnect();
  }, []);

  // Map: rebuild when the platform list, links or mode change.
  useLayoutEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    const t0 = performance.now();
    e.render(buildings.map((b) => toPlat(b, latest.current.lightsOn[b.id])), links, mode);
    const buildMs = performance.now() - t0;
    const t1 = performance.now();
    e.frame(performance.now());
    latest.current.onRenderStats?.({ buildMs, drawMs: performance.now() - t1, items: e.ctx.objects.length });
  }, [buildings, links, mode]);

  useEffect(() => { engineRef.current?.setLights(lightsOn); }, [lightsOn]);
  useEffect(() => { engineRef.current?.setHilite(highlightLink); }, [highlightLink]);
  useEffect(() => { if (rotation !== undefined) engineRef.current?.setTarget(rotation); }, [rotation]);

  // A pinned platform reports its label point after every rebuild and camera settle.
  useEffect(() => {
    if (pinnedId) latest.current.onHover?.(pinnedId, pointFor(pinnedId));
  }, [pinnedId, pointFor, buildings, viewBox]);

  // Hover point follows the camera once it settles after a rotation.
  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    e.onSettle = () => { const id = latest.current.hoverId; if (id) latest.current.onHover?.(id, pointFor(id)); };
  }, [pointFor]);

  const emit = (id: string | null) => latest.current.onHover?.(id, id ? pointFor(id) : null);
  const idAt = (t: EventTarget | null) => (t as Element | null)?.closest?.('.plot-obj, .label')?.getAttribute('data-id') ?? null;

  // Pointer: drag to rotate, click to select, hover to inspect.
  const drag = useRef<{ x: number; t: number; moved: boolean } | null>(null);
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, t: engineRef.current?.target ?? 0, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current, en = engineRef.current;
    if (d && en) {
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 4) { d.moved = true; en.dragging = true; svgRef.current?.classList.add('is-dragging'); }
      if (d.moved) { const t = d.t - dx * 0.008; en.setTarget(t); en.setThetaNow(t); latest.current.onRotationChange?.(t); }
      return;
    }
    const id = idAt(document.elementFromPoint(e.clientX, e.clientY));
    if (id !== latest.current.hoverId) { setHoverId(id); emit(id); }
  };
  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current, en = engineRef.current;
    svgRef.current?.classList.remove('is-dragging');
    if (en) en.dragging = false;
    drag.current = null;
    if (d && !d.moved) { const id = idAt(document.elementFromPoint(e.clientX, e.clientY)); if (id) latest.current.onSelect?.(id); }
    else if (d?.moved) emit(latest.current.hoverId);
  };
  const onLeave = () => { if (latest.current.hoverId !== null) { setHoverId(null); emit(null); } };

  const summary = `${label}: ${buildings.length} platform${buildings.length === 1 ? '' : 's'}.`;

  return (
    <div ref={wrapRef} className={cn('town-scene relative h-full w-full select-none overflow-hidden', className)} role="group" aria-label={label}>
      <svg
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        className={cn('block h-full w-full cursor-grab touch-none', hoverId && 'cursor-pointer')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onLeave}
      >
        <defs>
          <filter id="rph-soft" x="-20%" y="-40%" width="140%" height="180%"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1E3A8A" floodOpacity=".14" /></filter>
          <filter id="rph-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="rph-blur8" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" /></filter>
          <radialGradient id="rph-pool">
            <stop offset="0" stopColor="#FFD66B" stopOpacity=".55" />
            <stop offset=".6" stopColor="#FFD66B" stopOpacity=".2" />
            <stop offset="1" stopColor="#FFD66B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g ref={refs.base} />
        <g ref={refs.links} />
        <g ref={refs.glowl} />
        <g ref={refs.objects} />
        <g ref={refs.labels} />
      </svg>
      <p className="sr-only">{summary}</p>
      <ul className="sr-only">
        {buildings.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onFocus={() => { engineRef.current?.setFocus(b.id); setHoverId(b.id); emit(b.id); }}
              onBlur={() => { engineRef.current?.setFocus(null); setHoverId(null); emit(null); }}
              onClick={() => onSelect?.(b.id)}
            >
              {describe(b, lightsOn[b.id])}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
