import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import postcss from 'postcss';
import tailwind from 'tailwindcss';
import { layout } from './layout';

const require = createRequire(import.meta.url);
const root = resolve(__dirname, '../..');
const preset = require(resolve(root, 'preset.cjs'));

describe('leda-panel width token', () => {
  it('is 22.5rem in the layout token, the generated preset and the CSS variable', () => {
    expect(layout.ledaPanelWidth).toBe('22.5rem');
    expect(preset.theme.extend.width['leda-panel']).toBe('22.5rem');
    const theme = readFileSync(resolve(root, 'src/styles/theme.css'), 'utf8');
    expect(theme).toMatch(/--ds-leda-panel-width:\s*22\.5rem;/);
  });

  it('leaves right-panel unchanged', () => {
    expect(layout.rightPanelWidth).toBe('18rem');
    expect(preset.theme.extend.width['right-panel']).toBe('18rem');
  });
});

describe('container queries', () => {
  async function compile(cls: string) {
    const result = await postcss([
      tailwind({ presets: [preset], content: [{ raw: `<div class="${cls}"></div>` }], corePlugins: { preflight: false } }),
    ]).process('@tailwind utilities;', { from: undefined });
    return result.css;
  }

  it('compiles the arbitrary container variant', async () => {
    const css = await compile('[@container(min-width:60rem)]:grid-cols-3');
    expect(css).toMatch(/@container\s*\(min-width: ?60rem\)/);
  });

  it('compiles the plugin variants (@container, @lg:)', async () => {
    const css = await compile('@container @lg:flex');
    expect(css).toContain('container-type: inline-size');
    expect(css).toMatch(/@container \(min-width: 32rem\)/);
  });

  it('compiles w-leda-panel', async () => {
    expect(await compile('w-leda-panel')).toContain('22.5rem');
  });
});
