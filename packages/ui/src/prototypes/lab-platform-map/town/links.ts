/**
 * PROTOTYPE (RDY-224) - connections between platforms: Manhattan routes along the road centre
 * lines from yard gate to yard gate, drawn as colour-coded glowing lines with delivery vans
 * ('roads' mode) or as power poles with wires ('power' mode).
 */
import { P, S, addMover, ellT, f1, line, obj, type Plat } from './core';
import { LINK_COLORS } from './palette';
import type { PlotType } from './plots';

export const PLOT = 520, RW = 60, M = 30;

export interface Grid {
  cols: number;
  rows: number;
  rx: (k: number) => number;
  ry: (k: number) => number;
  LX: number;
  LY: number;
}
export interface PlotInfo {
  i: number;
  c: number;
  r: number;
  ox: number;
  oy: number;
  T: PlotType;
  p: Plat;
}
export interface TownLinkInput {
  from: string;
  to: string;
}
export interface Connection {
  id: string;
  from: string;
  to: string;
  color: string;
  slot: number;
  route: [number, number][];
  path: [number, number][];
  poles?: Pole[];
}
interface Pole { x: number; y: number; conns: Connection[] }

export const gridFor = (n: number): Grid => {
  const cols = Math.max(1, Math.ceil(Math.sqrt(n))), rows = Math.max(1, Math.ceil(n / cols));
  const LX = 2 * M + (cols + 1) * RW + cols * PLOT, LY = 2 * M + (rows + 1) * RW + rows * PLOT;
  return { cols, rows, LX, LY, rx: (k) => M + k * (PLOT + RW), ry: (k) => M + k * (PLOT + RW) };
};

/** One connection per platform pair (reversed duplicates and self links dropped), colour by position. */
export function connectionsFor(links: readonly TownLinkInput[], ids: ReadonlySet<string>): { id: string; from: string; to: string; color: string }[] {
  const seen = new Set<string>(), out: { id: string; from: string; to: string; color: string }[] = [];
  for (const l of links) {
    if (l.from === l.to) continue;
    const key = [l.from, l.to].sort().join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: l.from + '~' + l.to, from: l.from, to: l.to, color: LINK_COLORS[(out.length) % LINK_COLORS.length] });
  }
  return out.filter((c) => ids.has(c.from) && ids.has(c.to));
}

type Gate = { axis: 'v'; k: number; y: number } | { axis: 'h'; j: number; x: number };

/** Where a plot's yard meets its road. */
export function gatePoint(info: Pick<PlotInfo, 'c' | 'r' | 'T'>, G: Grid): Gate {
  const T = info.T;
  if (T.face === 'x') return { axis: 'v', k: info.c + 1, y: G.ry(info.r) + RW + (T.gate ?? 0) };
  return { axis: 'h', j: info.r + 1, x: G.rx(info.c) + RW + (T.gate ?? 0) };
}

/** Manhattan route along road centre lines between two gates. */
export function route(A: Gate, B: Gate, G: Grid): [number, number][] {
  const hy = (j: number) => G.ry(j) + RW / 2, vx = (k: number) => G.rx(k) + RW / 2;
  const pick = (n: number, f: (i: number) => number) => { let best = 0, bc = Infinity; for (let i = 0; i <= n; i++) { const c = f(i); if (c < bc - 1e-6) { bc = c; best = i; } } return best; };
  let pts: [number, number][];
  if (A.axis === 'h' && B.axis === 'h') {
    if (A.j === B.j) pts = [[A.x, hy(A.j)], [B.x, hy(B.j)]];
    else {
      const k = pick(G.cols, (k) => Math.abs(A.x - vx(k)) + Math.abs(vx(k) - B.x) + Math.abs(A.x - vx(k)) * 1e-3);
      pts = [[A.x, hy(A.j)], [vx(k), hy(A.j)], [vx(k), hy(B.j)], [B.x, hy(B.j)]];
    }
  } else if (A.axis === 'v' && B.axis === 'v') {
    if (A.k === B.k) pts = [[vx(A.k), A.y], [vx(B.k), B.y]];
    else {
      const j = pick(G.rows, (j) => Math.abs(A.y - hy(j)) + Math.abs(hy(j) - B.y) + Math.abs(A.y - hy(j)) * 1e-3);
      pts = [[vx(A.k), A.y], [vx(A.k), hy(j)], [vx(B.k), hy(j)], [vx(B.k), B.y]];
    }
  } else if (A.axis === 'h' && B.axis === 'v') pts = [[A.x, hy(A.j)], [vx(B.k), hy(A.j)], [vx(B.k), B.y]];
  else if (A.axis === 'v' && B.axis === 'h') pts = [[vx(A.k), A.y], [vx(A.k), hy(B.j)], [B.x, hy(B.j)]];
  else pts = [];
  return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.5);
}

const dimOf = (c: { id: string }) => (S.hilite && S.hilite !== c.id ? 0.15 : 1);

export function buildLinks(conns: Connection[], mode: 'roads' | 'power', info: Record<string, PlotInfo>) {
  if (mode === 'roads') buildRoadLinks(conns);
  else buildPowerLinks(conns, info);
}

/* ---- roads: colour-coded delivery vans riding glowing lines painted on the roads ---- */
function buildRoadLinks(conns: Connection[]) {
  const N = conns.length;
  conns.forEach((c) => {
    const o = N > 1 ? (c.slot - (N - 1) / 2) * Math.min(8, 40 / (N - 1)) : 0; // side-by-side lanes when routes overlap
    c.path = c.route.map(([x, y]) => [x + o, y + o] as [number, number]);
    addMover({ model: 'cvan', path: c.path, speed: 72, offset: c.slot * 2.7, pingpong: true, pause: 1.6, color: c.color, conn: c.id });
  });
  S.linkDraws.push({ ox: 0, oy: 0, plot: null, fn: () => conns.map((c) => {
    const pts = c.path.map(([x, y]) => P(x, y, 0.5).map(f1).join(',')).join(' ');
    const ends = [c.path[0], c.path[c.path.length - 1]].map(([x, y]) => ellT(x, y, 0.5, 10, c.color) + ellT(x, y, 0.6, 4.5, '#fff')).join('');
    return `<g opacity="${dimOf(c)}">
      <polyline points="${pts}" fill="none" stroke="${c.color}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round" opacity=".8"/>
      <polyline class="flow-a" points="${pts}" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline class="flow-b" points="${pts}" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
      ${ends}</g>`;
  }).join('') });
}

/* ---- power: poles along the roadside with colour-coded wires ---- */
const POLE_TOP = 90, wireZ = (c: Connection) => 84 - (c.slot % 6) * 7;
function wire(a: [number, number, number], b: [number, number, number], c: Connection) {
  const A = P(...a), B = P(...b), len = Math.hypot(B[0] - A[0], B[1] - A[1]), sag = 3 + len * 0.07;
  const d = `M${f1(A[0])},${f1(A[1])} Q${f1((A[0] + B[0]) / 2)},${f1((A[1] + B[1]) / 2 + sag * 2)} ${f1(B[0])},${f1(B[1])}`;
  return `<g opacity="${dimOf(c)}"><path d="${d}" fill="none" stroke="${c.color}" stroke-width="3.4" stroke-linecap="round"/>
    <path class="flow-a" d="${d}" fill="none" stroke="#FFF7D6" stroke-width="2.4" stroke-linecap="round"/>
    <path class="flow-b" d="${d}" fill="none" stroke="#FFF7D6" stroke-width="2.4" stroke-linecap="round" opacity=".7"/></g>`;
}
function drawPole(p: Pole) {
  const [tx, ty] = P(p.x, p.y, POLE_TOP);
  let s = ellT(p.x + 4, p.y + 2, 0, 6, 'rgba(30,58,138,.12)') + line([p.x, p.y, 0], [p.x, p.y, POLE_TOP], '#8A9BB4', 7);
  for (const c of p.conns) { const [sx, sy] = P(p.x, p.y, wireZ(c)); s += `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="3.6" fill="${c.color}" opacity="${dimOf(c)}"/>`; }
  return s + `<circle cx="${f1(tx)}" cy="${f1(ty)}" r="4.2" fill="#A9B8CD"/>`;
}
function buildPowerLinks(conns: Connection[], info: Record<string, PlotInfo>) {
  const V = -36, SP = 130, poles = new Map<string, Pole>();
  const addPole = (x: number, y: number, c: Connection) => {
    const k = Math.round(x) + ',' + Math.round(y);
    let p = poles.get(k);
    if (!p) { p = { x, y, conns: [] }; poles.set(k, p); }
    if (!p.conns.includes(c)) p.conns.push(c);
    return p;
  };
  conns.forEach((c) => {
    const path = c.route.map(([x, y]) => [x + V, y + V] as [number, number]), seq: [number, number][] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const [x1, y1] = path[i], [x2, y2] = path[i + 1];
      seq.push([x1, y1]);
      const horiz = Math.abs(y2 - y1) < 0.5, a = horiz ? x1 : y1, b = horiz ? x2 : y2, dir = Math.sign(b - a);
      const first = dir > 0 ? Math.ceil((a + 1) / SP) * SP : Math.floor((a - 1) / SP) * SP;
      for (let t = first; dir > 0 ? t < b : t > b; t += dir * SP) { if (Math.abs(t - a) < 45 || Math.abs(t - b) < 45) continue; seq.push(horiz ? [t, y1] : [x1, t]); }
    }
    seq.push(path[path.length - 1]);
    c.poles = seq.map(([x, y]) => addPole(x, y, c));
  });
  for (const p of poles.values()) obj([p.x - 3, p.x + 3, p.y - 3, p.y + 3], () => drawPole(p));
  conns.forEach((c) => {
    const z = wireZ(c), ps = c.poles!;
    for (let i = 0; i < ps.length - 1; i++) {
      const a = ps[i], b = ps[i + 1];
      obj([Math.min(a.x, b.x) - 1, Math.max(a.x, b.x) + 1, Math.min(a.y, b.y) - 1, Math.max(a.y, b.y) + 1], () => wire([a.x, a.y, z], [b.x, b.y, z], c));
    }
    ([[c.from, ps[0]], [c.to, ps[ps.length - 1]]] as [string, Pole][]).forEach(([id, pl]) => {
      const inf = info[id], at = inf.T.attach!, ax = at[0] + inf.ox, ay = at[1] + inf.oy;
      obj([Math.min(ax, pl.x) - 1, Math.max(ax, pl.x) + 1, Math.min(ay, pl.y) - 1, Math.max(ay, pl.y) + 1], () => {
        const [mx, my] = P(ax, ay, at[2]);
        return wire([pl.x, pl.y, z], [ax, ay, at[2]], c) + `<circle cx="${f1(mx)}" cy="${f1(my)}" r="4.5" fill="${c.color}" opacity="${dimOf(c)}"/><circle cx="${f1(mx)}" cy="${f1(my)}" r="1.8" fill="#fff"/>`;
      });
    });
  });
}
