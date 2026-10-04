# Packaging & publishing

This repo publishes **one package** to **GitHub Packages (private)**:

- `@readyph/ui` — React components built to `dist/` (ESM + `.d.ts`), plus the design
  tokens, the **Tailwind preset** (`@readyph/ui/preset`) and the **theme CSS**
  (`@readyph/ui/theme.css`).

Spec: `kbase/concept/06-Design-system.md` §2.

> **Assumption:** this directory (`design/`) is the git repository root (the
> `.github/` workflows live here), and the repo is owned by the `readyph`
> org/user — GitHub Packages requires the npm scope (`@readyph`) to match the
> repository owner. If you host it elsewhere, rename the scope or move `.github/`.

## What's configured

| Concern | How | Where |
|---|---|---|
| **Build** | `tsup` → `dist/` (ESM + types + sourcemaps) | each package's `tsup.config.ts`; root `npm run build` builds tokens then ui |
| **Registry** | `@readyph` scope → `npm.pkg.github.com`, auth via `${GITHUB_TOKEN}` | [`.npmrc`](.npmrc) |
| **Privacy** | `publishConfig.access = "restricted"` | each `package.json` |
| **Versioning** | Changesets, `fixed` across both packages | [`.changeset/config.json`](.changeset/config.json) |
| **Publish CI** | build + Changesets publish on push to `main` | [`.github/workflows/release.yml`](.github/workflows/release.yml) |
| **Docs CI** | build Storybook → GitHub Pages on push to `main` | [`.github/workflows/storybook.yml`](.github/workflows/storybook.yml) |

### Dev vs. published resolution

The published `exports`/`main`/`types` point at **`dist/`** (what consumers get;
only `dist`, `preset.cjs` and `src/styles` are shipped). The `./preset`,
`./theme.css` and `./styles.css` subpaths resolve through the package's own
exports. The tokens, generator, preset and theme now live inside `@readyph/ui` —
there is no separate tokens package.

> This replaces the earlier `publishConfig`-swaps-`exports` approach, which is
> unreliable: npm (10.5) does **not** apply `publishConfig` field overrides to the
> packed manifest, so that setup would have published `exports` pointing at an
> un-shipped `src/`. Pointing `exports` at `dist` directly avoids it.

### Verified on macOS (in this repo)

- `npm run build` → `packages/ui/dist/index.{js,d.ts}` produced (`prebuild` runs `generate`).
- `npm run type-check` → passes.
- `npm run build-storybook` → builds through the alias (no tokens build needed).
- `npm pack --dry-run` → tarballs include `dist/` and the packed `package.json`
  `exports`/`types` resolve to `./dist/*`.

The only steps not done here are **authenticating to GitHub Packages and running
`npm publish`** — those need your token and are an outward, irreversible action,
so they're left to you (or Claude Code on your Mac).

## First-time publish (do once)

```bash
cd design
npm install                 # pull tooling (tsup, @changesets/cli)
npm run build               # build the package

# Authenticate: create a token (classic) with write:packages + read:packages
export GITHUB_TOKEN=ghp_xxx # the repo .npmrc reads ${GITHUB_TOKEN}

npm publish -w @readyph/ui
```

## Ongoing releases (Changesets)

```bash
# After a change, record it:
npx changeset               # pick bump (patch/minor/major) + summary

# Then either:
#   • push to main → the Release workflow opens a "Version Packages" PR; merging
#     it builds + publishes automatically; or
#   • locally:
npm run version-packages    # applies the bump + changelog
npm run release             # build + changeset publish
```

### CI secrets / setup

- Publishing uses the built-in `GITHUB_TOKEN` (needs `packages: write`, already
  granted in `release.yml`) — no extra secret required for this repo's own
  GitHub Packages.
- For Storybook docs, enable **Settings → Pages → Source: GitHub Actions** once.

## Consuming it (Portal `03` / Inventory `04`, or any web frontend)

In the consuming repo, add an `.npmrc` so npm can resolve the private scope:

```
@readyph:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
npm i @readyph/ui
npm i react react-dom @phosphor-icons/react   # the peers, if not already present
```

```cjs
// tailwind.config.cjs
const preset = require('@readyph/ui/preset');
module.exports = {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@readyph/ui/dist/**/*.js', // compile the library's classes
  ],
};
```

```ts
// app entry — load the theme + the components' base stylesheet once
import '@readyph/ui/theme.css';
import '@readyph/ui/styles.css';
```

Override any token by redefining its CSS variable (globally or scoped under a
class / `[data-theme]`) — no rebuild (06 §8).
