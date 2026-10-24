/** PROTOTYPE (RDY-224) - vehicles: truck, vans, car, forklift; drawn as boxes with decals and wheels. */
import { S, box, circV, clay, num, obj, poly, qT, withCW, type Footprint, type Mover } from './core';
import { AMBER, P100, P200, P300, P500, P600, P800, P900, WHITE, shade, tone, type Tone } from './palette';
import { BOX_W } from './props';

type Dir = '+x' | '-x' | '+y' | '-y';
const DIRS: Record<Dir, { f: [number, number]; s: [number, number] }> = {
  '+x': { f: [1, 0], s: [0, 1] }, '-x': { f: [-1, 0], s: [0, -1] }, '+y': { f: [0, 1], s: [-1, 0] }, '-y': { f: [0, -1], s: [1, 0] },
};
type BB = [number, number, number, number];

function bbOf(cx: number, cy: number, dir: Dir, a0: number, a1: number, c0: number, c1: number): BB {
  const { f, s } = DIRS[dir], xs: number[] = [], ys: number[] = [];
  for (const a of [a0, a1]) for (const c of [c0, c1]) { xs.push(cx + f[0] * a + s[0] * c); ys.push(cy + f[1] * a + s[1] * c); }
  return [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
}
const alongX = (d: Dir) => d[1] === 'x';
type Plane = { axis: 'x' | 'y'; at: number };
function sidePlane(dir: Dir, bb: BB, off = 1): Plane {
  if (alongX(dir)) return { axis: 'y', at: S.CAM.y > 0 ? bb[3] + off : bb[2] - off };
  return { axis: 'x', at: S.CAM.x > 0 ? bb[1] + off : bb[0] - off };
}
function quadOn(pl: Plane, u0: number, u1: number, z0: number, z1: number, fill: string) {
  return pl.axis === 'y'
    ? poly([[u0, pl.at, z0], [u1, pl.at, z0], [u1, pl.at, z1], [u0, pl.at, z1]], fill, clay(2.5))
    : poly([[pl.at, u0, z0], [pl.at, u1, z0], [pl.at, u1, z1], [pl.at, u0, z1]], fill, clay(2.5));
}
function sideQuad(cx: number, cy: number, dir: Dir, bb: BB, a0: number, a1: number, z0: number, z1: number, fill: string) {
  const { f } = DIRS[dir], pl = sidePlane(dir, bb);
  const u = (alongX(dir) ? [cx + f[0] * a0, cx + f[0] * a1] : [cy + f[1] * a0, cy + f[1] * a1]).sort(num);
  return quadOn(pl, u[0] + 1, u[1] - 1, z0 + 1, z1 - 1, fill);
}
function endQuad(cx: number, cy: number, dir: Dir, bb: BB, end: 'front' | 'rear', c0: number, c1: number, z0: number, z1: number, fill: string) {
  const { f, s } = DIRS[dir], k = end === 'front' ? 1 : -1, fx = f[0] * k, fy = f[1] * k;
  if (fx * S.CAM.x + fy * S.CAM.y <= 0) return '';
  if (alongX(dir)) {
    const u = [cy + s[1] * c0, cy + s[1] * c1].sort(num);
    return quadOn({ axis: 'x', at: fx > 0 ? bb[1] + 1 : bb[0] - 1 }, u[0] + 1, u[1] - 1, z0 + 1, z1 - 1, fill);
  }
  const u = [cx + s[0] * c0, cx + s[0] * c1].sort(num);
  return quadOn({ axis: 'y', at: fy > 0 ? bb[3] + 1 : bb[2] - 1 }, u[0] + 1, u[1] - 1, z0 + 1, z1 - 1, fill);
}

type Quad = [number, number, number, number, string];
interface Part {
  a: [number, number];
  c: [number, number];
  z: [number, number];
  tone: Tone | null;
  side?: Quad[];
  front?: Quad[];
  rear?: Quad[];
}
interface Model { r: number; wheels: number[]; parts: Part[] }

const MODELS: Record<string, Model> = {
  truck: { r: 6.5, wheels: [-42, -26, 38], parts: [
    { a: [-56, 20], c: [-13, 13], z: [7, 50], tone: WHITE, side: [[-50, 14, 18, 24, P500]], rear: [[-11, 11, 10, 47, '#E3ECF8']] },
    { a: [22, 56], c: [-12, 12], z: [7, 36], tone: tone(P600), side: [[32, 48, 22, 32, P200]], front: [[-10, 10, 22, 33, P200], [-10, 10, 10, 14, P300]] } ] },
  van: { r: 5.5, wheels: [-18, 20], parts: [
    { a: [-30, 16], c: [-12, 12], z: [5, 33], tone: WHITE, side: [[2, 14, 20, 30, P200], [-28, 14, 12, 16, P600]], front: [[-10, 10, 21, 31, P200]], rear: [[-10, 10, 20, 30, P200]] },
    { a: [16, 30], c: [-12, 12], z: [5, 20], tone: WHITE, side: [[16, 28, 12, 16, P600]], front: [[-9, 9, 10, 13, P300]] } ] },
  cvan: { r: 5.5, wheels: [-18, 20], parts: [
    { a: [-30, 16], c: [-12, 12], z: [5, 33], tone: null, side: [[2, 14, 20, 30, P100], [-27, -1, 12, 26, '#FFFFFF']], front: [[-10, 10, 21, 31, P100]], rear: [[-10, 10, 12, 30, '#FFFFFF']] },
    { a: [16, 30], c: [-12, 12], z: [5, 20], tone: null, front: [[-9, 9, 10, 13, '#FFFFFF']] } ] },
  car: { r: 4.5, wheels: [-13, 13], parts: [
    { a: [-22, 22], c: [-11, 11], z: [3, 13], tone: null },
    { a: [-12, 8], c: [-10, 10], z: [13, 22], tone: null, side: [[-10, 6, 15, 21, P100]], front: [[-8, 8, 15, 21, P100]], rear: [[-8, 8, 15, 21, P100]] } ] },
  forklift: { r: 3.6, wheels: [-6, 5], parts: [
    { a: [-9, 6], c: [-7, 7], z: [2, 13], tone: tone(AMBER, 0.35, -0.18), side: [[-7, 4, 8, 11, P900]] },
    { a: [-7, -5], c: [-7, -5], z: [13, 26], tone: tone(P800) }, { a: [-7, -5], c: [5, 7], z: [13, 26], tone: tone(P800) },
    { a: [2, 4], c: [-7, -5], z: [13, 26], tone: tone(P800) }, { a: [2, 4], c: [5, 7], z: [13, 26], tone: tone(P800) },
    { a: [-8, 5], c: [-7, 7], z: [26, 28], tone: tone(P800) },
    { a: [7, 9], c: [-6, 6], z: [0, 32], tone: tone(P900, 0.3, -0.1) },
    { a: [9, 21], c: [-5, 5], z: [1, 2.5], tone: tone(P900, 0.3, -0.1) } ] },
};

export function drawVehicle(model: string, cx: number, cy: number, dir: Dir, opts: { color?: string; load?: boolean } = {}): { svg: string; fp: Footprint } {
  return withCW(3.5, () => {
    const M = MODELS[model];
    let s = '';
    let all: BB = [1e9, -1e9, 1e9, -1e9];
    const extra: Part[] = opts.load ? [{ a: [9, 21], c: [-6, 6], z: [2.5, 16], tone: BOX_W }] : [];
    const parts = M.parts.concat(extra)
      .map((p) => {
        const bb = bbOf(cx, cy, dir, p.a[0], p.a[1], p.c[0], p.c[1]);
        all = [Math.min(all[0], bb[0]), Math.max(all[1], bb[1]), Math.min(all[2], bb[2]), Math.max(all[3], bb[3])];
        return { ...p, bb };
      })
      .sort((p, q) => Number(p.z[0] > 12) - Number(q.z[0] > 12) || ((p.bb[0] + p.bb[1]) * S.CAM.x + (p.bb[2] + p.bb[3]) * S.CAM.y) - ((q.bb[0] + q.bb[1]) * S.CAM.x + (q.bb[2] + q.bb[3]) * S.CAM.y));
    s += qT(0, all[0] - 1, all[1] + 4, all[2] - 1, all[3] + 4, 'rgba(30,58,138,.10)', 'stroke="rgba(30,58,138,.10)" stroke-width="6" stroke-linejoin="round"');
    const color = opts.color ?? P500;
    for (const p of parts) {
      const bb = p.bb, t = p.tone || (p.z[0] >= 13 ? tone(shade(color, 0.25)) : tone(color));
      s += box(bb[0], bb[2], p.z[0], bb[1] - bb[0], bb[3] - bb[2], p.z[1] - p.z[0], t);
      for (const q of p.side || []) s += sideQuad(cx, cy, dir, bb, q[0], q[1], q[2], q[3], q[4]);
      for (const q of p.front || []) s += endQuad(cx, cy, dir, bb, 'front', q[0], q[1], q[2], q[3], q[4]);
      for (const q of p.rear || []) s += endQuad(cx, cy, dir, bb, 'rear', q[0], q[1], q[2], q[3], q[4]);
    }
    const { f } = DIRS[dir], pl = sidePlane(dir, all, 0.3);
    for (const a of M.wheels) {
      const u = alongX(dir) ? cx + f[0] * a : cy + f[1] * a;
      s += circV(pl, u, M.r, M.r, '#26355F', clay(2.5)) + circV(pl, u, M.r, M.r * 0.4, '#C9D3E3', clay(1.5));
    }
    return { svg: s, fp: all };
  });
}

export function staticVehicle(model: string, cx: number, cy: number, dir: Dir, opts?: { color?: string; load?: boolean }) {
  const fp = drawVehicle(model, cx, cy, dir, opts).fp;
  obj(fp, () => drawVehicle(model, cx, cy, dir, opts).svg);
}

/** Position, heading and opacity of a mover at time t (seconds). */
export function locate(m: Mover, t: number): { x: number; y: number; dir: Dir; op: number; back: boolean } {
  const path = m.path;
  if (!m.L || !m.seg) {
    m.seg = [];
    m.L = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const l = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]);
      m.seg.push(l);
      m.L += l;
    }
  }
  const L = m.L, seg = m.seg;
  let d: number, back = false;
  if (m.pingpong) {
    const pause = m.pause ?? 0, leg = L / m.speed, cyc = 2 * (leg + pause), u = (t + m.offset) % cyc;
    if (u < pause) d = 0;
    else if (u < pause + leg) d = (u - pause) * m.speed;
    else if (u < 2 * pause + leg) d = L;
    else { d = L - (u - 2 * pause - leg) * m.speed; back = true; }
  } else d = (t * m.speed + m.offset) % L;
  let i = 0, r = d;
  while (i < seg.length - 1 && r > seg[i]) { r -= seg[i]; i++; }
  const a = path[i], b = path[i + 1], k = seg[i] ? Math.min(1, r / seg[i]) : 0;
  const x = a[0] + (b[0] - a[0]) * k, y = a[1] + (b[1] - a[1]) * k;
  let dx = b[0] - a[0], dy = b[1] - a[1];
  if (back) { dx = -dx; dy = -dy; }
  const dir: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? '+x' : '-x') : (dy > 0 ? '+y' : '-y');
  const op = m.pingpong ? 1 : Math.max(0, Math.min(1, d / 45, (L - d) / 45));
  return { x, y, dir, op, back };
}
export type { Dir };
