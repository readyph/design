/**
 * PROTOTYPE (RDY-224) - pure layout for the Lab platform town: a U-shaped road
 * of straight arms with rounded corners, lots placed by road frontage (segment,
 * side, position along it), driveways, open space, link de-duplication.
 *
 * MAP DATA (edit here): TILE_*, ROAD_*, LOT_*, ARM_PITCH and `rowsFor`.
 * Plan axes before projection: u = world x (down-right on screen), v = world z
 * (down-left). The top arm is v = 0, the bottom arm v = H, the connecting side
 * is on the right (u = L); the U is open to the left. No Zdog here, so it is unit-testable.
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

// ---------------------------------------------------------------- map data

/** Projection tile in screen px: classic 2:1 dimetric is 64 x 32. Lower TILE_H to flatten the view (28, 24). */
export const TILE_W = 64;
export const TILE_H = 32;
/** Camera tilt (radians) for a tile: the ground diamond reads TILE_W x TILE_H. 64x32 gives 30 degrees. */
export function tiltFor(tileW: number = TILE_W, tileH: number = TILE_H): number {
  return Math.asin(tileH / tileW);
}
/** Camera turn: 45 degrees, so grid axes run down-right (x) and down-left (z) and the ground is a symmetric diamond. */
export const TURN = Math.PI / 4;

/** One map tile in world units. Everything below is in tiles x TILE. */
export const TILE = 44;
/** Road: width 2 tiles, constant. Corner fillet radius 1.5 tiles. */
export const ROAD_HALF = TILE;
export const ROAD_FILLET = 1.5 * TILE;
export const DRIVE_HALF = 18;
/** Lot: 3 tiles along the road, 2 deep, set back 0.5 tile from the curb, at least 2 tiles between neighbours. */
export const LOT_ALONG = 3 * TILE;
export const LOT_DEPTH = 2 * TILE;
export const LOT_SETBACK = 0.5 * TILE;
export const LOT_GAP = 2 * TILE;
/** Lot centre to lot centre along an arm. */
export const ARM_PITCH = LOT_ALONG + LOT_GAP;
/** Distance between the top and bottom arm centre lines (10 tiles). */
export const ARM_SPAN = 10 * TILE;
/** Clear margin around lots for trees and hedges. */
export const TREE_MARGIN = TILE;
const ISLAND_MARGIN = 80;
/** Distance from the road centre line to a lot's facing edge. */
export const LOT_EDGE = ROAD_HALF + LOT_SETBACK;

export type Segment = 'top' | 'bottom';
/** `out` = outside the U (above the top arm, below the bottom arm); `in` = inside the U. */
export type LotSide = 'out' | 'in';

export interface LotSpec {
  segment: Segment;
  side: LotSide;
  /** Slot position along the arm (0 = left end). */
  index: number;
}

/** Lot rows in fill order, and how many rows are used for n platforms (a spare slot becomes the Park). */
export const ROW_ORDER: readonly { segment: Segment; side: LotSide }[] = [
  { segment: 'top', side: 'out' },
  { segment: 'top', side: 'in' },
  { segment: 'bottom', side: 'in' },
  { segment: 'bottom', side: 'out' },
];

export function rowsFor(n: number): { rows: number; m: number } {
  if (n <= 1) return { rows: 1, m: 1 };
  if (n === 2) return { rows: 2, m: 1 };
  if (n <= 9) return { rows: 3, m: Math.ceil(n / 3) };
  return { rows: 4, m: Math.ceil(n / 4) };
}

/** All lot slots for n platforms, in fill order. */
export function lotSpecs(n: number): LotSpec[] {
  const { rows, m } = rowsFor(n);
  const out: LotSpec[] = [];
  for (let r = 0; r < rows; r++) for (let index = 0; index < m; index++) out.push({ ...ROW_ORDER[r], index });
  return out;
}

/** Arm length (u from 0 to L) for m lots per row: first lot starts 2 tiles in, room for the corner at the end. */
export function armLength(m: number, n = 3): number {
  return n > 2 ? Math.max(12 * TILE, (5 * m + 2) * TILE) : (5 * m + 2) * TILE;
}

// ------------------------------------------------------------------ types

export interface PlacedBuilding extends TownBuilding {
  art: BuildingArt;
  /** Lot centre and world-axis size (x extent w, z extent d). Lots are axis-aligned. */
  x: number;
  z: number;
  w: number;
  d: number;
  /** Model rotation in 90 degree steps so the door faces the road (0 faces +z, PI faces -z). */
  yaw: number;
  lift: number;
  segment: Segment;
  side: LotSide;
}

export interface Rect {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface TownScenery {
  trees: { x: number; z: number; s: number; hedge: boolean }[];
  pond: { x: number; z: number; r: number } | null;
  lamps: Pt[];
}

export interface TownPlan {
  placed: PlacedBuilding[];
  /** Decorative lots (not platforms). */
  parks: Rect[];
  /** Road centre line, samples 11 units apart, in travel order (top arm, right side, bottom arm). */
  road: Pt[];
  /** Per building id: driveway centre line from the road (index `junction`) to the lot edge. */
  driveways: Record<string, Pt[]>;
  junction: Record<string, number>;
  island: { width: number; depth: number };
  scenery: TownScenery;
}

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

/**
 * Fill order: kinds stay together but the first two kinds alternate pair by pair
 * (W R / R W ...), which gives the Mixed tenant its target picture.
 */
export function dealBuildings(buildings: readonly TownBuilding[]): TownBuilding[] {
  const groups: TownBuilding[][] = [];
  for (const b of sortBuildings(buildings)) {
    const g = groups.find((x) => x[0].kind === b.kind);
    if (g) g.push(b);
    else groups.push([b]);
  }
  const out: TownBuilding[] = [];
  let k = 0;
  for (;;) {
    const live = groups.filter((g) => g.length);
    if (live.length === 0) break;
    if (live.length === 1) {
      out.push(...live[0].splice(0));
      break;
    }
    const [a, b] = live;
    out.push(...(k % 2 === 0 ? [a.shift()!, b.shift()!] : [b.shift()!, a.shift()!]));
    k++;
  }
  return out;
}

/** Rotation used by Zdog's `rotate.y`: local (x, z) to world. */
export function rotY(p: Pt, a: number): Pt {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: p.x * c - p.z * s, z: p.z * c + p.x * s };
}

/** Distance from a point to an axis-aligned rectangle (0 inside). */
export function distToRect(p: Pt, r: Rect): number {
  return Math.hypot(Math.max(Math.abs(p.x - r.x) - r.w / 2, 0), Math.max(Math.abs(p.z - r.z) - r.d / 2, 0));
}

/** Gap between two axis-aligned rectangles (0 if touching or overlapping). */
export function rectGap(a: Rect, b: Rect): number {
  const dx = Math.max(Math.abs(a.x - b.x) - (a.w + b.w) / 2, 0);
  const dz = Math.max(Math.abs(a.z - b.z) - (a.d + b.d) / 2, 0);
  return Math.hypot(dx, dz);
}

// ------------------------------------------------------------------- plan

/** Road centre line: top arm, rounded corner, right side, rounded corner, bottom arm (a U open to the left). */
export function roadCenterline(L: number, H: number = ARM_SPAN): Pt[] {
  const R = ROAD_FILLET, step = 11;
  const pts: Pt[] = [];
  for (let u = 0; u <= L - R; u += step) pts.push({ x: u, z: 0 });
  const arc = (cx: number, cz: number, a0: number, a1: number) => {
    const n = 10;
    for (let i = 1; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push({ x: cx + R * Math.cos(a), z: cz + R * Math.sin(a) });
    }
  };
  arc(L - R, R, -Math.PI / 2, 0);
  for (let v = R + step; v <= H - R; v += step) pts.push({ x: L, z: v });
  arc(L - R, H - R, 0, Math.PI / 2);
  for (let u = L - R - step; u >= 0; u -= step) pts.push({ x: u, z: H });
  return pts;
}

export function planTown(buildings: readonly TownBuilding[]): TownPlan {
  const n = buildings.length;
  const { m } = rowsFor(n);
  const L = armLength(m, n), H = ARM_SPAN;
  const road = roadCenterline(L, H);
  const specs = lotSpecs(n);
  const dealt = dealBuildings(buildings);

  const lotAt = (s: LotSpec): { rect: Rect; yaw: number; road: Pt } => {
    const u = 2 * TILE + LOT_ALONG / 2 + s.index * ARM_PITCH;
    const armZ = s.segment === 'top' ? 0 : H;
    // `down` = lot sits toward +z of the arm.
    const down = s.segment === 'top' ? s.side === 'in' : s.side === 'out';
    const z = armZ + (down ? 1 : -1) * (LOT_EDGE + LOT_DEPTH / 2);
    return { rect: { x: u, z, w: LOT_ALONG, d: LOT_DEPTH }, yaw: down ? Math.PI : 0, road: { x: u, z: armZ } };
  };

  const placed: PlacedBuilding[] = [];
  const parks: Rect[] = [];
  const driveways: Record<string, Pt[]> = {};
  const junction: Record<string, number> = {};
  specs.forEach((s, i) => {
    const lot = lotAt(s);
    const b = dealt[i];
    if (!b) {
      if (i === n && n > 2) parks.push(lot.rect);
      return;
    }
    placed.push({ ...b, art: artFor(b.kind), ...lot.rect, yaw: lot.yaw, lift: 0, segment: s.segment, side: s.side });
    const ji = road.findIndex((r) => Math.abs(r.x - lot.road.x) < 1e-6 && Math.abs(r.z - lot.road.z) < 1e-6);
    junction[b.id] = ji;
    const J = road[ji], dir = Math.sign(lot.rect.z - J.z);
    const E = { x: J.x, z: lot.rect.z - (dir * LOT_DEPTH) / 2 };
    driveways[b.id] = Array.from({ length: 7 }, (_, k) => ({ x: J.x, z: J.z + ((E.z - J.z) * k) / 6 }));
  });

  // Lamps at even intervals along the curb, alternating sides, clear of driveways.
  const lamps: Pt[] = [];
  const lampStep = 16;
  const jIdx = Object.values(junction);
  for (let i = 8; i < road.length - 1; i += lampStep) {
    if (jIdx.some((j) => Math.abs(j - i) <= 3)) continue;
    const a = road[i - 1], b = road[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    const sgn = (Math.floor(i / lampStep) % 2 === 0 ? 1 : -1) * (ROAD_HALF + 8);
    lamps.push({ x: road[i].x - ((b.z - a.z) / len) * sgn, z: road[i].z + ((b.x - a.x) / len) * sgn });
  }

  // Island: tight around lots, road, pond and lamps.
  const rects: Rect[] = [...placed, ...parks];
  const bottomOutUsed = rects.some((r) => r.z > H + LOT_EDGE);
  const pondR = 52;
  const pond: TownScenery['pond'] = bottomOutUsed
    ? { x: L + ROAD_HALF + LOT_SETBACK + pondR + 14, z: H / 2, r: pondR }
    : { x: L / 2, z: H + LOT_EDGE + pondR + 16, r: pondR };
  const xs: number[] = [], zs: number[] = [];
  for (const r of rects) xs.push(r.x - r.w / 2, r.x + r.w / 2), zs.push(r.z - r.d / 2, r.z + r.d / 2);
  for (const r of road) xs.push(r.x - ROAD_HALF - 4, r.x + ROAD_HALF + 4), zs.push(r.z - ROAD_HALF - 4, r.z + ROAD_HALF + 4);
  xs.push(pond.x - pond.r, pond.x + pond.r), zs.push(pond.z - pond.r, pond.z + pond.r);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minZ = Math.min(...zs), maxZ = Math.max(...zs);
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const mv = (p: Pt) => { p.x -= cx; p.z -= cz; };
  placed.forEach(mv); parks.forEach(mv); road.forEach(mv); lamps.forEach(mv); mv(pond);
  Object.values(driveways).forEach((d) => d.forEach(mv));
  const island = { width: maxX - minX + ISLAND_MARGIN * 2, depth: maxZ - minZ + ISLAND_MARGIN * 2 };

  // Trees and hedges only in leftover space: 1 tile clear of lots, off the road, clear of the pond.
  const lots: Rect[] = [...placed, ...parks];
  const free = (p: Pt) =>
    lots.every((r) => distToRect(p, r) >= TREE_MARGIN) &&
    road.every((r) => Math.hypot(r.x - p.x, r.z - p.z) >= ROAD_HALF + 20) &&
    Math.hypot(p.x - pond.x, p.z - pond.z) >= pond.r + 22 &&
    lamps.every((l) => Math.hypot(l.x - p.x, l.z - p.z) >= 20);
  const trees: TownScenery['trees'] = [];
  for (let z = -island.depth / 2 + 22; z < island.depth / 2 - 18; z += 36)
    for (let x = -island.width / 2 + 22; x < island.width / 2 - 18; x += 36) {
      const key = `${Math.round(x)},${Math.round(z)}`;
      const p = { x: x + (hash01(key, 11) - 0.5) * 16, z: z + (hash01(key, 12) - 0.5) * 16 };
      if (hash01(key, 13) < 0.2 && free(p)) trees.push({ ...p, s: 0.95 + hash01(key, 14) * 0.4, hedge: hash01(key, 15) < 0.28 });
    }

  return { placed, parks, road, driveways, junction, island, scenery: { trees, pond, lamps } };
}

/** Link route along the road: a's driveway, the centre line between the two junctions, b's driveway. */
export function routeFor(plan: TownPlan, a: string, b: string): Pt[] {
  const ia = plan.junction[a], ib = plan.junction[b];
  const slice = ia <= ib ? plan.road.slice(ia, ib + 1) : plan.road.slice(ib, ia + 1).reverse();
  return [...plan.driveways[a].slice().reverse(), ...slice.slice(1, -1), ...plan.driveways[b]];
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
