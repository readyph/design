import { describe, expect, it } from 'vitest';
import { colors } from './colors';
import preset from '../../preset.cjs?raw';

// theme.css is stripped by Vitest's CSS handling (even as ?raw), so read it from disk.
declare const require: (id: string) => { readFileSync(path: string, encoding: string): string };
declare const process: { cwd(): string };
const css = require('node:fs').readFileSync(`${process.cwd()}/src/styles/theme.css`, 'utf8');

const EXPECTED = [
  'grass', 'grass-edge', 'road', 'road-marking', 'footpath', 'window-glow', 'window-off',
  'warehouse-wall', 'warehouse-roof', 'shop-wall', 'shop-roof', 'store-wall', 'store-roof',
  'hq-wall', 'hq-roof', 'awning', 'awning-stripe',
];

const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf('[data-theme="dark"]'));
const darkBlock = css.slice(css.indexOf('[data-theme="dark"]'));

describe('scene colour tokens', () => {
  it('defines exactly the expected tokens with light and dark hex values', () => {
    expect(Object.keys(colors.scene).sort()).toEqual([...EXPECTED].sort());
    for (const pair of Object.values(colors.scene)) {
      expect(pair.light).toMatch(/^#[0-9a-f]{6}$/);
      expect(pair.dark).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it.each(EXPECTED)('emits --ds-scene-%s in both themes and the Tailwind preset', (name) => {
    const re = new RegExp(`--ds-scene-${name}: \\d+ \\d+ \\d+;`);
    expect(lightBlock).toMatch(re);
    expect(darkBlock).toMatch(re);
    expect(preset).toContain(`"${name}": "rgb(var(--ds-scene-${name}) / <alpha-value>)"`);
  });

  it('keeps road marking and window glow distinct from their backgrounds', () => {
    const dist = (a: string, b: string) => {
      const n = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
      return Math.hypot(...n(a).map((v, i) => v - n(b)[i]));
    };
    for (const mode of ['light', 'dark'] as const) {
      expect(dist(colors.scene['road-marking'][mode], colors.scene.road[mode])).toBeGreaterThan(80);
      expect(dist(colors.scene['window-glow'][mode], colors.scene['shop-wall'][mode])).toBeGreaterThan(30);
    }
  });
});
