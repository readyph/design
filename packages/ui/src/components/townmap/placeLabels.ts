/**
 * Label collision pass for TownMap (RDY-276). Pure: no DOM. Each label sits above its building's roof; the pass
 * puts every label at the nearest free spot (up first, then sideways), always inside the map, with a 1px stem that
 * still leads to the roof. Selected labels and labels with a count are placed first, so they keep their spot.
 */
export interface LabelBox {
  id: string;
  /** Anchor (roof point) in map pixels. */
  ax: number;
  ay: number;
  /** Label size in px. */
  w: number;
  h: number;
  /** Higher = placed first. */
  priority?: number;
}
export interface PlacedLabel extends LabelBox {
  /** Top-left corner of the label. */
  x: number;
  y: number;
  /** Stem: length from the label's bottom edge down to the roof, and its x inside the label. */
  stem: number;
  stemX: number;
  /** Overlap area left with already placed labels (0 = clean). */
  overlap: number;
}

const GAP = 4;
const EDGE = 8;

export function placeLabels(boxes: readonly LabelBox[], width: number, height: number): PlacedLabel[] {
  const W = width;
  const H = height;
  const fitX = (x: number, w: number) => Math.max(EDGE, Math.min(W - w - EDGE, x));
  const fitY = (y: number, h: number) => Math.max(4, Math.min(H - h - 4, y));
  const clampX = (x: number) => Math.max(EDGE, Math.min(W - EDGE, x));
  const order = [...boxes].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || b.ay - a.ay);
  const placed: PlacedLabel[] = [];
  const over = (x: number, y: number, w: number, h: number) => {
    let area = 0;
    for (const p of placed) {
      const ox = Math.min(x + w + GAP, p.x + p.w) - Math.max(x, p.x - GAP);
      const oy = Math.min(y + h + GAP, p.y + p.h) - Math.max(y, p.y - GAP);
      if (ox > 0 && oy > 0) area += ox * oy;
    }
    return area;
  };
  for (const b of order) {
    const x0 = fitX(b.ax - b.w / 2, b.w);
    const y0 = b.ay - b.h - 12;
    // the prototype's search (map.js placeLabels), so labels land where the workshop page puts them
    const dys = [0, -0.5, -1, -1.5, -2, -3, 0.5, 1, 1.5, 2].map((k) => k * (b.h + GAP));
    const dxs = [0, -0.3, 0.3, -0.55, 0.55, -0.8, 0.8, -1.1, 1.1, -1.5, 1.5].map((k) => k * b.w);
    let best: { x: number; y: number; cost: number; o: number } | null = null;
    for (const dy of dys) {
      for (const dx of dxs) {
        const x = fitX(x0 + dx, b.w);
        const y = fitY(y0 + dy, b.h);
        const o = over(x, y, b.w, b.h);
        const cost = o * 1000 + Math.abs(x - x0) + Math.abs(y - y0) * 1.4 + (y > y0 ? 40 : 0);
        if (!best || cost < best.cost) best = { x, y, cost, o };
        if (o === 0 && dx === 0) break;
      }
    }
    const { x, y, o } = best!;
    placed.push({
      ...b,
      x,
      y,
      overlap: o,
      stem: Math.max(0, Math.min(H, Math.round(b.ay - y - b.h))),
      stemX: Math.round(Math.max(8, Math.min(b.w - 8, clampX(b.ax) - x))),
    });
  }
  return placed;
}
