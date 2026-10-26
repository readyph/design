# ReadyPH Design System

A standalone, installable design system: **design tokens on top of Tailwind**, a
white-with-tangerine theme, and flexible **React components**. Built from
[`kbase/concept/06-Design-system.md`](../kbase/concept/06-Design-system.md).

**📖 Live component catalog (Storybook):** https://readyph.github.io/design/

> **Status:** packaging configured (publish, versioning, CI) and the Storybook
> catalog is deployed to GitHub Pages — see [`PACKAGING.md`](PACKAGING.md).

## Packages

One install, `@readyph/ui`, with everything on subpaths:

| Import | Contents |
|---|---|
| `@readyph/ui` | React components + design tokens (Tailwind + Radix + Phosphor) + Storybook |
| `@readyph/ui/preset` | the **Tailwind preset** |
| `@readyph/ui/theme.css` | the **CSS-variable theme** |
| `@readyph/ui/styles.css` | fonts + theme + Tailwind base (import once) |

## Run the preview (Storybook)

```bash
cd design
npm install
npm run storybook   # → http://localhost:6006
```

Regenerate the theme + preset after editing tokens:

```bash
npm run tokens
```

Type-check everything:

```bash
npm run type-check
```

## Architecture

- **Tokens** (`packages/ui/src/tokens/*.ts`) are the single source of
  truth. `scripts/generate.ts` emits two consumable forms:
  - `css/theme.css` — CSS custom properties on `:root` (the **theming contract**).
    Colors are space-separated RGB channels, so Tailwind opacity utilities work.
  - `preset.cjs` — the **Tailwind preset**; colors map to
    `rgb(var(--ds-*) / <alpha-value>)`.
- **Components** are styled with Tailwind utilities and merge consumer classes
  last via `cn()` (clsx + tailwind-merge), so a project's `className` always wins.
- **Behavior-heavy components** (Menu, Select, Tabs, Dialog, Drawer, Tooltip,
  Popover, Checkbox, Switch, Radio, Progress, Avatar, Toast) are built on
  **Radix UI** for correct keyboard + focus + ARIA; the project drives content
  and actions.
- **Icons** are **Phosphor**, wrapped by `<Icon>` for consistent size/weight.
- **Fonts**: Inter, self-hosted via Fontsource.

### Theming / overrides

```css
:root { --ds-primary-500: 245 132 31; }        /* default tangerine */
.project-x { --ds-primary-500: 230 100 20; }   /* a project's accent, no rebuild */
```

## Component inventory (v1)

- **Actions** — Button, IconButton, Link
- **Forms** — Field, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Form,
  FormActions, SearchBar
- **Feedback** — Badge, Tag, RoleBadge, Notice, ProgressBar, Spinner, Skeleton,
  Toast (`toast`, `useToast`, `<Toaster>`)
- **Data display** — Card, Avatar, Table
- **Navigation** — Tabs, Pagination, Breadcrumbs, Sidebar, IconRail, TopBar
- **Overlays** — Modal, ConfirmDialog, Drawer, Tooltip, Popover, Menu
- **Layout pieces** — PageHeader, SettingsSection
- **Shortcut layer** — `<Kbd>`, `ShortcutModeProvider` / `useShortcutMode`,
  `useHotkeys` (optional helper). The package shows the **affordance**; the project
  **binds the keys**.

Every component ships as an independent, composable piece — there is no app shell
(`MainLayout`/`AuthLayout`); each app composes its own page layout.

## Decisions made (were open items in §12)

- **Headless base → Radix UI** (swappable later for React Aria if desired).
- **Tailwind v3** (the `rgb(var(--x) / <alpha-value>)` preset model).
- Link color → **tangerine** (`--ds-link` = primary 600).

## Still to do

- First publish to GitHub Packages — steps in [`PACKAGING.md`](PACKAGING.md).
- Full per-component **test suite** (Vitest + Testing Library + axe) and lint configs.
