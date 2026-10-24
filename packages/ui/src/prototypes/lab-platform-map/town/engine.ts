/**
 * PROTOTYPE (RDY-224) - the Lab platform map engine: builds the island, plots, roads and
 * connections from a platform list, paints the depth-sorted objects into SVG layers, runs
 * the camera and the vehicles. Framework free: TownScene.tsx wraps it.
 */
import {
  BLUR_F, SOFT_F, ISO_C, ISO_S, P, addMover, baseAdd, bind, box, clay, esc, f1, newCtx, qT, run, setTheta,
  type Ctx, type Plat, type SceneObj,
} from './core';
import { drawVehicle, locate } from './vehicles';
import { buildLinks, connectionsFor, gatePoint, gridFor, route, M, RW, type Connection, type Grid, type PlotInfo, type TownLinkInput } from './links';
import { TYPES } from './plots';
import { AMBER, LIT, P100, P200, P300, P50, P600, themed } from './palette';

export interface LabelTokens {
  ink: string;
  inkMuted: string;
  surface: string;
  border: string;
  focus: string;
  error: string;
  onError: string;
}

interface Layers {
  base: SVGGElement;
  links: SVGGElement;
  glowl: SVGGElement;
  objects: SVGGElement;
  labels: SVGGElement;
}

interface LabelInfo { plot: Plat; i: number; at: [number, number, number]; ox: number; oy: number; delay: number; geom?: { sx: number; sy: number; top: number; w: number } }

const DEFAULT_TOKENS: LabelTokens = {
  ink: 'rgb(23,23,23)', inkMuted: 'rgb(82,82,82)', surface: 'rgb(255,255,252)', border: 'transparent', focus: 'rgb(59,130,246)', error: 'rgb(220,38,38)', onError: 'rgb(255,255,255)',
};

export class Engine {
  readonly ctx: Ctx = newCtx();
  plats: Plat[] = [];
  info: Record<string, PlotInfo> = {};
  conns: Connection[] = [];
  labels: LabelInfo[] = [];
  viewBox = '-930 -210 1860 1260';
  dark = false;
  mode: 'roads' | 'power' = 'roads';
  tokens: LabelTokens = DEFAULT_TOKENS;
  target = 0;
  dragging = false;
  focusId: string | null = null;
  dirty = true;
  private labelK = 1;
  private lastOrder: number[] = [];
  private raf = 0;
  private reduce = false;
  private grid: Grid = gridFor(1);
  /** Called when the camera rotation changed by easing (not drag), so the owner can re-anchor bubbles. */
  onSettle?: () => void;
  onViewBox?: (vb: string) => void;

  constructor(private layers: Layers) {
    this.ctx.objLayer = layers.objects;
    this.reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private enter() { bind(this.ctx); }

  /** Platform plots and roads for a platform list (the HTML's `renderMap`). */
  render(platforms: Plat[], links: readonly TownLinkInput[], mode: 'roads' | 'power' = this.mode) {
    this.enter();
    const c = this.ctx;
    this.plats = platforms;
    this.mode = mode;
    c.objects = []; c.movers = []; c.baseDraws = []; c.glowDraws = []; c.linkDraws = [];
    this.info = {}; this.labels = []; this.lastOrder = [];
    this.layers.objects.replaceChildren();
    c.OX = c.OY = 0; c.cur = null;
    const n = platforms.length, G = gridFor(n), { cols, rows, LX, LY, rx, ry } = G;
    this.grid = G;
    c.CX = LX / 2; c.CY = LY / 2;
    baseAdd(() => {
      let b = box(0, 0, -30, LX, LY, 30, { top: '#FFFFFD', left: '#C9DCF7', right: '#A9C6F0' }, clay(22));
      for (let j = 0; j <= rows; j++) b += qT(0, M, LX - M, ry(j), ry(j) + RW, P100, clay(6));
      for (let k = 0; k <= cols; k++) b += qT(0, rx(k), rx(k) + RW, M, LY - M, P100, clay(6));
      const nearX = (x: number) => { for (let k = 0; k <= cols; k++) if (x > rx(k) - 40 && x < rx(k) + RW + 30) return true; return false; };
      const nearY = (y: number) => { for (let j = 0; j <= rows; j++) if (y > ry(j) - 40 && y < ry(j) + RW + 30) return true; return false; };
      for (let j = 0; j <= rows; j++) for (let x = M + 8; x < LX - M - 22; x += 42) { if (nearX(x)) continue; b += qT(0, x, x + 22, ry(j) + 28.5, ry(j) + 31.5, '#FFFFFF', clay(3)); }
      for (let k = 0; k <= cols; k++) for (let y = M + 8; y < LY - M - 22; y += 42) { if (nearY(y)) continue; b += qT(0, rx(k) + 28.5, rx(k) + 31.5, y, y + 22, '#FFFFFF', clay(3)); }
      for (let k = 0; k <= cols; k++) for (let j = 0; j <= rows; j++) {
        const X = rx(k), Y = ry(j);
        for (let y = Y + 5; y < Y + RW - 4; y += 9) { if (X - 28 > M) b += qT(0, X - 28, X - 6, y, y + 4.5, '#FFFFFF', clay(2.5)); if (X + RW + 28 < LX - M) b += qT(0, X + RW + 6, X + RW + 28, y, y + 4.5, '#FFFFFF', clay(2.5)); }
        for (let x = X + 5; x < X + RW - 4; x += 9) { if (Y - 28 > M) b += qT(0, x, x + 4.5, Y - 28, Y - 6, '#FFFFFF', clay(2.5)); if (Y + RW + 28 < LY - M) b += qT(0, x, x + 4.5, Y + RW + 6, Y + RW + 28, '#FFFFFF', clay(2.5)); }
      }
      return b;
    });
    for (let i = 0; i < cols * rows; i++) {
      const p = platforms[i] || null, T = p ? (TYPES[p.type] || TYPES.office) : TYPES.lot;
      c.OX = rx(i % cols) + RW - T.shift[0]; c.OY = ry(Math.floor(i / cols)) + RW - T.shift[1]; c.cur = p;
      T.build(p || ({ id: 'lot' + i } as Plat));
      if (p) this.info[p.id] = { i, c: i % cols, r: Math.floor(i / cols), ox: c.OX, oy: c.OY, T, p };
      if (p && T.label) this.labels.push({ plot: p, i, at: T.label, ox: c.OX, oy: c.OY, delay: i % 3 });
      c.OX = c.OY = 0; c.cur = null;
    }
    // Traffic: one vehicle per road.
    const models = ['truck', 'car', 'truck', 'car'], colors = ['#E5E5E5', '#F1F5F9', '#CBD5E1', '#E5E5E5', '#F8FAFC'];
    for (let j = 0; j <= rows; j++) {
      const fwd = j % 2 === 0, y = ry(j) + (fwd ? 45 : 15);
      addMover({ model: models[j % 4], path: fwd ? [[M, y], [LX - M, y]] : [[LX - M, y], [M, y]], speed: 55 + (j * 17) % 40, offset: j * 233, color: colors[j % 5] });
    }
    for (let k = 0; k <= cols; k++) {
      const fwd = k % 2 === 1, x = rx(k) + (fwd ? 45 : 15);
      addMover({ model: models[(k + 1) % 4], path: fwd ? [[x, M], [x, LY - M]] : [[x, LY - M], [x, M]], speed: 60 + (k * 23) % 35, offset: k * 311 + 150, color: colors[(k + 2) % 5] });
    }
    // Connections.
    const ids = new Set(Object.keys(this.info));
    this.conns = connectionsFor(links, ids).map((cn, slot) => ({
      ...cn, slot,
      route: route(gatePoint(this.info[cn.from], G), gatePoint(this.info[cn.to], G), G),
      path: [],
    }));
    buildLinks(this.conns, mode, this.info);
    // Camera framing that fits the island at every rotation.
    const R = Math.hypot(LX, LY) / 2 * Math.SQRT2, halfW = R * ISO_C + 60;
    this.labelK = Math.max(1, (2 * halfW) / 2357);
    const top = -R * ISO_S - 150 * this.labelK - 40, bottom = R * ISO_S + 70;
    this.viewBox = `${f1(-halfW)} ${f1(top)} ${f1(2 * halfW)} ${f1(bottom - top)}`;
    this.onViewBox?.(this.viewBox);
    this.dirty = true;
  }

  /** Cell grid of the current map (for tests and layout checks). */
  get gridInfo() { return this.grid; }

  setDark(d: boolean) { if (d !== this.dark) { this.dark = d; this.dirty = true; } }
  setTokens(t: LabelTokens) { this.tokens = t; this.dirty = true; }
  setHilite(id: string | null) { this.enter(); if (this.ctx.hilite !== id) { this.ctx.hilite = id; this.dirty = true; } }
  setFocus(id: string | null) { if (this.focusId !== id) { this.focusId = id; this.dirty = true; } }
  /** Applies controlled light state: ids missing from `lights` keep their status default. */
  setLights(lights: Readonly<Record<string, boolean>>) {
    for (const p of this.plats) {
      const on = lights[p.id];
      if (on !== undefined && on !== p.lights) { p.lights = on; this.dirty = true; }
    }
  }

  setTarget(t: number) { this.target = t; }
  get theta() { return this.ctx.THETA; }
  setThetaNow(t: number) { this.enter(); setTheta(t); this.dirty = true; }

  /** Anchor of a platform's label in svg user units: pill top centre. */
  labelAnchor(id: string): { x: number; y: number } | null {
    this.enter();
    const L = this.labels.find((l) => l.plot.id === id);
    if (!L) return null;
    const g = this.geom(L);
    return { x: g.sx, y: g.sy + (g.top - g.sy) * this.labelK };
  }

  private geom(L: LabelInfo) {
    const c = this.ctx, p = L.plot;
    c.OX = L.ox; c.OY = L.oy;
    const [sx, sy] = P(...L.at);
    c.OX = c.OY = 0;
    const title = esc(p.name), sub = esc(p.sub || '');
    const w = Math.max(196, 106 + Math.max(title.length * 8.2, sub.length * 6.4));
    return (L.geom = { sx, sy, top: sy - 120, w });
  }

  /** Floating label: name pill with the light switch and an alert badge. */
  private label(L: LabelInfo): string {
    const p = L.plot, t = this.tokens, { sx, sy, top, w } = this.geom(L);
    const title = esc(p.name), sub = esc(p.sub || ''), glyph = esc(String(p.badge || p.name.slice(0, 2)).toUpperCase().slice(0, 2));
    const h = 48, on = !!p.lights, bx = sx + w / 2 - 26, by = top + 24;
    const alert = p.alerts > 0
      ? `<circle cx="${f1(sx + w / 2 - 4)}" cy="${f1(top + 2)}" r="10" fill="${t.error}" stroke="${t.surface}" stroke-width="2"/>
    <text x="${f1(sx + w / 2 - 4)}" y="${f1(top + 6)}" text-anchor="middle" font-size="11" font-weight="700" fill="${t.onError}">${p.alerts > 9 ? '9+' : p.alerts}</text>`
      : '';
    return `<g transform="translate(${f1(sx)} ${f1(sy)}) scale(${this.labelK.toFixed(3)}) translate(${f1(-sx)} ${f1(-sy)})">
   <g class="label bob-${L.delay}${this.focusId === p.id ? ' is-focus' : ''}" data-id="${esc(p.id)}">
    <line x1="${f1(sx)}" y1="${f1(top + h)}" x2="${f1(sx)}" y2="${f1(sy - 4)}" stroke="${P300}" stroke-width="1.5" stroke-dasharray="3 4"/>
    <circle cx="${f1(sx)}" cy="${f1(sy)}" r="4" fill="${on ? AMBER : P600}" stroke="#fff" stroke-width="2"/>
    <rect class="pill" x="${f1(sx - w / 2)}" y="${f1(top)}" width="${f1(w)}" height="${h}" rx="24" fill="${t.surface}" stroke="transparent" stroke-width="1.5" filter="${SOFT_F}"/>
    <circle cx="${f1(sx - w / 2 + 24)}" cy="${f1(top + 24)}" r="15" fill="${P50}" stroke="${P200}"/>
    <text x="${f1(sx - w / 2 + 24)}" y="${f1(top + 29)}" text-anchor="middle" font-size="12" font-weight="700" fill="${P600}">${glyph}</text>
    <text x="${f1(sx - w / 2 + 48)}" y="${f1(top + 21)}" font-size="14" font-weight="700" fill="${t.ink}">${title}</text>
    <text x="${f1(sx - w / 2 + 48)}" y="${f1(top + 37)}" font-size="11.5" font-weight="500" fill="${t.inkMuted}">${sub}</text>
    <circle cx="${f1(bx)}" cy="${f1(by)}" r="15" fill="${on ? '#FEF3C7' : '#F1F5F9'}"/>
    ${on ? `<circle cx="${f1(bx)}" cy="${f1(by - 2)}" r="9" fill="${LIT}" opacity=".6" filter="${BLUR_F}"/>` : ''}
    <circle cx="${f1(bx)}" cy="${f1(by - 2.5)}" r="5.5" fill="${on ? '#F59E0B' : '#CBD5E1'}"/>
    <rect x="${f1(bx - 2.6)}" y="${f1(by + 2.5)}" width="5.2" height="4" rx="1.2" fill="${on ? '#B45309' : '#94A3B8'}"/>
    ${alert}
   </g></g>`;
  }

  private themed = (s: string) => themed(s, this.dark);

  private redrawStatic() {
    this.enter();
    const c = this.ctx, L = this.layers;
    L.base.innerHTML = this.themed(c.baseDraws.map(run).join(''));
    L.glowl.innerHTML = c.glowDraws.map(run).join('');
    for (const o of c.objects) if (o.fn) o.g.innerHTML = this.themed(run({ ox: o.ox, oy: o.oy, plot: o.plot, fn: o.fn }));
    L.links.innerHTML = this.themed(c.linkDraws.map(run).join(''));
    // Labels use the live tokens (ink, surface), so they skip the dark remap.
    L.labels.innerHTML = this.labels.map((l) => this.label(l)).join('');
    this.lastOrder = [];
  }

  /* ---------- depth sort (isometric painter's order, camera-aware) ---------- */
  private behind(a: SceneObj, b: SceneObj) {
    const CAM = this.ctx.CAM;
    return (CAM.x > 0 ? a.fp[1] <= b.fp[0] + 0.01 : a.fp[0] >= b.fp[1] - 0.01) || (CAM.y > 0 ? a.fp[3] <= b.fp[2] + 0.01 : a.fp[2] >= b.fp[3] - 0.01);
  }
  sortObjects() {
    const objects = this.ctx.objects, CAM = this.ctx.CAM, n = objects.length, indeg = new Array<number>(n).fill(0), adj: number[][] = objects.map(() => []);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (this.behind(objects[i], objects[j]) && !this.behind(objects[j], objects[i])) { adj[i].push(j); indeg[j]++; }
    }
    const key = (o: SceneObj) => (o.fp[0] + o.fp[1]) * CAM.x + (o.fp[2] + o.fp[3]) * CAM.y;
    const ready: number[] = [], out: number[] = [];
    for (let i = 0; i < n; i++) if (!indeg[i]) ready.push(i);
    while (out.length < n) {
      if (!ready.length) { let m = -1; for (let i = 0; i < n; i++) if (indeg[i] > 0 && (m < 0 || key(objects[i]) < key(objects[m]))) m = i; indeg[m] = 0; ready.push(m); }
      ready.sort((p, q) => key(objects[p]) - key(objects[q]));
      const i = ready.shift()!;
      if (indeg[i] === -1) continue;
      indeg[i] = -1; out.push(i);
      for (const j of adj[i]) if (indeg[j] > 0 && --indeg[j] === 0) ready.push(j);
    }
    if (out.join() !== this.lastOrder.join()) { out.forEach((i) => this.layers.objects.appendChild(objects[i].g)); this.lastOrder = out; }
  }

  /** One animation frame at time `ms`: camera easing, redraw if dirty, vehicles, depth sort. */
  frame(ms: number) {
    this.enter();
    const c = this.ctx;
    let moved = false;
    if (!this.dragging && Math.abs(this.target - c.THETA) > 1e-4) {
      setTheta(Math.abs(this.target - c.THETA) < 0.002 ? this.target : c.THETA + (this.target - c.THETA) * 0.14);
      this.dirty = true; moved = true;
    }
    const wasDirty = this.dirty;
    if (this.dirty) { this.redrawStatic(); this.dirty = false; }
    if (!this.reduce || wasDirty || moved) {
      const t = this.reduce ? 6 : ms / 1000;
      for (const m of c.movers) {
        const p = locate(m, t);
        const v = drawVehicle(m.model, p.x, p.y, p.dir, { color: m.color, load: m.model === 'forklift' && !p.back });
        m.o.fp = v.fp; m.o.g.innerHTML = this.themed(v.svg);
        m.o.g.setAttribute('opacity', (p.op * (m.conn && c.hilite && c.hilite !== m.conn ? 0.15 : 1)).toFixed(2));
      }
      this.sortObjects();
    }
    if (moved && Math.abs(this.target - c.THETA) < 1e-4) this.onSettle?.();
  }

  start() {
    const loop = (ms: number) => { this.frame(ms); this.raf = requestAnimationFrame(loop); };
    this.raf = requestAnimationFrame(loop);
  }
  stop() { cancelAnimationFrame(this.raf); }
}

