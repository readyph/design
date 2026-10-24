/**
 * PROTOTYPE (RDY-224) - projection and SVG primitives of the Lab platform map.
 *
 * One projection function `P(x, y, z)` turns plot coordinates into screen coordinates for
 * the current camera rotation. Every builder returns SVG strings (flat "clay" look: no
 * outlines, each shape is stroked in its own fill colour with round joins) which the engine
 * paints back to front. State lives in a context object; each engine binds its own context
 * before it draws, so several scenes can share one page.
 */
import { shade, type Tone } from './palette';

export type Vec3 = [number, number, number];
export type Footprint = [number, number, number, number];

export interface Plat {
  id: string;
  type: string;
  name: string;
  sub: string;
  badge: string;
  lights: boolean;
  alerts: number;
  status: string;
  color?: string;
}

export interface DrawItem {
  ox: number;
  oy: number;
  plot: Plat | null;
  fn: () => string;
}

export interface SceneObj {
  fp: Footprint;
  ox: number;
  oy: number;
  plot: Plat | null;
  fn: (() => string) | null;
  g: SVGGElement;
}

export interface Mover {
  model: string;
  path: [number, number][];
  speed: number;
  offset: number;
  pingpong?: boolean;
  pause?: number;
  color?: string;
  conn?: string;
  o: SceneObj;
  L?: number;
  seg?: number[];
}

export interface Ctx {
  OX: number;
  OY: number;
  CX: number;
  CY: number;
  THETA: number;
  ROT: { c: number; s: number };
  CAM: { x: number; y: number };
  CW: number;
  cur: Plat | null;
  objects: SceneObj[];
  movers: Mover[];
  baseDraws: DrawItem[];
  glowDraws: DrawItem[];
  linkDraws: DrawItem[];
  objLayer: SVGGElement | null;
  hilite: string | null;
}

export function newCtx(): Ctx {
  return {
    OX: 0, OY: 0, CX: 0, CY: 0, THETA: 0, ROT: { c: 1, s: 0 }, CAM: { x: 1, y: 1 }, CW: 5, cur: null,
    objects: [], movers: [], baseDraws: [], glowDraws: [], linkDraws: [], objLayer: null, hilite: null,
  };
}

/** Context of the engine that is drawing right now. */
export let S: Ctx = newCtx();
export const bind = (c: Ctx) => { S = c; };

export const SVG_NS = 'http://www.w3.org/2000/svg';
/** Filter / gradient ids defined once in the scene's <defs>. */
export const GLOW_F = 'url(#rph-glow)', BLUR_F = 'url(#rph-blur8)', SOFT_F = 'url(#rph-soft)', POOL_F = 'url(#rph-pool)';

export function setTheta(t: number) {
  S.THETA = t;
  S.ROT = { c: Math.cos(t), s: Math.sin(t) };
  S.CAM = { x: S.ROT.c + S.ROT.s, y: S.ROT.c - S.ROT.s };
}

/** Iso projection: x runs right-down, y left-down, z up. */
export const ISO_C = Math.cos(Math.PI / 6), ISO_S = 0.5;
export const P = (x: number, y: number, z = 0): [number, number] => {
  x += S.OX - S.CX; y += S.OY - S.CY;
  const xr = x * S.ROT.c - y * S.ROT.s, yr = x * S.ROT.s + y * S.ROT.c;
  return [(xr - yr) * ISO_C, (xr + yr) * ISO_S - z];
};
export const f1 = (n: number) => Math.round(n * 10) / 10;
export const f3 = (n: number) => Math.round(n * 1000) / 1000;
export const num = (a: number, b: number) => a - b;
const pts = (a: Vec3[]) => a.map((p) => { const q = P(...p); return f1(q[0]) + ',' + f1(q[1]); }).join(' ');

/** Is a face with normal sign `n` on an axis facing the camera? */
export const vis = (n: number, comp: number) => n * comp > 1e-6;
export const SX = () => (S.CAM.x > 0 ? 1 : -1);
export const SY = () => (S.CAM.y > 0 ? 1 : -1);
const screenSide = (nx: number, ny: number) => (nx * S.ROT.c - ny * S.ROT.s) - (nx * S.ROT.s + ny * S.ROT.c);
export const faceTone = (nx: number, ny: number, c: { left: string; right: string }) => (screenSide(nx, ny) < 0 ? c.left : c.right);

export const EDGE = '__clay__';
const CLAY_K = 1.9;
export const clay = (w: number) => '__clay:' + w;
export const NOE = 'stroke="none"';

export const poly = (a: Vec3[], fill: string, extra: string = EDGE): string => {
  let e = extra;
  if (extra === EDGE || extra.startsWith('__clay:')) {
    const w = (extra === EDGE ? S.CW : +extra.slice(7)) * CLAY_K;
    e = `stroke="${fill}" stroke-width="${w}" stroke-linejoin="round"`;
  }
  return `<polygon points="${pts(a)}" fill="${fill}" ${e}/>`;
};
export const withCW = <T,>(w: number, fn: () => T): T => {
  const prev = S.CW;
  S.CW = w;
  try { return fn(); } finally { S.CW = prev; }
};

type Walls = { left: string; right: string; top?: string };

/** The two camera-facing vertical faces of an axis-aligned block. */
export function walls(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: Walls, e: string = EDGE) {
  const sx = SX(), sy = SY(), fx = sx > 0 ? x1 : x0, fy = sy > 0 ? y1 : y0;
  return poly([[fx, y0, z0], [fx, y1, z0], [fx, y1, z1], [fx, y0, z1]], faceTone(sx, 0, c), e)
    + poly([[x0, fy, z0], [x1, fy, z0], [x1, fy, z1], [x0, fy, z1]], faceTone(0, sy, c), e);
}
export function box(x: number, y: number, z: number, w: number, d: number, h: number, c: Tone, e: string = EDGE) {
  return walls(x, x + w, y, y + d, z, z + h, c, e) + poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], c.top, e);
}
/** Decals on a vertical plane; n = which way the face points (+1 / -1). Hidden when facing away. */
export const qL = (y: number, x0: number, x1: number, z0: number, z1: number, f: string, e: string = EDGE, n = 1) =>
  vis(n, S.CAM.y) ? poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], f, e) : '';
export const qR = (x: number, y0: number, y1: number, z0: number, z1: number, f: string, e: string = EDGE, n = 1) =>
  vis(n, S.CAM.x) ? poly([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]], f, e) : '';
export const qT = (z: number, x0: number, x1: number, y0: number, y1: number, f: string, e: string = EDGE) =>
  poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], f, e);

export function line(a: Vec3, b: Vec3, stroke: string, w = 1, extra = '') {
  const p = P(...a), q = P(...b);
  return `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
}

export function textPlane(axis: 'x' | 'y', n: number, s: string, x: number, y: number, z: number, size: number, fill: string, weight = 700, ls = 0, extra = '') {
  if (!vis(n, axis === 'y' ? S.CAM.y : S.CAM.x)) return '';
  const p0 = P(x, y, z), p1 = axis === 'y' ? P(x + 1, y, z) : P(x, y + 1, z);
  let ax = p1[0] - p0[0], ay = p1[1] - p0[1];
  if (ax < 0) { ax = -ax; ay = -ay; }
  return `<text transform="matrix(${f3(ax)},${f3(ay)},0,1,${f1(p0[0])},${f1(p0[1])})" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="middle" letter-spacing="${ls}" font-family="Nunito, Inter, sans-serif" ${extra}>${s}</text>`;
}
export const textL = (s: string, x: number, y: number, z: number, size: number, fill: string, w?: number, ls?: number, ex?: string) => textPlane('y', 1, s, x, y, z, size, fill, w, ls, ex);
export const textR = (s: string, x: number, y: number, z: number, size: number, fill: string, w?: number, ls?: number, ex?: string) => textPlane('x', 1, s, x, y, z, size, fill, w, ls, ex);

export function ellT(x: number, y: number, z: number, r: number, fill: string, extra = '') {
  const [sx, sy] = P(x, y, z);
  return `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(r * 1.2247)}" ry="${f1(r * 0.7071)}" fill="${fill}" ${extra}/>`;
}
export function circV(plane: { axis: 'x' | 'y'; at: number }, u: number, v: number, r: number, fill: string, e: string = NOE) {
  const a: Vec3[] = [];
  for (let i = 0; i < 18; i++) {
    const t = (i / 18) * Math.PI * 2, du = r * Math.cos(t), dv = r * Math.sin(t);
    a.push(plane.axis === 'y' ? [u + du, plane.at, v + dv] : [plane.at, u + du, v + dv]);
  }
  return poly(a, fill, e);
}
/** Paints a list of [x, y, svgString] back to front for the current camera. */
export const sorted = (items: [number, number, string][]) =>
  items.sort((a, b) => (a[0] * S.CAM.x + a[1] * S.CAM.y) - (b[0] * S.CAM.x + b[1] * S.CAM.y)).map((i) => i[2]).join('');

export { shade };

// ------------------------------------------------------------------ lights

export const isLit = () => !!(S.cur && S.cur.lights);
export const glow = (str: string) => (str && isLit() ? `<g filter="${GLOW_F}">${str}</g>` : str);
export const lit = (on: string, off: string) => (isLit() ? on : off);

// ------------------------------------------------------------------ scene registry

export const esc = (s: unknown) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
export const hash = (s: string) => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };

/** Registers a depth-sorted object by footprint [x0, x1, y0, y1] in plot coordinates. */
export function obj(fp: Footprint, fn: (() => string) | null): SceneObj {
  const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
  const o: SceneObj = { fp: [fp[0] + S.OX, fp[1] + S.OX, fp[2] + S.OY, fp[3] + S.OY], ox: S.OX, oy: S.OY, plot: S.cur, fn, g };
  if (S.cur) { g.classList.add('plot-obj'); g.setAttribute('data-id', S.cur.id); }
  S.objects.push(o);
  S.objLayer?.appendChild(g);
  return o;
}
export const baseAdd = (fn: () => string) => { S.baseDraws.push({ ox: S.OX, oy: S.OY, plot: S.cur, fn }); };
export const glowAdd = (fn: () => string) => { S.glowDraws.push({ ox: S.OX, oy: S.OY, plot: S.cur, fn }); };
/** Runs a draw item with its own plot offset and plot (lights). */
export function run(d: DrawItem): string {
  S.OX = d.ox; S.OY = d.oy; S.cur = d.plot;
  const s = d.fn();
  S.OX = S.OY = 0; S.cur = null;
  return s;
}
export const shadow = (x0: number, x1: number, y0: number, y1: number, o = 22) =>
  poly([[x0 + o, y0, 0], [x1 + o, y0, 0], [x1 + o, y1 - o * 0.4, 0], [x1, y1, 0], [x0 + o, y1, 0]], 'rgba(30,58,138,.07)', NOE);

export function addMover(m: Omit<Mover, 'o'>) {
  const path = m.path.map(([x, y]) => [x + S.OX, y + S.OY] as [number, number]);
  const sx = S.OX, sy = S.OY, sc = S.cur;
  S.OX = S.OY = 0; S.cur = null;
  const o = obj([0, 0, 0, 0], null);
  S.OX = sx; S.OY = sy; S.cur = sc;
  S.movers.push({ ...m, path, o });
}
