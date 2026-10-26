import type { Plugin } from 'vite';

/**
 * RDY-355. `globals.css` (generated, ships in the package) starts with a Google Fonts `@import`. Inside a stylesheet that
 * is render-blocking: the preview iframe paints nothing until fonts.googleapis.com answers (and a story or docs page
 * waits again on a slow or offline network). Storybook drops the `@import` here and loads the same families from
 * `preview-head.html` without blocking render. The published package is unchanged.
 */
export function nonBlockingFonts(): Plugin {
  return {
    name: 'readyph:non-blocking-fonts',
    enforce: 'pre',
    transform(code, id) {
      if (!id.split('?')[0].endsWith('/src/styles/globals.css')) return null;
      const out = code.replace(/@import\s+url\(['"]https:\/\/fonts\.googleapis\.com[^)]*\)\s*;?/g, '');
      return out === code ? null : { code: out, map: null };
    },
  };
}
