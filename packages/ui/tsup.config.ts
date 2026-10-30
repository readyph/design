import { defineConfig } from 'tsup';

/**
 * Library build for @readyph/ui.
 *
 * Only `src/index.ts` is the entry, so Storybook stories and the `patterns/`
 * prototypes (not re-exported from the barrel) are excluded from the published
 * bundle automatically. `dependencies` and `peerDependencies` are externalized
 * by tsup by default — React, Radix, Phosphor, design-tokens, clsx and
 * tailwind-merge are resolved from the consumer, not inlined.
 *
 * No CSS is bundled: components are styled with Tailwind utility classes that
 * the consuming app compiles via the design-tokens preset (06 §9). The raw
 * `styles/globals.css` ships as-is and is referenced by the `./styles.css`
 * export.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2021',
  external: ['react', 'react-dom', '@phosphor-icons/react'],
  // Keep non-ASCII in class strings (e.g. before:content-['·_']): esbuild's default escapes them to \xB7,
  // which the consumer's Tailwind scan cannot compile.
  esbuildOptions(options) {
    options.charset = 'utf8';
  },
});
