import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { colors, density, radius, radiusRole } from '../index';

const root = resolve(__dirname, '../../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

/** Custom properties declared inside every block whose selector matches. */
function varsIn(css: string, selector: RegExp): Set<string> {
  const out = new Set<string>();
  const blocks = css.matchAll(/([^{}]+)\{([^{}]*)\}/g);
  for (const [, sel, body] of blocks) {
    if (!selector.test(sel)) continue;
    for (const m of body.matchAll(/(--ds-[a-z0-9-]+)\s*:/g)) out.add(m[1]);
  }
  return out;
}

const theme = read('src/styles/theme.css');
const globals = read('src/styles/globals.css');
const preset = require(resolve(root, 'preset.cjs'));

/** Non-colour vars are shared across themes and are not required in the dark scope. */
const sharedVars = new Set([
  '--ds-font-sans',
  '--ds-transition',
  '--ds-density-control',
  '--ds-density-sidebar-item',
  '--ds-density-table-row',
  '--ds-density-table-row-dense',
  '--ds-gutter',
]);

describe('theme scopes', () => {
  const light = varsIn(theme, /:root|\[data-theme="light"\]/);
  const dark = varsIn(globals, /\[data-theme="dark"\]/);
  const colourVars = [...light].filter((v) => !sharedVars.has(v) && !v.startsWith('--ds-radius-'));

  it('declares the light scope on :root and [data-theme="light"]', () => {
    expect(theme).toMatch(/:root,\s*\[data-theme="light"\]\s*\{/);
  });

  it('resolves every colour token in the dark scope', () => {
    const missing = colourVars.filter((v) => !dark.has(v));
    expect(missing).toEqual([]);
  });

  it('does not define dark-only colour tokens that light lacks', () => {
    const extra = [...dark].filter((v) => !light.has(v));
    expect(extra).toEqual([]);
  });

  it('emits chrome tokens in both scopes', () => {
    for (const k of ['', '-fg', '-muted', '-hover', '-active', '-border']) {
      expect(light.has(`--ds-chrome${k}`)).toBe(true);
      expect(dark.has(`--ds-chrome${k}`)).toBe(true);
    }
  });

  it('has a blue tint for Badge primary and no peach', () => {
    expect(light.has('--ds-tint-blue-bg')).toBe(true);
    expect(dark.has('--ds-tint-blue-bg')).toBe(true);
    expect(theme + globals).not.toMatch(/peach/);
    expect(colors.tint).not.toHaveProperty('peach');
  });
});

describe('radius and density tokens', () => {
  it('uses the semantic radius scale 4 / 6 / 8', () => {
    expect(radius.sm).toBe('0.25rem');
    expect(radius.base).toBe('0.375rem');
    expect(radius.md).toBe('0.5rem');
    expect(radiusRole).toEqual({ control: radius.sm, panel: radius.base, modal: radius.md });
    expect(preset.theme.extend.borderRadius).toMatchObject({ sm: '0.25rem', base: '0.375rem', md: '0.5rem' });
  });

  it('emits radius as --ds-radius-* CSS variables', () => {
    expect(theme).toContain('--ds-radius-control: 0.25rem;');
    expect(theme).toContain('--ds-radius-panel: 0.375rem;');
    expect(theme).toContain('--ds-radius-modal: 0.5rem;');
    expect(theme).toContain('--ds-radius-sm: 0.25rem;');
    expect(preset.theme.extend.borderRadius).toMatchObject({ control: 'var(--ds-radius-control)' });
  });

  it('emits density as CSS variables and Tailwind keys', () => {
    expect(theme).toContain(`--ds-density-control: ${density.control};`);
    expect(theme).toContain('--ds-density-sidebar-item: 1.75rem;');
    expect(theme).toContain('--ds-density-table-row: 2.25rem;');
    expect(theme).toContain('--ds-density-table-row-dense: 2rem;');
    expect(theme).toMatch(/--ds-gutter: 0\.75rem;/);
    expect(theme).toMatch(/min-width: 640px[\s\S]*--ds-gutter: 1rem;/);
    const ext = preset.theme.extend;
    expect(ext.height).toMatchObject({
      control: 'var(--ds-density-control)',
      'sidebar-item': 'var(--ds-density-sidebar-item)',
      row: 'var(--ds-density-table-row)',
      'row-dense': 'var(--ds-density-table-row-dense)',
    });
    expect(ext.spacing.gutter).toBe('var(--ds-gutter)');
  });

  it('emits chrome colour keys in the Tailwind preset', () => {
    expect(Object.keys(preset.theme.extend.colors.chrome)).toEqual(['DEFAULT', 'fg', 'muted', 'hover', 'active', 'border']);
  });
});
