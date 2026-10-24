/**
 * PROTOTYPE (RDY-224) - Lab platform map: the isometric pastel town scene (Zdog).
 *
 * One canvas, fixed bird's-eye isometric camera (no rotate / drag / zoom),
 * scaled to fit the container width. Renders on demand only: on load, resize,
 * theme change, hover / focus and while a light fade runs - never an idle loop.
 *
 * Composable API for the page ticket (RDY-225) and delivery:
 *   buildings, links, lights, onHover(id, screenPoint), onSelect(id)
 * `screenPoint` is in CSS px relative to the scene's top-left corner (the
 * building's roof lamp), so a bubble can be anchored above the building.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as Zdog from 'zdog';
import { cn } from '../../utils/cn';
import { buildBuilding, buildGround, buildScenery, type BuildingModel, type Projected, type SceneDetail } from './art';
import { TILE_H, TILE_W, TURN, dedupeLinks, defaultLights, planTown, tiltFor, type TownBuilding, type TownLink } from './layout';
import { css, readPalette, type TownPalette } from './palette';

export type { TownBuilding, TownLink, TownStatus } from './layout';

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface TownRenderStats {
  /** Scene graph build time (ms). */
  buildMs: number;
  /** One frame draw time (ms). */
  drawMs: number;
  /** Zdog items in the render graph. */
  items: number;
}

export interface TownSceneProps {
  buildings: readonly TownBuilding[];
  /** Platform-to-platform links; deduped, one road per pair. */
  links?: readonly TownLink[];
  /** Lights per building id (view-only). Missing ids: on for ACTIVE / DEGRADED, off for OFFLINE. */
  lights?: Readonly<Record<string, boolean>>;
  /** Hovered (or keyboard-focused) building, with its roof point; `null` when the pointer leaves. */
  onHover?: (id: string | null, point: ScreenPoint | null) => void;
  /** Click, tap, Enter or Space on a building. */
  onSelect?: (id: string) => void;
  /** Accessible name of the scene. */
  label?: string;
  /** Build / draw timings, reported after each rebuild (perf check). */
  onRenderStats?: (stats: TownRenderStats) => void;
  /** `blockout` = massing boxes for the master-plan review; `full` = the finished building art. */
  detail?: SceneDetail;
  /** Projection tile height in px (tile width is TILE_W): lower it to flatten the view. Default TILE_H. */
  tileH?: number;
  className?: string;
}

const STATUS_TEXT = { ACTIVE: 'Active', DEGRADED: 'Degraded', OFFLINE: 'Offline' } as const;
const KIND_TEXT: Record<string, string> = { inventory: 'Warehouse', sms: 'Service shop' };

/** Camera: fixed isometric tilt and 45 degree turn. */
/** Canvas padding in CSS px; the bottom leaves room for the front row's signs. */
const PAD_X = 12;
const PAD_TOP = 84;
const PAD_BOTTOM = 12;
/** Small tenants stop growing here so outlines and signs keep their weight. */
const MAX_ZOOM = 1.5;
const FADE_MS = 250;

/** Zdog runtime members that @types/zdog does not declare. */
type Illo = Zdog.Illustration & { ctx: CanvasRenderingContext2D; pixelRatio: number; children: Zdog.Anchor[]; flatGraph: unknown[] };
type Sortable = Zdog.Group & { updateSortValue: () => void; sortValue: number };

interface Scene {
  illo: Illo;
  models: BuildingModel[];
  zoom: number;
  dx: number;
  dy: number;
  width: number;
  height: number;
}

function describe(b: TownBuilding, on: boolean): string {
  const kind = KIND_TEXT[b.kind] ?? `Store (${b.kind})`;
  const alerts = b.alerts > 0 ? `, ${b.alerts} alert${b.alerts === 1 ? '' : 's'}` : '';
  return `${b.label}: ${kind}, ${STATUS_TEXT[b.status]}${alerts}, lights ${on ? 'on' : 'off'}`;
}

/** Keeps a ground layer behind every building, whatever its depth. */
function pinBehind(group: Zdog.Group, value: number) {
  const g = group as Sortable;
  const base = g.updateSortValue.bind(g);
  g.updateSortValue = () => {
    base();
    g.sortValue = value;
  };
}

export function TownScene({
  buildings,
  links = [],
  lights,
  onHover,
  onSelect,
  label = 'Platform town map',
  onRenderStats,
  detail = 'full',
  tileH = TILE_H,
  className,
}: TownSceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const [width, setWidth] = useState(0);
  const [palette, setPalette] = useState<TownPalette | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const plan = useMemo(() => planTown(buildings), [buildings]);
  const placed = plan.placed;
  const roads = useMemo(() => dedupeLinks(links, new Set(buildings.map((b) => b.id))), [links, buildings]);
  const lightsOn = useMemo(() => ({ ...defaultLights(buildings), ...lights }), [buildings, lights]);
  const glowRef = useRef<Record<string, number>>({});
  const latest = useRef({ hoverId, focusId, placed, lightsOn, onHover, onRenderStats });
  latest.current = { hoverId, focusId, placed, lightsOn, onHover, onRenderStats };

  // Size: fit the container width.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Colours: read tokens now and whenever the theme attribute changes.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setPalette(readPalette(el));
    const mo = new MutationObserver(() => setPalette(readPalette(el)));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    return () => mo.disconnect();
  }, []);

  const toScreen = useCallback((a: Projected): ScreenPoint => {
    const s = sceneRef.current!;
    return { x: s.width / 2 + (a.renderOrigin.x + s.dx) * s.zoom, y: s.height / 2 + (a.renderOrigin.y + s.dy) * s.zoom };
  }, []);

  const bounds = useCallback(
    (m: BuildingModel) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const c of m.corners) {
        const p = toScreen(c);
        x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
      }
      return { x0, y0, x1, y1 };
    },
    [toScreen],
  );

  /** Draws the Zdog graph, then the 2D overlay (signs, alert badges, focus ring). */
  const draw = useCallback(() => {
    const s = sceneRef.current;
    if (!s || !palette) return 0;
    const t0 = performance.now();
    s.illo.updateRenderGraph();
    const ctx = s.illo.ctx;
    const pr = s.illo.pixelRatio;
    const { hoverId: hov, focusId: foc, placed: pl } = latest.current;
    ctx.save();
    ctx.setTransform(pr, 0, 0, pr, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    /** Tooltip on the roof: label in a small rounded bubble with a pointer, kept inside the canvas. */
    const tooltip = (text: string, at: ScreenPoint) => {
      ctx.font = `600 12px ${palette.font}`;
      const w = Math.min(ctx.measureText(text).width + 20, s.width - 8);
      let t = text;
      while (t.length > 1 && ctx.measureText(t).width > w - 20) t = t.slice(0, -1);
      if (t !== text) t = `${t.trimEnd()}…`;
      const h = 24;
      const x = Math.min(Math.max(at.x - w / 2, 4), s.width - w - 4);
      const y = Math.max(at.y - 22 - h, 4);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.moveTo(at.x - 5, y + h);
      ctx.lineTo(at.x, y + h + 6);
      ctx.lineTo(at.x + 5, y + h);
      ctx.fillStyle = css(palette.signFill);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = css(palette.signBorder);
      ctx.stroke();
      ctx.fillStyle = css(palette.signText);
      ctx.fillText(t, x + w / 2, y + h / 2 + 0.5);
    };
    const byId = new Map(pl.map((b) => [b.id, b]));
    // Back-to-front so nearer badges sit on top; the tooltip is drawn last, above everything.
    const order = [...s.models].sort((a, b) => a.signAt.renderOrigin.z - b.signAt.renderOrigin.z);
    for (const m of order) {
      const b = byId.get(m.id)!;
      if (b.alerts > 0) {
        const p = toScreen(m.lampAt);
        const text = b.alerts > 9 ? '9+' : String(b.alerts);
        ctx.font = `700 10px ${palette.font}`;
        const r = 8;
        const bx = p.x + 9;
        const by = p.y - 6;
        ctx.beginPath();
        ctx.roundRect(bx - r, by - r, Math.max(r * 2, ctx.measureText(text).width + 8), r * 2, r);
        ctx.fillStyle = css(palette.badge);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = css(palette.signFill);
        ctx.stroke();
        ctx.fillStyle = css(palette.badgeText);
        ctx.textAlign = 'left';
        ctx.fillText(text, bx - r + 4, by + 0.5);
        ctx.textAlign = 'center';
      }
      if (m.id === foc) {
        const box = bounds(m);
        ctx.beginPath();
        ctx.roundRect(box.x0 - 6, box.y0 - 6, box.x1 - box.x0 + 12, box.y1 - box.y0 + 12, 8);
        ctx.lineWidth = 2;
        ctx.strokeStyle = css(palette.focus);
        ctx.stroke();
      }
    }
    const active = hov ?? foc;
    const am = active ? s.models.find((m) => m.id === active) : undefined;
    if (am) tooltip(byId.get(am.id)!.label, toScreen(am.lampAt));
    ctx.restore();
    return performance.now() - t0;
  }, [palette, toScreen, bounds]);

  const tilt = tiltFor(TILE_W, tileH);

  /** (Re)builds the scene graph from the current glow values. */
  const build = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !palette || width <= 0) return;
    const t0 = performance.now();
    let s = sceneRef.current;
    if (!s || s.illo.element !== canvas) {
      const illo = new Zdog.Illustration({ element: canvas, rotate: { x: -tilt, y: TURN } }) as Illo;
      s = { illo, models: [], zoom: 1, dx: 0, dy: 0, width, height: 0 };
      sceneRef.current = s;
    }
    const scene = s;
    const { illo } = scene;
    illo.rotate.x = -tilt;
    [...illo.children].forEach((c) => c.remove());
    const { ground, extent } = buildGround(illo, palette, plan, roads);
    pinBehind(ground, -1e9);
    buildScenery(illo, palette, plan);
    scene.models = placed.map((b) => buildBuilding(illo, palette, b, glowRef.current[b.id] ?? (latest.current.lightsOn[b.id] ? 1 : 0), detail));
    // Fit: projected extents are zoom-independent, so measure them, then size the canvas tightly.
    illo.updateGraph();
    const pts = [...extent, ...scene.models.flatMap((m) => [...m.corners, m.lampAt])];
    const xs = pts.map((q) => q.renderOrigin.x);
    const ys = pts.map((q) => q.renderOrigin.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const zoom = Math.min(MAX_ZOOM, (width - PAD_X * 2) / (maxX - minX));
    const height = Math.ceil((maxY - minY) * zoom + PAD_TOP + PAD_BOTTOM);
    const dx = -(minX + maxX) / 2;
    const dy = (PAD_TOP - height / 2) / zoom - minY;
    illo.zoom = zoom;
    illo.onPrerender = (ctx) => (ctx as CanvasRenderingContext2D).translate(dx, dy);
    const pr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * pr) || canvas.height !== Math.round(height * pr)) illo.setSize(width, height);
    Object.assign(scene, { zoom, dx, dy, width, height });
    const buildMs = performance.now() - t0;
    const drawMs = draw();
    latest.current.onRenderStats?.({ buildMs, drawMs, items: illo.flatGraph.length });
  }, [palette, width, plan, placed, roads, detail, tilt, draw]);

  useLayoutEffect(build, [build]);

  // Lights: fade window glow toward the target (instant with reduced motion).
  useEffect(() => {
    const target = lightsOn;
    const g = glowRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const ids = Object.keys(target);
    const first = ids.every((id) => g[id] === undefined);
    if (reduce || first) {
      ids.forEach((id) => (g[id] = target[id] ? 1 : 0));
      build();
      return;
    }
    const from = Object.fromEntries(ids.map((id) => [id, g[id] ?? (target[id] ? 1 : 0)]));
    if (ids.every((id) => from[id] === (target[id] ? 1 : 0))) return;
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS);
      const e = 1 - (1 - t) * (1 - t);
      ids.forEach((id) => (g[id] = from[id] + ((target[id] ? 1 : 0) - from[id]) * e));
      build();
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [lightsOn]); // build is read fresh each frame; re-running on build changes would restart the fade


  useEffect(() => {
    draw();
  }, [hoverId, focusId, draw]);

  const hit = (clientX: number, clientY: number): string | null => {
    const s = sceneRef.current;
    const el = canvasRef.current;
    if (!s || !el) return null;
    const r = el.getBoundingClientRect();
    const x = clientX - r.left;
    const y = clientY - r.top;
    let best: BuildingModel | null = null;
    for (const m of s.models) {
      const b = bounds(m);
      if (x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1) {
        if (!best || m.signAt.renderOrigin.z > best.signAt.renderOrigin.z) best = m;
      }
    }
    return best?.id ?? null;
  };

  const emitHover = (id: string | null) => {
    const m = id ? sceneRef.current?.models.find((x) => x.id === id) : undefined;
    latest.current.onHover?.(id, m ? toScreen(m.lampAt) : null);
  };

  const onMove = (e: React.PointerEvent) => {
    const id = hit(e.clientX, e.clientY);
    if (id !== hoverId) {
      setHoverId(id);
      emitHover(id);
    }
  };

  const onLeave = () => {
    if (hoverId !== null) {
      setHoverId(null);
      emitHover(null);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    const id = hit(e.clientX, e.clientY);
    if (id) onSelect?.(id);
  };

  const summary = `${label}: ${buildings.length} platform${buildings.length === 1 ? '' : 's'}, ${roads.length} road${roads.length === 1 ? '' : 's'}.`;

  return (
    <div
      ref={wrapRef}
      className={cn('relative w-full', className)}
      style={palette ? { backgroundImage: `linear-gradient(${css(palette.skyTop)}, ${css(palette.skyBottom)})` } : undefined}
      role="group"
      aria-label={label}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn('block w-full select-none touch-manipulation', hoverId && 'cursor-pointer')}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={onClick}
      />
      <p className="sr-only">{summary}</p>
      <ul className="sr-only">
        {placed.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onFocus={() => {
                setFocusId(b.id);
                emitHover(b.id);
              }}
              onBlur={() => {
                setFocusId(null);
                emitHover(null);
              }}
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
