import { describe, expect, it } from 'vitest';
import {
  DRIVE_HALF, ROAD_HALF, TURN_DEG, YAW_MAX_DEG, YAW_MIN_DEG, artFor, dedupeLinks, defaultLights, distToSite, hash01, planTown, routeFor, sitesOverlap, sortBuildings,
} from './layout';
import { MIXED, MIXED_LINKS, SINGLE, TWENTY, TWENTY_LINKS } from './town-data';

describe('lab platform town master plan', () => {
  it('maps kinds to building art', () => {
    expect(artFor('inventory')).toBe('warehouse');
    expect(artFor('sms')).toBe('shop');
    expect(artFor('pos')).toBe('store');
  });

  it('orders by kind (inventory, sms, others) then label', () => {
    expect(sortBuildings(MIXED).map((b) => b.id)).toEqual(['inv-cebu', 'inv-davao', 'sms-davao', 'sms-makati', 'pos-ortigas']);
  });

  it.each([['1', SINGLE], ['5', MIXED], ['20', TWENTY]])('plans %s platforms: no overlaps, clear of the road, deterministic', (_n, set) => {
    const plan = planTown(set);
    expect(plan.placed).toHaveLength(set.length);
    expect(planTown(set).placed.map((b) => [b.x, b.z, b.yaw, b.w, b.d, b.lift])).toEqual(plan.placed.map((b) => [b.x, b.z, b.yaw, b.w, b.d, b.lift]));
    const { placed } = plan;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) expect(sitesOverlap(placed[i], placed[j], 20)).toBe(false);
      for (const r of plan.road) expect(distToSite(r, placed[i])).toBeGreaterThanOrEqual(ROAD_HALF);
    }
    // Trees and the pond stay on free ground.
    for (const t of plan.scenery.trees) for (const b of placed) expect(distToSite(t, b)).toBeGreaterThan(10);
  });

  it('keeps every facade toward the viewer: scene turn plus site yaw stays in 0..45 degrees', () => {
    for (const b of planTown(TWENTY).placed) {
      const deg = TURN_DEG + (b.yaw * 180) / Math.PI;
      expect(deg).toBeGreaterThanOrEqual(TURN_DEG + YAW_MIN_DEG - 1e-6);
      expect(deg).toBeLessThanOrEqual(TURN_DEG + YAW_MAX_DEG + 1e-6);
      expect(deg).toBeGreaterThanOrEqual(0);
      expect(deg).toBeLessThanOrEqual(45);
    }
  });

  it('is organic: sites differ in size, yaw, depth and height, and do not line up', () => {
    const { placed } = planTown(TWENTY);
    expect(new Set(placed.map((b) => b.w)).size).toBeGreaterThan(5);
    expect(new Set(placed.map((b) => b.yaw)).size).toBeGreaterThan(10);
    expect(new Set(placed.map((b) => Math.round(b.x / 10))).size).toBeGreaterThan(14);
    expect(new Set(placed.map((b) => b.lift)).size).toBeGreaterThan(1);
    const one = planTown(SINGLE).placed[0];
    expect(one.lift).toBe(0);
  });

  it('gives every site a driveway from the road, and connects every link', () => {
    for (const [set, links] of [[MIXED, MIXED_LINKS], [TWENTY, TWENTY_LINKS]] as const) {
      const plan = planTown(set);
      const byId = new Map(plan.placed.map((b) => [b.id, b]));
      for (const b of plan.placed) {
        const dv = plan.driveways[b.id];
        const first = dv[0], last = dv[dv.length - 1];
        const road = plan.road[plan.junction[b.id]];
        expect(Math.hypot(first.x - road.x, first.z - road.z)).toBeLessThan(1e-6);
        expect(distToSite(last, b)).toBeLessThan(DRIVE_HALF);
      }
      for (const l of dedupeLinks(links, new Set(set.map((b) => b.id)))) {
        const pts = routeFor(plan, l.from, l.to);
        expect(distToSite(pts[0], byId.get(l.from)!)).toBeLessThan(DRIVE_HALF);
        expect(distToSite(pts[pts.length - 1], byId.get(l.to)!)).toBeLessThan(DRIVE_HALF);
        for (let i = 1; i < pts.length; i++) expect(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z)).toBeLessThan(40);
      }
    }
  });

  it('dedupes reversed and self links', () => {
    const ids = new Set(MIXED.map((b) => b.id));
    expect(dedupeLinks(MIXED_LINKS, ids)).toHaveLength(2);
    expect(dedupeLinks([{ from: 'a', to: 'zzz' }], new Set(['a']))).toHaveLength(0);
  });

  it('starts with lights off only for offline platforms', () => {
    expect(defaultLights(MIXED)).toMatchObject({ 'inv-cebu': true, 'sms-makati': false });
    expect(hash01('a', 1)).toBe(hash01('a', 1));
  });
});
