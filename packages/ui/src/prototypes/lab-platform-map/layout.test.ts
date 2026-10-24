import { describe, expect, it } from 'vitest';
import { artFor, dedupeLinks, defaultLights, gridSize, placeBuildings, sortBuildings } from './layout';
import { MIXED, MIXED_LINKS, TWENTY } from './town-data';

describe('lab platform town layout', () => {
  it('maps kinds to building art', () => {
    expect(artFor('inventory')).toBe('warehouse');
    expect(artFor('sms')).toBe('shop');
    expect(artFor('pos')).toBe('store');
  });

  it('orders by kind (inventory, sms, others) then label', () => {
    expect(sortBuildings(MIXED).map((b) => b.id)).toEqual(['inv-cebu', 'inv-davao', 'sms-davao', 'sms-makati', 'pos-ortigas']);
  });

  it('sizes a compact grid with one cell for HQ', () => {
    expect(gridSize(1)).toEqual({ cols: 2, rows: 1 });
    expect(gridSize(5)).toEqual({ cols: 3, rows: 2 });
    expect(gridSize(8)).toEqual({ cols: 3, rows: 3 });
    expect(gridSize(20)).toEqual({ cols: 5, rows: 5 });
  });

  it('never places a building on HQ or on another building', () => {
    const { placed, hq } = placeBuildings(TWENTY);
    const cells = placed.map((b) => `${b.x},${b.z}`);
    expect(new Set(cells).size).toBe(20);
    expect(cells).not.toContain(`${hq.x},${hq.z}`);
  });

  it('dedupes reversed and self links', () => {
    const ids = new Set(MIXED.map((b) => b.id));
    expect(dedupeLinks(MIXED_LINKS, ids)).toHaveLength(2);
    expect(dedupeLinks([{ from: 'a', to: 'zzz' }], new Set(['a']))).toHaveLength(0);
  });

  it('starts with lights off only for offline platforms', () => {
    expect(defaultLights(MIXED)).toMatchObject({ 'inv-cebu': true, 'sms-makati': false });
  });
});
