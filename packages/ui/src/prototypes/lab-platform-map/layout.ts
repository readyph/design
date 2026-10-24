/**
 * PROTOTYPE (RDY-224) - pure layout for the Lab platform town: grid placement,
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

export interface PlacedBuilding extends TownBuilding {
  art: BuildingArt;
  /** World position of the lot centre on the ground plane. */
  x: number;
  z: number;
}

/** One lot (building plot plus its share of the street) in world units, before zoom. */
export const CELL = 150;
/** Street width between lots. */
export const STREET = 34;
/** Scenery band (houses, trees, pond) around the streets. */
export const PLOT_MARGIN = 56;

const KIND_ORDER = ['inventory', 'sms'];

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

/** Near-square grid: 1 platform = 1x1, 5 = 3x2, 8 = 3x3, 20 = 5x4. */
export function gridSize(count: number): { cols: number; rows: number } {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  return { cols, rows: Math.max(1, Math.ceil(count / cols)) };
}

export interface TownLayout {
  cols: number;
  rows: number;
  placed: PlacedBuilding[];
  /** Spare lots in the last row: the scene turns them into small parks. */
  empty: { x: number; z: number }[];
}

/**
 * Fills the grid row by row from the back-left lot, in sorted order, so kinds
 * sit together. Spare lots stay in the last row (front-right).
 */
export function placeBuildings(buildings: readonly TownBuilding[]): TownLayout {
  const { cols, rows } = gridSize(buildings.length);
  const at = (i: number, j: number) => ({ x: (i - (cols - 1) / 2) * CELL, z: (j - (rows - 1) / 2) * CELL });
  const placed = sortBuildings(buildings).map((b, k) => ({ ...b, art: artFor(b.kind), ...at(k % cols, Math.floor(k / cols)) }));
  const empty: { x: number; z: number }[] = [];
  for (let k = buildings.length; k < cols * rows; k++) empty.push(at(k % cols, Math.floor(k / cols)));
  return { cols, rows, placed, empty };
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

/** Street area (all lots plus the outer street edge) in world units. */
export function streetSize(cols: number, rows: number): { width: number; depth: number } {
  return { width: cols * CELL + STREET, depth: rows * CELL + STREET };
}

/** Whole island (streets plus scenery band) in world units. */
export function plotSize(cols: number, rows: number): { width: number; depth: number } {
  const s = streetSize(cols, rows);
  return { width: s.width + PLOT_MARGIN * 2, depth: s.depth + PLOT_MARGIN * 2 };
}
