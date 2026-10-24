import { describe, expect, it } from 'vitest';
import {
  DRIVE_HALF, LOT_EDGE, LOT_GAP, ROAD_HALF, TILE, TILE_H, TILE_W, TREE_MARGIN, artFor, dealBuildings, dedupeLinks, defaultLights, distToRect, hash01,
  planTown, rectGap, rotY, routeFor, sortBuildings, tiltFor, type TownBuilding,
} from './layout';
import { MIXED, MIXED_LINKS, SINGLE, TWENTY, TWENTY_LINKS } from './town-data';

const sets: [string, TownBuilding[]][] = [['1', SINGLE], ['5', MIXED], ['20', TWENTY]];

describe('lab platform town: projection', () => {
  it('derives the tilt from the tile: 64x32 is 30 degrees, flatter tiles flatten the view', () => {
    expect((tiltFor(TILE_W, TILE_H) * 180) / Math.PI).toBeCloseTo(30, 6);
    expect((tiltFor(64, 32) * 180) / Math.PI).toBeCloseTo(30, 6);
    expect((tiltFor(64, 24) * 180) / Math.PI).toBeCloseTo(22.02, 1);
    expect(tiltFor(64, 24)).toBeLessThan(tiltFor(64, 32));
  });
});

describe('lab platform town: U-shaped road and frontage lots', () => {
  it('maps kinds to building art and orders by kind then label', () => {
    expect(artFor('inventory')).toBe('warehouse');
    expect(artFor('sms')).toBe('shop');
    expect(artFor('pos')).toBe('store');
    expect(sortBuildings(MIXED).map((b) => b.id)).toEqual(['inv-cebu', 'inv-davao', 'sms-davao', 'sms-makati', 'pos-ortigas']);
  });

  it('puts the Mixed tenant in the target picture: W R / R W / Store Park', () => {
    const plan = planTown(MIXED);
    const kinds = plan.placed.map((b) => `${b.segment}-${b.side}:${b.art}`);
    expect(dealBuildings(MIXED).map((b) => b.kind)).toEqual(['inventory', 'sms', 'sms', 'inventory', 'pos']);
    expect(kinds).toEqual(['top-out:warehouse', 'top-out:shop', 'top-in:shop', 'top-in:warehouse', 'bottom-in:store']);
    expect(plan.parks).toHaveLength(1);
    expect(plan.placed.slice(0, 2).every((b) => b.z < plan.road[0].z)).toBe(true);
    expect(plan.scenery.pond!.z).toBeGreaterThan(plan.placed[4].z);
  });

  it('gives a single platform one lot on the top arm', () => {
    const plan = planTown(SINGLE);
    expect(plan.placed).toHaveLength(1);
    expect(plan.placed[0]).toMatchObject({ segment: 'top', side: 'out', yaw: 0 });
    expect(plan.parks).toHaveLength(0);
  });

  it.each(sets)('plans %s platforms: set back from the curb, 2 tile gaps, nothing overlapping, deterministic', (_n, set) => {
    const plan = planTown(set);
    expect(plan.placed).toHaveLength(set.length);
    expect(planTown(set).placed.map((b) => [b.x, b.z, b.yaw])).toEqual(plan.placed.map((b) => [b.x, b.z, b.yaw]));
    const lots = [...plan.placed, ...plan.parks];
    for (const b of lots) {
      const edge = Math.min(...plan.road.map((r) => distToRect(r, b)));
      expect(edge).toBeCloseTo(LOT_EDGE, 3); // road half width + 0.5 tile gap
      expect(b.w).toBe(3 * TILE);
      expect(b.d).toBe(2 * TILE);
    }
    for (let i = 0; i < lots.length; i++) for (let j = i + 1; j < lots.length; j++) expect(rectGap(lots[i], lots[j])).toBeGreaterThanOrEqual(LOT_GAP - 1e-6);
    // Road keeps its width: no lot corner inside the tarmac.
    for (const b of lots) for (const r of plan.road) expect(distToRect(r, b)).toBeGreaterThanOrEqual(ROAD_HALF);
  });

  it.each(sets)('%s platforms: doors face the road, every lot has a straight driveway', (_n, set) => {
    const plan = planTown(set);
    for (const b of plan.placed) {
      const f = rotY({ x: 0, z: 1 }, b.yaw);
      expect(Math.abs(f.x)).toBeLessThan(1e-9); // 90 degree steps only
      const near = plan.road.reduce((a, r) => (Math.hypot(r.x - b.x, r.z - b.z) < Math.hypot(a.x - b.x, a.z - b.z) ? r : a));
      expect(f.x * (near.x - b.x) + f.z * (near.z - b.z)).toBeGreaterThan(0);
      const dv = plan.driveways[b.id];
      expect(dv[0]).toEqual(plan.road[plan.junction[b.id]]);
      expect(dv.every((q) => q.x === dv[0].x)).toBe(true); // perpendicular to the top / bottom arm
      expect(distToRect(dv[dv.length - 1], b)).toBeLessThan(1e-6);
    }
    expect(DRIVE_HALF).toBeGreaterThan(0);
  });

  it.each(sets)('%s platforms: trees, hedges, pond and lamps stay in leftover space', (_n, set) => {
    const plan = planTown(set);
    const lots = [...plan.placed, ...plan.parks];
    for (const t of plan.scenery.trees) {
      for (const b of lots) expect(distToRect(t, b)).toBeGreaterThanOrEqual(TREE_MARGIN - 1e-6);
      for (const r of plan.road) expect(Math.hypot(r.x - t.x, r.z - t.z)).toBeGreaterThanOrEqual(ROAD_HALF);
    }
    const pd = plan.scenery.pond!;
    for (const b of lots) expect(distToRect(pd, b)).toBeGreaterThanOrEqual(pd.r);
    for (const r of plan.road) expect(Math.hypot(r.x - pd.x, r.z - pd.z)).toBeGreaterThanOrEqual(ROAD_HALF + pd.r);
    // Lamps are evenly spaced along the road samples and never inside a lot.
    for (const l of plan.scenery.lamps) for (const b of lots) expect(distToRect(l, b)).toBeGreaterThan(0);
    expect(plan.scenery.lamps.length).toBeGreaterThan(2);
  });

  it('connects every link along the road', () => {
    for (const [set, links] of [[MIXED, MIXED_LINKS], [TWENTY, TWENTY_LINKS]] as const) {
      const plan = planTown(set);
      const byId = new Map(plan.placed.map((b) => [b.id, b]));
      for (const l of dedupeLinks(links, new Set(set.map((b) => b.id)))) {
        const pts = routeFor(plan, l.from, l.to);
        expect(distToRect(pts[0], byId.get(l.from)!)).toBeLessThan(1e-6);
        expect(distToRect(pts[pts.length - 1], byId.get(l.to)!)).toBeLessThan(1e-6);
        for (let i = 1; i < pts.length; i++) expect(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)).toBeLessThan(20);
      }
    }
  });

  it('dedupes reversed and self links, and starts lights off only for offline platforms', () => {
    const ids = new Set(MIXED.map((b) => b.id));
    expect(dedupeLinks(MIXED_LINKS, ids)).toHaveLength(2);
    expect(dedupeLinks([{ from: 'a', to: 'zzz' }], new Set(['a']))).toHaveLength(0);
    expect(defaultLights(MIXED)).toMatchObject({ 'inv-cebu': true, 'sms-makati': false });
    expect(hash01('a', 1)).toBe(hash01('a', 1));
  });
});
