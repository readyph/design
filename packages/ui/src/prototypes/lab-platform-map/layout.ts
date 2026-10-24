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
  /** World position of the footprint centre on the ground plane. */
  x: number;
  z: number;
}

/** One grid cell in world units (Zdog px before zoom). */
export const CELL = 122;
/** Grass margin around the outer ring of cells. */
export const PLOT_MARGIN = 24;

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

/** Near-square grid with one extra cell for Portal HQ: 1 platform = 2x1, 5 = 3x2, 20 = 5x5. */
export function gridSize(count: number): { cols: number; rows: number } {
  const cells = count + 1;
  const cols = Math.ceil(Math.sqrt(cells));
  return { cols, rows: Math.ceil(cells / cols) };
}

export interface TownLayout {
  cols: number;
  rows: number;
  /** Portal HQ position (the cell nearest the plot centre). */
  hq: { x: number; z: number };
  placed: PlacedBuilding[];
}

/**
 * Places buildings on a compact grid around Portal HQ, which takes the cell
 * nearest the plot centre. Cells are filled nearest-to-HQ first and, at equal
 * distance, front first (+x, +z face the viewer), so any spare cells end up at
 * the back of the plot and the grass never looks empty up front.
 */
export function placeBuildings(buildings: readonly TownBuilding[]): TownLayout {
  const { cols, rows } = gridSize(buildings.length);
  const cx = (cols - 1) / 2;
  const cz = (rows - 1) / 2;
  const hi = Math.floor(cx);
  const hj = Math.floor(cz);
  const cells: { i: number; j: number; dist: number; front: number; dx: number }[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (i === hi && j === hj) continue;
      const dx = i - hi;
      const dz = j - hj;
      cells.push({ i, j, dist: Math.max(Math.abs(dx), Math.abs(dz)), front: dx + dz, dx });
    }
  }
  cells.sort((p, q) => p.dist - q.dist || q.front - p.front || q.dx - p.dx);
  const at = (i: number, j: number) => ({ x: (i - cx) * CELL, z: (j - cz) * CELL });
  const placed = sortBuildings(buildings).map((b, k) => ({ ...b, art: artFor(b.kind), ...at(cells[k].i, cells[k].j) }));
  return { cols, rows, hq: at(hi, hj), placed };
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

/** Grass plot size in world units. */
export function plotSize(cols: number, rows: number): { width: number; depth: number } {
  return { width: cols * CELL + PLOT_MARGIN * 2, depth: rows * CELL + PLOT_MARGIN * 2 };
}
