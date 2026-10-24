/**
 * PROTOTYPE (RDY-224) - pure layout for the Lab platform town: a hand-planned
 * master plan (winding road, sites with setbacks and yaw, driveways, open space),
 * link de-duplication and world extents. No Zdog here, so it is unit-testable.
 */

export type TownStatus = 'ACTIVE' | 'DEGRADED' | 'OFFLINE';

export interface TownBuilding {
  id: string;
  label: string;
  /** Platform kind: `inventory` = warehouse, `sms` = service shop, anything else = store. */
  kind: string;
  status: TownStatus;
  alerts: number;
}

export interface TownLink {
  from: string;
  to: string;
}

export type BuildingArt = 'warehouse' | 'shop' | 'store';

export interface Pt {
  x: number;
  z: number;
}

export interface PlacedBuilding extends TownBuilding {
  art: BuildingArt;
  /** Site centre on the ground plane (world units, scene centred on 0,0). */
  x: number;
  z: number;
  /** Site size (local width x depth) before yaw. */
  w: number;
  d: number;
  /** Site yaw in radians, added to the whole-scene turn. Always within YAW_MIN..YAW_MAX. */
  yaw: number;
  /** Raised site height (0, 6 or 12): gentle terrain steps. */
  lift: number;
}

/**
 * Camera turn about the vertical axis, in degrees: the single knob for the whole world.
 * 0 = facades straight toward the viewer; 45 = classic isometric corner view.
 * Art assumes the total (turn + site yaw) stays within 0..45 (front and right faces visible).
 */
export const TURN_DEG = 20;
/** Site yaw range in degrees: keeps TURN_DEG + yaw inside 0..45 so no building shows its back. */
export const YAW_MIN_DEG = -18;
export const YAW_MAX_DEG = 22;
export const LIFTS = [0, 6, 12] as const;

/** Half width of the main road and of a driveway. */
export const ROAD_HALF = 17;
export const DRIVE_HALF = 8;
/** Distance between road passes. */
const PASS_GAP = 440;
const ROAD_AMP = 38;
const ROAD_WAVE = 640;
const ISLAND_MARGIN = 80;

const KIND_ORDER = ['inventory', 'sms'];

/** Deterministic 0..1 hash of a string and a salt: stable per id, never shuffles between renders. */
export function hash01(id: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

export function artFor(kind: string): BuildingArt {
  if (kind === 'inventory') return 'warehouse';
  if (kind === 'sms') return 'shop';
  return 'store';
}

/** Kind first (inventory, sms, then other kinds A-Z), then label A-Z. */
export function sortBuildings(buildings: readonly TownBuilding[]): TownBuilding[] {
  const rank = (k: string) => {
    const i = KIND_ORDER.indexOf(k);
    return i === -1 ? KIND_ORDER.length : i;
  };
  return [...buildings].sort(
    (a, b) =>
      rank(a.kind) - rank(b.kind) ||
      a.kind.localeCompare(b.kind) ||
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }) ||
      a.id.localeCompare(b.id),
  );
}

/** Rotation used by Zdog's `rotate.y`: local (x, z) to world. */
export function rotY(p: Pt, a: number): Pt {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x * c - p.z * s, z: p.z * c + p.x * s };
}

export function siteCorners(b: Pick<PlacedBuilding, 'x' | 'z' | 'w' | 'd' | 'yaw'>): Pt[] {
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i, j]) => {
    const r = rotY({ x: (i * b.w) / 2, z: (j * b.d) / 2 }, b.yaw);
    return { x: b.x + r.x, z: b.z + r.z };
  });
}

/** Distance from a point to a site rectangle (0 inside). */
export function distToSite(p: Pt, b: Pick<PlacedBuilding, 'x' | 'z' | 'w' | 'd' | 'yaw'>): number {
  const l = rotY({ x: p.x - b.x, z: p.z - b.z }, -b.yaw);
  return Math.hypot(Math.max(Math.abs(l.x) - b.w / 2, 0), Math.max(Math.abs(l.z) - b.d / 2, 0));
}

type Rect = Pick<PlacedBuilding, 'x' | 'z' | 'w' | 'd' | 'yaw'>;

/** Separating-axis test for two yawed rectangles, with an extra clearance `gap`. */
export function sitesOverlap(a: Rect, b: Rect, gap = 0): boolean {
  const grow = (r: Rect): Rect => ({ ...r, w: r.w + gap, d: r.d + gap });
  const A = siteCorners(grow(a)), B = siteCorners(grow(b));
  for (const poly of [A, B]) {
    for (let i = 0; i < 4; i++) {
      const p = poly[i], q = poly[(i + 1) % 4];
      const nx = q.z - p.z, nz = p.x - q.x;
      const proj = (c: Pt[]) => c.map((v) => v.x * nx + v.z * nz);
      const pa = proj(A), pb = proj(B);
      if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
    }
  }
  return true;
}

export interface TownScenery {
  trees: { x: number; z: number; s: number; hedge: boolean }[];
  pond: { x: number; z: number; r: number } | null;
}

export interface TownPlan {
  placed: PlacedBuilding[];
  /** Main road centre line, dense samples, in travel order. */
  road: Pt[];
  /** Per building id: driveway centre line from the road to the site edge. */
  driveways: Record<string, Pt[]>;
  /** Per building id: index into `road` where its driveway joins. */
  junction: Record<string, number>;
  island: { width: number; depth: number };
  scenery: TownScenery;
}

/** Road pass shape: gentle sine, tapered to zero at the ends so it joins the U-turn. */
function passZ(j: number, x: number, half: number): number {
  const taper = Math.min(1, Math.max(0, (half - Math.abs(x)) / 140));
  return j * PASS_GAP + ROAD_AMP * taper * Math.sin((2 * Math.PI * x) / ROAD_WAVE + j * 1.7);
}

/** Passes and buildings per pass for n platforms: roughly balanced width and depth. */
export function passPlan(n: number): { k: number; m: number } {
  const k = Math.max(1, Math.round(Math.sqrt(n / 2.2)));
  return { k, m: Math.ceil(n / k) };
}

/**
 * Master plan: a winding road in `k` switchback passes; each platform gets its own
 * yawed, differently sized, raised site on alternating sides of the road with varied
 * setbacks, a curved driveway, and open space (lawns, trees, a pond) in between.
 */
export function planTown(buildings: readonly TownBuilding[]): TownPlan {
  const sorted = sortBuildings(buildings);
  const n = sorted.length;
  const { k, m } = passPlan(n);
  const half = Math.max(280, (m * 160 + 240) / 2);
  const step = 12;

  // Road samples: pass j runs +x for even j, -x for odd j; U-turns join them.
  const road: Pt[] = [];
  for (let j = 0; j < k; j++) {
    const dir = j % 2 === 0 ? 1 : -1;
    for (let x = -half; x <= half + 0.01; x += step) {
      const xx = dir * x;
      road.push({ x: xx, z: passZ(j, xx, half) });
    }
    if (j < k - 1) {
      const cz = j * PASS_GAP + PASS_GAP / 2;
      for (let a = 0.15; a < Math.PI; a += 0.15) road.push({ x: dir * (half + 70 * Math.sin(a)), z: cz - (PASS_GAP / 2) * Math.cos(a) });
    }
  }

  const placed: PlacedBuilding[] = [];
  const junctionPts: Pt[] = [];
  sorted.forEach((b, i) => {
    const j = Math.floor(i / m), q = i % m;
    const mj = Math.min(m, n - j * m);
    const lo = -half + 120, hi = half - 120;
    const t = (q + 0.5) / mj;
    const jitter = (hash01(b.id, 4) * 2 - 1) * 16;
    const x = mj === 1 ? (hash01(b.id, 5) * 2 - 1) * 60 : lo + t * (hi - lo) + jitter;
    const side = (q + j) % 2 === 0 ? 1 : -1;
    const eps = 2;
    const slope = (passZ(j, x + eps, half) - passZ(j, x - eps, half)) / (2 * eps);
    const len = Math.hypot(slope, 1);
    const nrm = { x: (-slope / len) * side, z: (1 / len) * side };
    const w = 130 + Math.round(hash01(b.id, 6) * 36);
    const d = 106 + Math.round(hash01(b.id, 7) * 24);
    const yaw = ((YAW_MIN_DEG + hash01(b.id, 8) * (YAW_MAX_DEG - YAW_MIN_DEG)) * Math.PI) / 180;
    const perp = (d / 2) * Math.cos(yaw) + (w / 2) * Math.abs(Math.sin(yaw));
    const off = perp + ROAD_HALF + 24 + hash01(b.id, 9) * 40;
    const rz = passZ(j, x, half);
    junctionPts.push({ x, z: rz });
    const lift = n > 1 ? LIFTS[Math.floor(hash01(b.id, 3) * LIFTS.length)] : 0;
    placed.push({ ...b, art: artFor(b.kind), x: x + nrm.x * off, z: rz + nrm.z * off, w, d, yaw, lift });
  });

  // Relax: keep sites clear of each other and of the road (deterministic, fixed passes).
  for (let it = 0; it < 40; it++) {
    for (let a = 0; a < n; a++) {
      for (let c = a + 1; c < n; c++) {
        if (!sitesOverlap(placed[a], placed[c], 40)) continue;
        const dx = placed[c].x - placed[a].x, dz = placed[c].z - placed[a].z;
        const l = Math.hypot(dx, dz) || 1;
        placed[a].x -= (dx / l) * 6; placed[a].z -= (dz / l) * 6;
        placed[c].x += (dx / l) * 6; placed[c].z += (dz / l) * 6;
      }
      for (const r of road) {
        const dd = distToSite(r, placed[a]);
        if (dd >= ROAD_HALF + 14) continue;
        const dx = placed[a].x - r.x, dz = placed[a].z - r.z;
        const l = Math.hypot(dx, dz) || 1;
        placed[a].x += (dx / l) * 5; placed[a].z += (dz / l) * 5;
      }
    }
  }

  // Driveways: a curved link from the road point to the site edge facing the road.
  const driveways: Record<string, Pt[]> = {};
  const junction: Record<string, number> = {};
  placed.forEach((b, i) => {
    let bi = 0, bd = Infinity;
    road.forEach((r, ri) => {
      const dd = Math.hypot(r.x - b.x, r.z - b.z);
      if (dd < bd) { bd = dd; bi = ri; }
    });
    junction[b.id] = bi;
    void junctionPts[i];
    const J = road[bi];
    const l = rotY({ x: J.x - b.x, z: J.z - b.z }, -b.yaw);
    const tt = Math.min(b.w / 2 / Math.max(Math.abs(l.x), 1e-6), b.d / 2 / Math.max(Math.abs(l.z), 1e-6));
    const e = rotY({ x: l.x * tt, z: l.z * tt }, b.yaw);
    const E = { x: b.x + e.x, z: b.z + e.z };
    const sgn = hash01(b.id, 10) < 0.5 ? -1 : 1;
    const len = Math.hypot(E.x - J.x, E.z - J.z) || 1;
    const C = { x: (J.x + E.x) / 2 - ((E.z - J.z) / len) * 16 * sgn, z: (J.z + E.z) / 2 + ((E.x - J.x) / len) * 16 * sgn };
    const pts: Pt[] = [];
    for (let s = 0; s <= 8; s++) {
      const u = s / 8;
      pts.push({ x: (1 - u) * (1 - u) * J.x + 2 * (1 - u) * u * C.x + u * u * E.x, z: (1 - u) * (1 - u) * J.z + 2 * (1 - u) * u * C.z + u * u * E.z });
    }
    driveways[b.id] = pts;
  });

  // Centre everything on the origin and size the island around it.
  const all: Pt[] = [...placed.flatMap(siteCorners), ...road.flatMap((r) => [{ x: r.x - ROAD_HALF, z: r.z - ROAD_HALF }, { x: r.x + ROAD_HALF, z: r.z + ROAD_HALF }])];
  const minX = Math.min(...all.map((p) => p.x)), maxX = Math.max(...all.map((p) => p.x));
  const minZ = Math.min(...all.map((p) => p.z)), maxZ = Math.max(...all.map((p) => p.z));
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const mv = (p: Pt) => { p.x -= cx; p.z -= cz; };
  placed.forEach(mv); road.forEach(mv); Object.values(driveways).forEach((d) => d.forEach(mv));
  const island = { width: maxX - minX + ISLAND_MARGIN * 2, depth: maxZ - minZ + ISLAND_MARGIN * 2 };

  // Open space: pond in the roomiest front spot, then trees and hedges on free ground.
  const clear = (p: Pt) => {
    let c = Infinity;
    for (const b of placed) c = Math.min(c, distToSite(p, b));
    for (const r of road) c = Math.min(c, Math.hypot(r.x - p.x, r.z - p.z) - ROAD_HALF);
    for (const dv of Object.values(driveways)) for (const v of dv) c = Math.min(c, Math.hypot(v.x - p.x, v.z - p.z) - DRIVE_HALF);
    return c;
  };
  const lim = (v: number, hw: number) => Math.abs(v) < hw - 26;
  const cands: Pt[] = [];
  for (let z = -island.depth / 2 + 40; z < island.depth / 2 - 30; z += 70)
    for (let x = -island.width / 2 + 40; x < island.width / 2 - 30; x += 70)
      cands.push({ x: x + (hash01(`${x},${z}`, 11) - 0.5) * 36, z: z + (hash01(`${x},${z}`, 12) - 0.5) * 36 });
  const inside = (p: Pt) => lim(p.x, island.width) && lim(p.z, island.depth);
  let pond: TownScenery['pond'] = null;
  const roomy = cands.filter((p) => Math.abs(p.x) < island.width / 2 - 70 && Math.abs(p.z) < island.depth / 2 - 70 && clear(p) >= 62).sort((a, b) => b.z + b.x * 0.3 - (a.z + a.x * 0.3));
  if (roomy.length) pond = { x: roomy[0].x, z: roomy[0].z, r: 44 };
  const trees = cands
    .filter((p) => inside(p) && clear(p) >= 26 && (!pond || Math.hypot(p.x - pond.x, p.z - pond.z) > pond.r + 22) && hash01(`${p.x},${p.z}`, 13) < 0.32)
    .map((p) => ({ x: p.x, z: p.z, s: 0.95 + hash01(`${p.x},${p.z}`, 14) * 0.4, hedge: hash01(`${p.x},${p.z}`, 15) < 0.28 }));

  return { placed, road, driveways, junction, island, scenery: { trees, pond } };
}

/** Link route along the road network: a's driveway, the road between the two junctions, b's driveway. */
export function routeFor(plan: TownPlan, a: string, b: string): Pt[] {
  const ia = plan.junction[a], ib = plan.junction[b];
  const slice = ia <= ib ? plan.road.slice(ia, ib + 1) : plan.road.slice(ib, ia + 1).reverse();
  return [...plan.driveways[a].slice().reverse(), ...slice, ...plan.driveways[b]];
}

/** One road per platform pair: drops self-links, reversed duplicates and links to unknown ids. */
export function dedupeLinks(links: readonly TownLink[], ids: ReadonlySet<string>): TownLink[] {
  const seen = new Set<string>();
  const out: TownLink[] = [];
  for (const l of links) {
    if (l.from === l.to || !ids.has(l.from) || !ids.has(l.to)) continue;
    const [a, b] = l.from < l.to ? [l.from, l.to] : [l.to, l.from];
    const key = `${a}|${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ from: a, to: b });
  }
  return out;
}

/** Initial lights: on for ACTIVE and DEGRADED, off for OFFLINE. */
export function defaultLights(buildings: readonly TownBuilding[]): Record<string, boolean> {
  return Object.fromEntries(buildings.map((b) => [b.id, b.status !== 'OFFLINE']));
}
