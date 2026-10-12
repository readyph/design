# @readyph/ui

## 0.3.1

### Patch Changes

- Re-align the portal **Connected platforms** page and the Dashboard story with real platform data: only Inventory is connected, the real marketplace catalog shows under "Add a platform" (Loyalty coming soon), card metrics derive from the API `metrics` shape, and each marketplace "Connect" button is pinned to the bottom of its card. Prototype/pattern stories only — shipped components are unchanged.

## 0.3.0

### Minor Changes

- 9327d97: Add **Leda chat widgets** — the interactive in-conversation blocks that render
  inside a `Chat.Message` (Portal §4 / Inventory §4). A compound `LedaWidget` card
  plus self-contained widgets: `StatGrid`, `Chart` (area + value-pill bars),
  `Heatmap` (Orders-Breakdown style), `SegmentBars` (Income style), `Table`
  (borderless), `Facts`, `Proposal` (confirm-before-write), `Form`, `Choices`,
  `Links`, `Result`, `Memory` and `Suggestions`.

  Built to the portal's visual language: **fill and elevation, not borders** —
  raised surfaces, filled inner tiles, blue carried through fill intensity, value
  pills, and only the faintest hairline where a list needs it. Theme-aware via
  tokens (tuned for `data-theme="dark"`, the portal default). Presentational — the
  project owns the data and actions. Storybook: **Components › Chat › Widgets**.

## 0.2.0

### Minor Changes

- Replace the aurora-glass look with a single flat, blue design system across the whole library.

  - Rebrand primary ramp from teal to blue and reduce corner radii for a flatter, more compact feel (tokens, preset, theme.css).
  - Flatten surfaces: remove header/footer separator borders and glass/glow/aurora/skin styles from Card, Modal, Drawer, Chat, PageHeader, SettingsSection, Sidebar, TopBar.
  - Add reusable components: `RevenueChart` (revenue-by-channel bar card, with compact mode), `Notifications` (filterable notifications panel), and `LedaLauncher` (floating "Ask Leda" button + popup chat).
  - Make `Tooltip` theme-aware so it stays legible in dark mode.
  - Rework the Portal and Inventory pattern pages to the flat theme: new Portal dashboard command centre, Inventory dashboard as a Leda command centre, aligned Products/Movements/Purchase Orders/Reports/Settings/Auth, and a shared nav manifest (`patterns/nav.ts`) wiring sidebar/rail links.
  - Fix the Portal Reports bar chart rendering empty, and fix the Auth status badges (success/error/primary) rendering untinted.

## 0.1.1

### Patch Changes

- 157be4b: Add a `repository` field to the package manifest so GitHub Packages links the
  published package to `readyph/ui-kit`.
