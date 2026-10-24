/**
 * PROTOTYPE (RDY-224) - Zdog art for the Lab platform town: soft pastel,
 * flat-shaded isometric models with no outlines (Zdog's own look).
 * World axes: x right, z toward the viewer, y down (so heights are negative).
 * Every builder returns marker anchors the scene projects to screen space for
 * the 2D overlay (signs, alert badges) and hit testing.
 *
 * The camera is fixed (front = +z faces lower-left, +x faces lower-right), so
 * each model only draws its visible faces, back to front, inside a
 * non-sorting group: details always land on top of their wall, and the group
 * is the only thing Zdog depth-sorts.
 */
import * as Zdog from 'zdog';
import { CELL, STREET, type PlacedBuilding, type TownLink } from './layout';
import { mix, css, type RGB, type TownPalette } from './palette';

const TAU = Zdog.TAU;

/** Zdog keeps the projected position on `renderOrigin`; @types/zdog does not declare it. */
export type Projected = Zdog.Anchor & { renderOrigin: Zdog.Vector };

export interface BuildingModel {
  id: string;
  group: Zdog.Group;
  /** Front-centre ground point: the label sign hangs here. */
  signAt: Projected;
  /** Status lamp bulb: the alert badge sits next to it. */
  lampAt: Projected;
  /** Bounding box corners for hit testing. */
  corners: Projected[];
}

interface Look {
  p: TownPalette;
  /** 0 = lights off (dimmed, dark windows), 1 = lights on. */
  glow: number;
}

type P = Zdog.VectorOptions;

/** Height of the sidewalk pad every lot stands on. */
export const PAD_H = 4;
/** Sidewalk pad edge length. */
export const PAD = CELL - STREET;
/** Buildings are modelled small and scaled up to fill their lot. */
const BUILDING_SCALE = 1.4;
/** Turns each building toward the viewer so its facade (door, awning, sign band) reads as the front. */
const FACE = -TAU / 16;

/** `k` > 0 lightens toward the highlight, `k` < 0 darkens toward the shade. */
function tone(c: RGB, look: Look, k = 0): string {
  const dim = 0.14 * (1 - look.glow);
  const base = k >= 0 ? mix(c, look.p.lite, k) : mix(c, look.p.cool, -k);
  return css(mix(base, look.p.shade, dim));
}

function marker(addTo: Zdog.Anchor, x: number, y: number, z: number): Projected {
  return new Zdog.Anchor({ addTo, translate: { x, y, z } }) as Projected;
}

/** Filled polygon. The same-colour hairline stroke seals anti-aliasing seams between neighbours. */
function poly(addTo: Zdog.Anchor, path: P[], color: string) {
  new Zdog.Shape({ addTo, path, closed: true, fill: true, stroke: 1, color });
}

/** Flat rectangle on the ground plane at height `y`. */
function flat(addTo: Zdog.Anchor, color: string, x0: number, z0: number, x1: number, z1: number, y = 0) {
  poly(addTo, [{ x: x0, y, z: z0 }, { x: x1, y, z: z0 }, { x: x1, y, z: z1 }, { x: x0, y, z: z1 }], color);
}

/**
 * A box resting on `baseY`: front (+z), right (+x) and top faces, lit from the
 * upper left (front mid, right darker, top lightest).
 */
function block(addTo: Zdog.Anchor, look: Look, c: RGB, w: number, h: number, d: number, x = 0, baseY = 0, z = 0, tops = true) {
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y0 = baseY, y1 = baseY - h;
  poly(addTo, [{ x: x0, y: y0, z: z1 }, { x: x1, y: y0, z: z1 }, { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z1 }], tone(c, look, 0.02));
  poly(addTo, [{ x: x1, y: y0, z: z1 }, { x: x1, y: y0, z: z0 }, { x: x1, y: y1, z: z0 }, { x: x1, y: y1, z: z1 }], tone(c, look, -0.15));
  if (tops) poly(addTo, [{ x: x0, y: y1, z: z0 }, { x: x1, y: y1, z: z0 }, { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z1 }], tone(c, look, 0.3));
}

/** Round blob (tree crown, beacon): a single point with a fat stroke. */
function ball(addTo: Zdog.Anchor, color: string, d: number, x: number, y: number, z: number) {
  new Zdog.Shape({ addTo, translate: { x, y, z }, stroke: d, color });
}

/** Window with a light frame. `face` picks the wall plane: front (+z) or right (+x). */
function pane(addTo: Zdog.Anchor, look: Look, w: number, h: number, x: number, y: number, z: number, face: 'front' | 'right' = 'front') {
  const rotate = face === 'front' ? undefined : { y: TAU / 4 };
  const at = { x, y, z };
  new Zdog.Rect({
    addTo,
    width: w,
    height: h,
    stroke: 0.8,
    fill: true,
    color: css(mix(look.p.windowOff, look.p.windowOn, look.glow)),
    translate: { x: at.x + (face === 'right' ? 0.2 : 0), y: at.y, z: at.z + (face === 'front' ? 0.2 : 0) },
    rotate,
  });
}

/** Arched door on the front wall plane at depth `z`; `slats` draws roll-up door lines. */
function archDoor(addTo: Zdog.Anchor, look: Look, w: number, h: number, x: number, z: number, slats = 0, color = look.p.door) {
  const r = w / 2;
  new Zdog.Shape({
    addTo,
    translate: { x, z },
    path: [
      { x: -r, y: 0 },
      { x: -r, y: -h + r },
      { arc: [{ x: -r, y: -h }, { x: 0, y: -h }] },
      { arc: [{ x: r, y: -h }, { x: r, y: -h + r }] },
      { x: r, y: 0 },
    ],
    closed: true,
    fill: true,
    stroke: 1,
    color: tone(color, look, -0.05),
  });
  if (slats > 0) {
    const path: Zdog.PathCommand[] = [];
    for (let i = 1; i <= slats; i++) {
      const y = -((h - r) * i) / (slats + 1);
      path.push({ move: { x: -r + 1.5, y } }, { line: { x: r - 1.5, y } });
    }
    new Zdog.Shape({ addTo, translate: { x, z: z + 0.3 }, path, closed: false, stroke: 1, color: tone(color, look, -0.3) });
  }
}

/** Status beacon: a short post with a round bulb. */
function lamp(addTo: Zdog.Anchor, look: Look, b: PlacedBuilding, x: number, roofY: number, z: number): Projected {
  new Zdog.Shape({ addTo, path: [{ x, y: roofY, z }, { x, y: roofY - 9, z }], stroke: 2, color: css(look.p.steel) });
  ball(addTo, css(look.p.lamp[b.status]), 10, x, roofY - 13, z);
  return marker(addTo, x, roofY - 13, z);
}

function corners(addTo: Zdog.Anchor, w: number, top: number, d: number): Projected[] {
  const out: Projected[] = [];
  for (const x of [-w / 2, w / 2]) for (const y of [0, top]) for (const z of [-d / 2, d / 2]) out.push(marker(addTo, x, y, z));
  return out;
}

/** Soft contact shadow, thrown to the lower right. */
function shadow(addTo: Zdog.Anchor, look: Look, w: number, d: number, x = 0, z = 0) {
  flat(addTo, css(look.p.shade, look.p.dark ? 0.35 : 0.12), x - w / 2 + 8, z - d / 2 + 4, x + w / 2 + 14, z + d / 2 + 6, -0.2);
}

/** Small pastel crate with a tape stripe. */
function crate(addTo: Zdog.Anchor, look: Look, s: number, x: number, baseY: number, z: number) {
  block(addTo, look, look.p.crate, s, s, s, x, baseY, z);
  flat(addTo, tone(look.p.crate, look, 0.35), x - 1.6, z - s / 2, x + 1.6, z + s / 2, baseY - s - 0.1);
  poly(addTo, [{ x: x - 1.6, y: baseY, z: z + s / 2 + 0.1 }, { x: x + 1.6, y: baseY, z: z + s / 2 + 0.1 }, { x: x + 1.6, y: baseY - s, z: z + s / 2 + 0.1 }, { x: x - 1.6, y: baseY - s, z: z + s / 2 + 0.1 }], tone(look.p.crate, look, 0.35));
}

/** Round tree: trunk, crown and a lighter highlight blob. */
function tree(addTo: Zdog.Anchor, look: Look, x: number, z: number, s = 1) {
  new Zdog.Shape({ addTo, path: [{ x, y: 0, z }, { x, y: -13 * s, z }], stroke: 4 * s, color: tone(look.p.trunk, look) });
  ball(addTo, tone(look.p.tree, look, -0.05), 26 * s, x, -24 * s, z);
  ball(addTo, tone(look.p.treeLite, look), 13 * s, x - 4 * s, -29 * s, z + 3 * s);
}

/**
 * Gabled house body, ridge along x (Zdog "Happy town" look): flat faces, no
 * outlines. Front wall, right wall with its gable triangle, then the front roof
 * slope (lightest) with a small overhang.
 */
function gabled(addTo: Zdog.Anchor, look: Look, wall: RGB, roof: RGB, w: number, h: number, d: number, rise: number, x = 0, z = 0) {
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, o = 3;
  poly(addTo, [{ x: x0, y: 0, z: z1 }, { x: x1, y: 0, z: z1 }, { x: x1, y: -h, z: z1 }, { x: x0, y: -h, z: z1 }], tone(wall, look, 0.04));
  poly(addTo, [{ x: x1, y: 0, z: z1 }, { x: x1, y: 0, z: z0 }, { x: x1, y: -h, z: z0 }, { x: x1, y: -h - rise, z }, { x: x1, y: -h, z: z1 }], tone(wall, look, -0.2));
  poly(addTo, [{ x: x0 - o, y: -h + 1, z: z1 + o }, { x: x1 + o, y: -h + 1, z: z1 + o }, { x: x1 + o, y: -h - rise, z }, { x: x0 - o, y: -h - rise, z }], tone(roof, look, 0.1));
  // Right-hand roof edge so the slope reads as a solid.
  poly(addTo, [{ x: x1 + o, y: -h + 1, z: z1 + o }, { x: x1 + o + 0.1, y: -h - rise, z }, { x: x1 + o, y: -h - rise + 2.5, z }, { x: x1 + o, y: -h + 3.5, z: z1 + o }], tone(roof, look, -0.3));
}

/** Warehouse (inventory): wide yellow hall, blue gabled roof, roll-up doors and a big crate stack. */
function warehouse(g: Zdog.Group, look: Look, b: PlacedBuilding): Omit<BuildingModel, 'id' | 'group'> {
  const { p } = look;
  const w = 70, h = 28, d = 50, rise = 18;
  shadow(g, look, w + 24, d + 6, 4, 0);
  gabled(g, look, p.warehouseWall, p.warehouseRoof, w, h, d, rise);
  for (const x of [-20, 0, 20]) archDoor(g, look, 16, 20, x, d / 2 + 0.4, 4, p.warehouseRoof);
  for (const z of [-12, 12]) pane(g, look, 9, 9, w / 2 + 0.4, -17, z, 'right');
  // Oversized crate stack beside the hall.
  crate(g, look, 18, w / 2 + 18, 0, 6);
  crate(g, look, 18, w / 2 + 18, 0, -14);
  crate(g, look, 16, w / 2 + 18, -18, -4);
  const lampAt = lamp(g, look, b, -w / 2 + 12, -h - rise + 2, 0);
  return { signAt: marker(g, 0, 0, d / 2 + 12), lampAt, corners: corners(g, w + 46, -h - rise - 18, d + 6) };
}

/** Giant wrench standing upright on the ground: a 3/4 ring head and a chunky handle. */
function wrench(addTo: Zdog.Anchor, look: Look, x: number, z: number) {
  const c = tone(look.p.steel, look, 0.1);
  const g = new Zdog.Anchor({ addTo, translate: { x, y: 0, z } });
  new Zdog.Shape({ addTo: g, path: [{ y: 0 }, { y: -34 }], stroke: 8, color: c });
  new Zdog.Ellipse({ addTo: g, diameter: 20, quarters: 3, stroke: 8, color: c, translate: { y: -42 }, rotate: { z: TAU * 0.375 } });
  ball(g, c, 11, 0, -1, 0);
}

/** Service shop (sms): pink two-storey shop, lavender gabled roof, chimney and a giant wrench. */
function shop(g: Zdog.Group, look: Look, b: PlacedBuilding): Omit<BuildingModel, 'id' | 'group'> {
  const { p } = look;
  const w = 56, h = 40, d = 48, rise = 18;
  shadow(g, look, w + 28, d + 4, 6, 0);
  gabled(g, look, p.shopWall, p.shopRoof, w, h, d, rise);
  const f = d / 2 + 0.4;
  poly(g, [{ x: -w / 2, y: -22, z: f }, { x: w / 2, y: -22, z: f }, { x: w / 2, y: -26, z: f }, { x: -w / 2, y: -26, z: f }], tone(p.shopSign, look));
  archDoor(g, look, 14, 20, 0, f);
  for (const x of [-18, 18]) pane(g, look, 12, 12, x, -11, f);
  for (const x of [-16, 0, 16]) pane(g, look, 9, 9, x, -34, f);
  for (const z of [-10, 10]) pane(g, look, 9, 9, w / 2 + 0.4, -26, z, 'right');
  block(g, look, p.shopRoof, 7, 14, 7, -w / 2 + 12, -h - 6, -6);
  wrench(g, look, w / 2 + 20, 4);
  const lampAt = lamp(g, look, b, w / 2 - 16, -h - rise + 2, 0);
  return { signAt: marker(g, 0, 0, d / 2 + 12), lampAt, corners: corners(g, w + 40, -h - rise - 14, d + 6) };
}

/** Store (other kinds): lavender shopfront, striped awning, gabled roof and a giant shopping bag. */
function store(g: Zdog.Group, look: Look, b: PlacedBuilding): Omit<BuildingModel, 'id' | 'group'> {
  const { p } = look;
  const w = 56, h = 30, d = 46, rise = 14, reach = 12, stripes = 5;
  shadow(g, look, w + 30, d + 4, -6, 0);
  gabled(g, look, p.storeWall, p.storeRoof, w, h, d, rise);
  const f = d / 2 + 0.4;
  for (const x of [-18, 18]) pane(g, look, 14, 12, x, -10, f);
  archDoor(g, look, 11, 18, 0, f);
  for (const z of [-9, 9]) pane(g, look, 9, 9, w / 2 + 0.4, -16, z, 'right');
  // Striped awning sloping out over the front.
  const sw = w / stripes;
  for (let i = 0; i < stripes; i++) {
    const x0 = -w / 2 + i * sw;
    const c = i % 2 === 0 ? p.awning : p.awningAlt;
    poly(g, [{ x: x0, y: -22, z: d / 2 }, { x: x0 + sw, y: -22, z: d / 2 }, { x: x0 + sw, y: -14, z: d / 2 + reach }, { x: x0, y: -14, z: d / 2 + reach }], tone(c, look, -0.02));
  }
  // Giant shopping bag at the left: handles first (behind), then the body.
  const bx = -w / 2 - 14, bz = d / 2 - 12;
  new Zdog.Ellipse({ addTo: g, diameter: 14, quarters: 2, stroke: 2.5, color: tone(p.bag, look, -0.3), translate: { x: bx, y: -34, z: bz - 4 }, rotate: { z: TAU / 4 } });
  block(g, look, p.bag, 24, 34, 16, bx, 0, bz);
  const lampAt = lamp(g, look, b, w / 2 - 10, -h - rise + 2, 0);
  return { signAt: marker(g, 0, 0, d / 2 + 14), lampAt, corners: corners(g, w + 44, -h - rise - 14, d + reach) };
}


/** One building as a painter-ordered Zdog group standing on its lot's pad. */
export function buildBuilding(addTo: Zdog.Anchor, p: TownPalette, b: PlacedBuilding, glow: number): BuildingModel {
  const look: Look = { p, glow };
  const group = new Zdog.Group({ addTo, translate: { x: b.x - 12, y: -PAD_H - b.lift, z: b.z }, rotate: { y: FACE }, scale: BUILDING_SCALE, updateSort: false });
  // A small tree in the back-left corner of the pad, behind the building.
  tree(group, look, -PAD / 2 / BUILDING_SCALE + 8, -PAD / 2 / BUILDING_SCALE + 8, 0.7);
  const art = b.art === 'warehouse' ? warehouse(group, look, b) : b.art === 'shop' ? shop(group, look, b) : store(group, look, b);
  return { id: b.id, group, ...art };
}

/** Deterministic 0..1 noise, so scenery never shuffles between renders. */
function rnd(i: number): number {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Round hedge: three stacked balls (as in the Zdog town). */
function hedge(addTo: Zdog.Anchor, look: Look, x: number, z: number) {
  ball(addTo, tone(look.p.tree, look, -0.05), 18, x, -8, z);
  ball(addTo, tone(look.p.treeLite, look), 12, x - 2, -17, z + 1);
}

/** Street lamp: slim post with a warm bulb. */
function streetLamp(addTo: Zdog.Anchor, look: Look, x: number, z: number, y = 0) {
  new Zdog.Shape({ addTo, path: [{ x, y, z }, { x, y: y - 24, z }], stroke: 2, color: css(look.p.steel) });
  ball(addTo, css(mix(look.p.windowOff, look.p.windowOn, look.glow)), 6, x, y - 26, z);
}

/** Scenery: open grass with a few trees, hedges and street lamps, so the town stays calm and scenic. */
export function buildScenery(addTo: Zdog.Anchor, p: TownPalette, island: { width: number; depth: number }, streets: { width: number; depth: number }, empty: readonly { x: number; z: number }[]) {
  const look: Look = { p, glow: 1 };
  const sx = streets.width / 2, sz = streets.depth / 2;
  const o = (island.width - streets.width) / 4 + 2;
  const put = (x: number, z: number, s: number, k: number, y = 0) => {
    const g = new Zdog.Group({ addTo, translate: { x, y, z }, updateSort: false });
    if (rnd(k) > 0.3) tree(g, look, 0, 0, s);
    else hedge(g, look, 0, 0);
  };
  let k = 0;
  // Sparse trees around the rim, none on the pond corner.
  for (let x = -sx + 20; x <= sx - 20; x += 120, k++) put(x, -sz - o, 1.2, k);
  for (let z = -sz + 70; z <= sz - 30; z += 120, k++) put(-sx - o, z, 1.2, k + 7);
  for (let z = -sz + 20; z <= sz - 90; z += 120, k++) put(sx + o, z, 1.1, k + 3);
  for (let x = -sx + 50; x <= sx - 100; x += 130, k++) put(x, sz + o, 1.1, k + 5);
  // Street lamps at the outer street corners.
  for (const [lx, lz] of [[-sx + 6, -sz + 6], [sx - 6, -sz + 6], [-sx + 6, sz - 6]]) streetLamp(addTo, look, lx, lz);
  // Parks on the spare lots.
  empty.forEach((e, i) => {
    put(e.x - 22, e.z - 12, 1.2, 100 + i, -PAD_H);
    put(e.x + 18, e.z + 14, 1, 120 + i, -PAD_H);
  });
}


/** Where a road meets a building: the street in front of its lot. */
function streetFront(b: PlacedBuilding): { x: number; z: number }[] {
  return [{ x: b.x, z: b.z + (CELL - STREET) / 2 }, { x: b.x, z: b.nz + CELL / 2 }];
}

/** Manhattan route between two lots along the streets: out the front, along one cross street, in the front. */
function route(a: PlacedBuilding, b: PlacedBuilding): { x: number; z: number }[] {
  const [a0, a1] = streetFront(a), [b0, b1] = streetFront(b);
  const xv = Math.min(a.nx, b.nx) + CELL / 2;
  const pts = [a0, a1, { x: xv, z: a1.z }, { x: xv, z: b1.z }, b1, b0];
  return pts.filter((q, i) => i === 0 || q.x !== pts[i - 1].x || q.z !== pts[i - 1].z);
}

/**
 * Ground layer: island slab, street grid, link routes, sidewalk pads and the
 * scenery. The slab is inserted first, so painter order keeps it behind everything.
 */
export function buildGround(
  addTo: Zdog.Anchor,
  p: TownPalette,
  island: { width: number; depth: number },
  streets: { width: number; depth: number },
  placed: readonly PlacedBuilding[],
  empty: readonly { x: number; z: number }[],
  links: readonly TownLink[],
): { ground: Zdog.Group; extent: Projected[] } {
  const ground = new Zdog.Group({ addTo, updateSort: false });
  const look: Look = { p, glow: 1 };
  const r = island.width / 2, q = island.depth / 2, t = 20, lip = 5;
  // Slab: grass-coloured lip over a beige body, then the grass top.
  const side = (x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, c: RGB, k: number) =>
    poly(ground, [{ x: x0, y: y0, z: z0 }, { x: x1, y: y0, z: z1 }, { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z0 }], tone(c, look, k));
  side(-r, q, r, q, 0, t, p.earth, -0.04);
  side(r, q, r, -q, 0, t, p.earth, -0.2);
  side(-r, q, r, q, 0, lip, p.grassSide, -0.04);
  side(r, q, r, -q, 0, lip, p.grassSide, -0.2);
  flat(ground, tone(p.grass, look), -r, -q, r, q);
  const extent = [marker(ground, -r, 0, -q), marker(ground, r, t, q), marker(ground, -r, t, q), marker(ground, r, t, -q)];
  // Streets (the area under and between the lots).
  const sx = streets.width / 2, sz = streets.depth / 2;
  flat(ground, tone(p.sidewalk, look, -0.04), -sx - 6, -sz - 6, sx + 6, sz + 6, -0.3);
  flat(ground, tone(p.street, look), -sx, -sz, sx, sz, -0.6);
  // Link routes along the street centre lines.
  const byId = new Map(placed.map((b) => [b.id, b]));
  for (const l of links) {
    const a = byId.get(l.from), b = byId.get(l.to);
    if (!a || !b) continue;
    const pts = route(a, b);
    const path: Zdog.PathCommand[] = pts.map((pt, i) => (i === 0 ? { x: pt.x, y: -0.9, z: pt.z } : { line: { x: pt.x, y: -0.9, z: pt.z } }));
    new Zdog.Shape({ addTo: ground, path, closed: false, stroke: 9, color: tone(p.route, look) });
    const dashes: Zdog.PathCommand[] = [];
    for (let i = 1; i < pts.length; i++) {
      const s = pts[i - 1], e = pts[i];
      const len = Math.hypot(e.x - s.x, e.z - s.z);
      const n = Math.max(1, Math.round(len / 18));
      for (let k = 0; k < n; k++) {
        const t0 = (k + 0.25) / n, t1 = (k + 0.7) / n;
        dashes.push(
          { move: { x: s.x + (e.x - s.x) * t0, y: -1.3, z: s.z + (e.z - s.z) * t0 } },
          { line: { x: s.x + (e.x - s.x) * t1, y: -1.3, z: s.z + (e.z - s.z) * t1 } },
        );
      }
    }
    new Zdog.Shape({ addTo: ground, path: dashes, closed: false, stroke: 1.6, color: tone(p.routeMark, look) });
  }
  // Pond in the front-right corner of the scenery band.
  const o = (island.width - streets.width) / 4 + 2;
  const px = sx + o - 4, pz = sz + o - 4;
  new Zdog.Ellipse({ addTo: ground, translate: { x: px, y: -0.4, z: pz }, rotate: { x: TAU / 4 }, diameter: 36, stroke: 8, fill: true, color: tone(p.sidewalk, look, 0.1) });
  new Zdog.Ellipse({ addTo: ground, translate: { x: px, y: -0.8, z: pz }, rotate: { x: TAU / 4 }, diameter: 32, stroke: 2, fill: true, color: tone(p.water, look) });
  // Pads, back to front, so the kerbs of nearer lots cover the ones behind.
  const lots = [
    ...placed.map((b) => ({ x: b.x, z: b.z, c: p.sidewalk, lift: b.lift })),
    ...empty.map((e) => ({ x: e.x, z: e.z, c: p.grass, lift: 0 })),
  ].sort((a, b) => a.x + a.z - (b.x + b.z));
  for (const lot of lots) block(ground, look, lot.c, PAD, PAD_H + lot.lift, PAD, lot.x, 0, lot.z);
  return { ground, extent };
}
