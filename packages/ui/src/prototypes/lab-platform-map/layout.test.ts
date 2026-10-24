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

  it('sizes a compact grid ', () => {
    expect(gridSize(1)).toEqual({ cols: 1, rows: 1 });
    expect(gridSize(5)).toEqual({ cols: 3, rows: 2 });
    expect(gridSize(8)).toEqual({ cols: 3, rows: 3 });
    expect(gridSize(20)).toEqual({ cols: 5, rows: 4 });
  });

  it('never places two buildings on one lot, and leaves the rest as spare lots', () => {
    const { placed, empty } = placeBuildings(TWENTY);
    expect(new Set(placed.map((b) => `${b.x},${b.z}`)).size).toBe(20);
    expect(empty).toHaveLength(0);
    const five = placeBuildings(MIXED);
    expect(five.empty).toHaveLength(1);
    expect([...five.placed, ...five.empty].map((c) => `${c.x},${c.z}`)).toHaveLength(6);
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
