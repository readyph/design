/**
 * PROTOTYPE (RDY-224) - Zdog building art for the Lab platform town.
 * World axes: x right, z toward the viewer, y down (so heights are negative).
 * Every builder returns marker anchors the scene projects to screen space for
 * the 2D overlay (signs, alert badges) and hit testing.
 *
 * The camera is fixed (front = +z faces lower-left, +x faces lower-right), so
 * each building only draws its visible faces in painter order inside a
 * non-sorting group. That keeps doors and windows on top of their wall and
 * lets every face carry a thick outline - Zdog cannot outline a filled shape
 * in a second colour, so the outline is its own stroke drawn right after.
 */
import * as Zdog from 'zdog';
import type { PlacedBuilding, TownLink } from './layout';
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

function tone(c: RGB, look: Look, extraShade = 0): string {
  const dim = 0.16 * (1 - look.glow);
  return css(mix(c, look.p.shade, Math.min(1, dim + extraShade)));
}

function marker(addTo: Zdog.Anchor, x: number, y: number, z: number): Projected {
  return new Zdog.Anchor({ addTo, translate: { x, y, z } }) as Projected;
}

type P = Zdog.VectorOptions;

/** Filled face plus a darker outline stroke. */
function face(addTo: Zdog.Anchor, path: P[], fill: string, outline: string) {
  new Zdog.Shape({ addTo, path, closed: true, fill: true, stroke: false, color: fill });
  new Zdog.Shape({ addTo, path, closed: true, fill: false, stroke: 2.5, color: outline });
}

function edge(c: RGB, look: Look) {
  return tone(c, look, 0.45);
}

/**
 * A box resting on `baseY` (ground = 0): front (+z), right (+x) and top faces,
 * shaded front 6%, side 18%, with outlines. Hidden faces are never drawn.
 */
function block(addTo: Zdog.Anchor, look: Look, c: RGB, w: number, h: number, d: number, x = 0, baseY = 0, z = 0) {
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2, y0 = baseY, y1 = baseY - h;
  const o = edge(c, look);
  face(addTo, [{ x: x0, y: y0, z: z1 }, { x: x1, y: y0, z: z1 }, { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z1 }], tone(c, look, 0.06), o);
  face(addTo, [{ x: x1, y: y0, z: z1 }, { x: x1, y: y0, z: z0 }, { x: x1, y: y1, z: z0 }, { x: x1, y: y1, z: z1 }], tone(c, look, 0.18), o);
  face(addTo, [{ x: x0, y: y1, z: z0 }, { x: x1, y: y1, z: z0 }, { x: x1, y: y1, z: z1 }, { x: x0, y: y1, z: z1 }], tone(c, look), o);
}

/** Window pane. `face` picks the wall plane: front (+z) or side (+x / -x). */
function pane(addTo: Zdog.Anchor, look: Look, w: number, h: number, x: number, y: number, z: number, face: 'front' | 'right' | 'left' = 'front') {
  const color = css(mix(look.p.windowOff, look.p.windowOn, look.glow));
  new Zdog.Rect({
    addTo,
    width: w,
    height: h,
    stroke: 1.5,
    fill: true,
    color,
    translate: { x, y, z },
    rotate: face === 'front' ? undefined : { y: TAU / 4 },
  });
}

/** Arched door on the front wall plane at depth `z`; `slats` draws roll-up door lines. */
function archDoor(addTo: Zdog.Anchor, look: Look, w: number, h: number, x: number, z: number, slats = 0) {
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
    stroke: 1.5,
    color: tone(look.p.door, look),
  });
  if (slats > 0) {
    const path: Zdog.PathCommand[] = [];
    for (let i = 1; i <= slats; i++) {
      const y = -((h - r) * i) / (slats + 1);
      path.push({ move: { x: -r + 2, y } }, { line: { x: r - 2, y } });
    }
    new Zdog.Shape({ addTo, translate: { x, z: z + 0.3 }, path, closed: false, stroke: 1, color: tone(look.p.door, look, 0.3) });
  }
}

function lamp(addTo: Zdog.Anchor, look: Look, b: PlacedBuilding, x: number, roofY: number, z: number): Projected {
  new Zdog.Shape({ addTo, path: [{ x, y: roofY, z }, { x, y: roofY - 8, z }], stroke: 2, color: css(look.p.shade) });
  new Zdog.Shape({ addTo, translate: { x, y: roofY - 12, z }, stroke: 9, color: css(look.p.lamp[b.status]) });
  return marker(addTo, x, roofY - 12, z);
}

function corners(addTo: Zdog.Anchor, w: number, top: number, d: number): Projected[] {
  const out: Projected[] = [];
  for (const x of [-w / 2, w / 2]) for (const y of [0, top]) for (const z of [-d / 2, d / 2]) out.push(marker(addTo, x, y, z));
  return out;
}

function warehouse(g: Zdog.Group, look: Look, b: PlacedBuilding): Omit<BuildingModel, 'id' | 'group'> {
  const { p } = look;
  const w = 78, h = 34, d = 50, ridge = 52, eave = 5;
  block(g, look, p.warehouseWall, w, h, d);
  archDoor(g, look, 26, 26, 0, d / 2 + 0.5, 4);
  for (const x of [-28, 28]) pane(g, look, 10, 8, x, -20, d / 2 + 0.5);
  pane(g, look, 14, 8, w / 2 + 0.5, -20, 0, 'right');
  // Long gabled roof along x: right gable, back slope, then front slope over it.
  const W = w / 2 + 3, D = d / 2 + eave, ey = -h + 3, o = edge(p.warehouseRoof, look);
  face(g, [{ x: w / 2, y: -h, z: -d / 2 }, { x: w / 2, y: -h, z: d / 2 }, { x: w / 2, y: -ridge + 2, z: 0 }], tone(p.warehouseWall, look, 0.18), edge(p.warehouseWall, look));
  face(g, [{ x: -W, y: ey, z: -D }, { x: W, y: ey, z: -D }, { x: W, y: -ridge, z: 0 }, { x: -W, y: -ridge, z: 0 }], tone(p.warehouseRoof, look, 0.14), o);
  face(g, [{ x: -W, y: ey, z: D }, { x: W, y: ey, z: D }, { x: W, y: -ridge, z: 0 }, { x: -W, y: -ridge, z: 0 }], tone(p.warehouseRoof, look), o);
  const lampAt = lamp(g, look, b, w / 2 - 12, -ridge, 0);
  return { signAt: marker(g, 0, 0, d / 2 + 14), lampAt, corners: corners(g, w + 6, -ridge - 18, d + eave * 2) };
}

function shop(g: Zdog.Group, look: Look, b: PlacedBuilding): Omit<BuildingModel, 'id' | 'group'> {
  const { p } = look;
  const w = 54, h = 40, d = 54;
  block(g, look, p.shopWall, w, h, d);
  archDoor(g, look, 18, 24, 0, d / 2 + 0.5);
  // Small shop sign above the door.
  face(g, [{ x: -15, y: -29, z: d / 2 + 0.5 }, { x: 15, y: -29, z: d / 2 + 0.5 }, { x: 15, y: -35, z: d / 2 + 0.5 }, { x: -15, y: -35, z: d / 2 + 0.5 }], tone(p.shopSign, look), edge(p.shopSign, look));
  for (const x of [-18, 18]) pane(g, look, 9, 9, x, -15, d / 2 + 0.5);
  pane(g, look, 16, 10, w / 2 + 0.5, -18, 0, 'right');
  block(g, look, p.shopRoof, w + 6, 5, d + 6, 0, -h);
  const lampAt = lamp(g, look, b, w / 2 - 12, -h - 5, -d / 2 + 12);
  return { signAt: marker(g, 0, 0, d / 2 + 14), lampAt, corners: corners(g, w + 6, -h - 22, d + 6) };
}

function store(g: Zdog.Group, look: Look, b: PlacedBuilding): Omit<BuildingModel, 'id' | 'group'> {
  const { p } = look;
  const w = 60, h = 32, d = 46, stripes = 5, reach = 12;
  block(g, look, p.storeWall, w, h, d);
  for (const x of [-18, 18]) pane(g, look, 16, 10, x, -10, d / 2 + 0.5);
  archDoor(g, look, 12, 18, 0, d / 2 + 0.5);
  pane(g, look, 14, 9, w / 2 + 0.5, -15, 0, 'right');
  block(g, look, p.storeRoof, w + 4, 4, d + 4, 0, -h);
  // Striped awning sloping out over the shop front.
  const sw = w / stripes;
  for (let i = 0; i < stripes; i++) {
    const x0 = -w / 2 + i * sw;
    const c = i % 2 === 0 ? p.awning : p.awningAlt;
    face(g, [{ x: x0, y: -h + 5, z: d / 2 }, { x: x0 + sw, y: -h + 5, z: d / 2 }, { x: x0 + sw, y: -h + 13, z: d / 2 + reach }, { x: x0, y: -h + 13, z: d / 2 + reach }], tone(c, look), edge(p.awning, look));
  }
  const lampAt = lamp(g, look, b, w / 2 - 10, -h - 4, -d / 2 + 10);
  return { signAt: marker(g, 0, 0, d / 2 + 16), lampAt, corners: corners(g, w + 4, -h - 22, d + reach * 2) };
}

/** One building as a painter-ordered Zdog group placed at its grid cell. */
export function buildBuilding(addTo: Zdog.Anchor, p: TownPalette, b: PlacedBuilding, glow: number): BuildingModel {
  const look: Look = { p, glow };
  const group = new Zdog.Group({ addTo, translate: { x: b.x, z: b.z } });
  const art = b.art === 'warehouse' ? warehouse(group, look, b) : b.art === 'shop' ? shop(group, look, b) : store(group, look, b);
  return { id: b.id, group, ...art };
}

/** Portal HQ in the centre cell: small blue-roofed block, lights always on. */
export function buildHq(addTo: Zdog.Anchor, p: TownPalette, at: { x: number; z: number }): { signAt: Projected; corners: Projected[] } {
  const look: Look = { p, glow: 1 };
  const g = new Zdog.Group({ addTo, translate: at });
  const s = 44, h = 34, peak = 22;
  block(g, look, p.hqWall, s, h, s);
  for (const x of [-12, 12]) for (const y of [-12, -24]) pane(g, look, 8, 7, x, y, s / 2 + 0.5);
  for (const z of [-10, 10]) for (const y of [-12, -24]) pane(g, look, 8, 7, s / 2 + 0.5, y, z, 'right');
  archDoor(g, look, 10, 16, 0, s / 2 + 0.5);
  const e = s / 2 + 4;
  const ring = [{ x: -e, z: e }, { x: e, z: e }, { x: e, z: -e }, { x: -e, z: -e }];
  // Back and left roof faces first, then right and front.
  for (const i of [2, 3, 1, 0]) {
    const a = ring[i];
    const c = ring[(i + 1) % 4];
    face(g, [{ x: a.x, y: -h + 2, z: a.z }, { x: c.x, y: -h + 2, z: c.z }, { x: 0, y: -h - peak, z: 0 }], tone(p.hqRoof, look, i === 1 ? 0.16 : 0), edge(p.hqRoof, look));
  }
  return { signAt: marker(g, 0, 0, s / 2 + 14), corners: corners(g, s + 8, -h - peak, s + 8) };
}

/** Where a road or footpath meets a building: just in front of its door. */
export function frontOf(b: { x: number; z: number }): Zdog.VectorOptions {
  return { x: b.x, y: 0, z: b.z + 34 };
}

function bezier(p0: Zdog.VectorOptions, p3: Zdog.VectorOptions): { c1: Zdog.VectorOptions; c2: Zdog.VectorOptions; at: (t: number) => { x: number; z: number } } {
  const x0 = p0.x ?? 0, z0 = p0.z ?? 0, x3 = p3.x ?? 0, z3 = p3.z ?? 0;
  const len = Math.hypot(x3 - x0, z3 - z0) || 1;
  // Bow the road sideways by a fifth of its length for a soft curve.
  const mx = (x0 + x3) / 2 + (-(z3 - z0) / len) * len * 0.2;
  const mz = (z0 + z3) / 2 + ((x3 - x0) / len) * len * 0.2;
  const c1 = { x: x0 + ((mx - x0) * 2) / 3, z: z0 + ((mz - z0) * 2) / 3 };
  const c2 = { x: x3 + ((mx - x3) * 2) / 3, z: z3 + ((mz - z3) * 2) / 3 };
  const at = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * u * x0 + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * x3,
      z: u * u * u * z0 + 3 * u * u * t * c1.z + 3 * u * t * t * c2.z + t * t * t * z3,
    };
  };
  return { c1, c2, at };
}

/**
 * Ground layer: grass plot, HQ footpaths, roads with dashed centre lines and
 * soft building shadows. Rendered in insertion order, always behind buildings.
 */
export function buildGround(
  addTo: Zdog.Anchor,
  p: TownPalette,
  plot: { width: number; depth: number },
  placed: readonly PlacedBuilding[],
  links: readonly TownLink[],
  hq: { x: number; z: number } | null,
): { ground: Zdog.Group; extent: Projected[] } {
  const ground = new Zdog.Group({ addTo });
  const r = plot.width / 2, q = plot.depth / 2, t = 14;
  const look: Look = { p, glow: 1 };
  const side = (c: RGB) => css(mix(c, p.shade, 0.12));
  face(ground, [{ x: -r, y: 0, z: q }, { x: r, y: 0, z: q }, { x: r, y: t, z: q }, { x: -r, y: t, z: q }], css(p.grassEdge), side(p.grassEdge));
  face(ground, [{ x: r, y: 0, z: q }, { x: r, y: 0, z: -q }, { x: r, y: t, z: -q }, { x: r, y: t, z: q }], side(p.grassEdge), side(p.grassEdge));
  face(ground, [{ x: -r, y: 0, z: -q }, { x: r, y: 0, z: -q }, { x: r, y: 0, z: q }, { x: -r, y: 0, z: q }], css(p.grass), edge(p.grass, look));
  const extent = [marker(ground, -r, 0, -q), marker(ground, r, t, q), marker(ground, -r, t, q), marker(ground, r, t, -q)];
  const flat = ground;
  for (const b of placed) {
    new Zdog.Rect({ addTo: flat, width: 70, height: 56, stroke: 10, fill: true, color: css(p.grassShadow), translate: { x: b.x + 6, y: -0.2, z: b.z + 4 }, rotate: { x: TAU / 4 } });
  }
  if (hq) {
    new Zdog.Rect({ addTo: flat, width: 50, height: 50, stroke: 10, fill: true, color: css(p.grassShadow), translate: { x: hq.x + 6, y: -0.2, z: hq.z + 4 }, rotate: { x: TAU / 4 } });
    const hqFront = frontOf({ x: hq.x, z: hq.z - 8 });
    for (const b of placed) {
      new Zdog.Shape({ addTo: flat, path: [{ ...hqFront, y: -0.4 }, { ...frontOf(b), y: -0.4 }], stroke: 4, color: css(p.footpath) });
    }
  }
  const byId = new Map(placed.map((b) => [b.id, b]));
  for (const l of links) {
    const a = byId.get(l.from);
    const b = byId.get(l.to);
    if (!a || !b) continue;
    const p0 = frontOf(a);
    const p3 = frontOf(b);
    const { c1, c2, at } = bezier(p0, p3);
    const y = -0.8;
    new Zdog.Shape({
      addTo: flat,
      path: [{ ...p0, y }, { bezier: [{ ...c1, y }, { ...c2, y }, { ...p3, y }] }],
      closed: false,
      stroke: 13,
      color: css(p.road),
    });
    const dashes: Zdog.PathCommand[] = [];
    const n = 24;
    for (let i = 1; i < n - 1; i += 2) {
      const s = at(i / n);
      const e = at((i + 0.9) / n);
      dashes.push({ move: { x: s.x, y: y - 0.4, z: s.z } }, { line: { x: e.x, y: y - 0.4, z: e.z } });
    }
    new Zdog.Shape({ addTo: flat, path: dashes, closed: false, stroke: 1.6, color: css(p.roadMark) });
  }
  return { ground, extent };
}
