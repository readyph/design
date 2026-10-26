import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Dev-only (RDY-355). `@phosphor-icons/react` has ~1,500 icons and its barrel pre-bundles into one 6 MB file that the
 * browser downloads and parses on the first story, even though the components use ~100 of them. Production builds
 * tree-shake it, so only `storybook dev` needs this: named icon imports from the barrel are rewritten to the
 * per-icon module (`@phosphor-icons/react/dist/csr/<Name>`), which Vite pre-bundles together with shared chunks.
 * Names that are not an icon file (types, `IconContext`) stay on the barrel.
 */
const BARREL = '@phosphor-icons/react';
const IMPORT_RE = /import\s+(type\s+)?\{([^}]*)\}\s*from\s*(['"])@phosphor-icons\/react\3\s*;?/g;

function iconNames(): Set<string> {
  const require = createRequire(import.meta.url);
  const csr = join(dirname(require.resolve(`${BARREL}/package.json`)), 'dist', 'csr');
  return new Set(readdirSync(csr).filter((f) => f.endsWith('.es.js')).map((f) => f.slice(0, -'.es.js'.length)));
}

/** Every icon name the sources import from the barrel (so Vite can pre-bundle them up front, with no mid-session reload). */
export function usedIcons(srcDir: string): string[] {
  const names = iconNames();
  const used = new Set<string>();
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|mdx)$/.test(e.name)) {
        for (const m of readFileSync(p, 'utf8').matchAll(IMPORT_RE)) {
          if (m[1]) continue;
          for (const spec of m[2].split(',')) {
            const name = spec.trim().split(/\s+as\s+/)[0].replace(/^type\s+/, '');
            if (names.has(name) && !/^type\s/.test(spec.trim())) used.add(name);
          }
        }
      }
    }
  };
  walk(resolve(srcDir));
  return [...used].sort();
}

export function phosphorPerIcon(): Plugin {
  const names = iconNames();
  return {
    name: 'readyph:phosphor-per-icon',
    apply: 'serve',
    enforce: 'pre',
    transform(code, id) {
      if (!/\.(tsx?|jsx?)$/.test(id.split('?')[0]) || id.includes('/node_modules/') || !code.includes(BARREL)) return null;
      const out = code.replace(IMPORT_RE, (whole, typeOnly: string | undefined, list: string, q: string) => {
        if (typeOnly) return whole;
        const direct: string[] = [];
        const rest: string[] = [];
        for (const raw of list.split(',')) {
          const spec = raw.trim();
          if (!spec) continue;
          const [imported, local = imported] = spec.split(/\s+as\s+/).map((s) => s.trim());
          if (!spec.startsWith('type ') && names.has(imported)) direct.push(`import { ${imported} as ${local} } from ${q}${BARREL}/dist/csr/${imported}${q};`);
          else rest.push(spec);
        }
        if (!direct.length) return whole;
        // Type specifiers go in a type-only import (erased), so no value import of the barrel is left behind.
        const types = rest.filter((r) => r.startsWith('type ')).map((r) => r.slice(5));
        const values = rest.filter((r) => !r.startsWith('type '));
        if (types.length) direct.push(`import type { ${types.join(', ')} } from ${q}${BARREL}${q};`);
        if (values.length) direct.push(`import { ${values.join(', ')} } from ${q}${BARREL}${q};`);
        return direct.join('\n');
      });
      return out === code ? null : { code: out, map: null };
    },
  };
}
