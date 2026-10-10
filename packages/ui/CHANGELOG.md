# @readyph/ui

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
