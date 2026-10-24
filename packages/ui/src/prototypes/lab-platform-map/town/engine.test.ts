// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultLights, typeFor, type TownBuilding } from '../TownScene';
import { SVG_NS, type Plat } from './core';
import { Engine } from './engine';
import { connectionsFor, gatePoint, gridFor, route } from './links';
import * as pal from './palette';
import { MIXED, MIXED_LINKS, SINGLE, THREE, THREE_LINKS, TWENTY, TWENTY_LINKS } from './sample-data';

const layer = () => document.createElementNS(SVG_NS, 'g') as SVGGElement;
const plat = (b: TownBuilding): Plat => ({ id: b.id, type: typeFor(b.kind), name: b.label, sub: b.kind, badge: 'XX', lights: b.status !== 'OFFLINE', alerts: b.alerts, status: b.status });
function build(buildings: TownBuilding[], links: { from: string; to: string }[], quarter = 0) {
  const L = { base: layer(), links: layer(), glowl: layer(), objects: layer(), labels: layer() };
  const e = new Engine(L);
  e.render(buildings.map(plat), links);
  e.setThetaNow((quarter * Math.PI) / 2);
  e.frame(1000);
  return { e, L };
}

const sets: [string, TownBuilding[], { from: string; to: string }[]][] = [
  ['1', SINGLE, []], ['3', THREE, THREE_LINKS], ['5', MIXED, MIXED_LINKS], ['20', TWENTY, TWENTY_LINKS],
];

describe('town scene: placement and drawing', () => {
  it.each(sets)('lays out %s platforms on a near-square grid, one plot each', (_n, set, links) => {
    const { e } = build(set, links);
    const G = gridFor(set.length);
    expect(G.cols * G.rows).toBeGreaterThanOrEqual(set.length);
    expect(Math.abs(G.cols - G.rows)).toBeLessThanOrEqual(1);
    expect(Object.keys(e.info)).toHaveLength(set.length);
    expect(new Set(Object.values(e.info).map((i) => `${i.c},${i.r}`)).size).toBe(set.length);
    expect(e.labels).toHaveLength(set.length);
  });

  it.each(sets)('draws %s platforms at four camera angles without NaN, with every object painted', (_n, set, links) => {
    for (const q of [0, 1, 2, 3]) {
      const { e, L } = build(set, links, q);
      const html = L.base.innerHTML + L.objects.innerHTML + L.links.innerHTML + L.labels.innerHTML;
      expect(html).not.toMatch(/NaN|undefined|Infinity/);
      expect(L.objects.children).toHaveLength(e.ctx.objects.length);
      expect(L.labels.querySelectorAll('.label')).toHaveLength(set.length);
    }
  });

  it('connections: one road per pair, every route is Manhattan and runs gate to gate', () => {
    for (const [, set, links] of sets) {
      const { e } = build(set, links);
      const ids = new Set(set.map((b) => b.id));
      expect(e.conns.map((c) => c.id)).toEqual(connectionsFor(links, ids).map((c) => c.id));
      const G = e.gridInfo;
      for (const c of e.conns) {
        const A = gatePoint(e.info[c.from], G), B = gatePoint(e.info[c.to], G);
        expect(c.route).toEqual(route(A, B, G));
        for (let i = 1; i < c.route.length; i++) expect(c.route[i][0] === c.route[i - 1][0] || c.route[i][1] === c.route[i - 1][1]).toBe(true);
        expect(c.route.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('drops reversed duplicates, self links and links to unknown platforms', () => {
    const ids = new Set(['a', 'b']);
    expect(connectionsFor([{ from: 'a', to: 'b' }, { from: 'b', to: 'a' }, { from: 'a', to: 'a' }, { from: 'a', to: 'zzz' }], ids)).toHaveLength(1);
  });

  it('lights: ACTIVE and DEGRADED on, OFFLINE off, and the controlled map wins', () => {
    expect(defaultLights(MIXED)).toMatchObject({ 'inv-davao': true, 'inv-cebu': true, 'sms-makati': false });
    const { e, L } = build(THREE, THREE_LINKS);
    const before = L.objects.innerHTML;
    e.setLights({ sms: true });
    e.frame(1000);
    expect(e.plats.find((p) => p.id === 'sms')!.lights).toBe(true);
    expect(L.objects.innerHTML).not.toBe(before);
  });

  it('maps kinds to building types: inventory warehouse, sms service, store kinds store, anything else office', () => {
    expect([typeFor('inventory'), typeFor('sms'), typeFor('pos'), typeFor('storefront'), typeFor('other'), typeFor('clinic')]).toEqual(['warehouse', 'service', 'store', 'store', 'store', 'office']);
  });

  it('label anchor is a finite point for every platform and follows the camera', () => {
    const { e } = build(MIXED, MIXED_LINKS);
    const a = e.labelAnchor('inv-davao')!;
    expect(Number.isFinite(a.x) && Number.isFinite(a.y)).toBe(true);
    e.setThetaNow(Math.PI / 2);
    const b = e.labelAnchor('inv-davao')!;
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1);
    expect(e.labelAnchor('nope')).toBeNull();
  });

  it('dark mode remaps colours and keeps lights and link colours', () => {
    const { e, L } = build(THREE, THREE_LINKS);
    const light = L.objects.innerHTML;
    e.setDark(true);
    e.frame(1000);
    expect(L.objects.innerHTML).not.toBe(light);
    expect(pal.themed('fill="#FFD66B" stroke="#F59E0B"', true)).toBe('fill="#FFD66B" stroke="#F59E0B"');
    expect(pal.themed('fill="#FFFFFF"', true)).toBe('fill="#34425C"');
  });
});

describe('town scene: palette follows the tokens', () => {
  const css = readFileSync(resolve(__dirname, '../../../styles/theme.css'), 'utf8');
  const light = css.split('[data-theme="dark"]')[0];
  const hex = (name: string) => {
    const m = light.match(new RegExp(`\\n\\s*--ds-${name}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)`));
    return m ? '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase() : null;
  };
  it('primary scale, ink and ink-muted equal the light token values', () => {
    expect([pal.P50, pal.P100, pal.P200, pal.P300, pal.P400, pal.P500, pal.P600, pal.P700, pal.P800, pal.P900]).toEqual(
      [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => hex(`primary-${n}`)),
    );
    expect(pal.INK).toBe(hex('ink'));
    expect(pal.INK_M).toBe(hex('ink-muted'));
  });
  it('lists the colours with no token', () => {
    expect(pal.MISSING_IN_KIT.length).toBeGreaterThan(5);
  });
});
