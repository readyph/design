# @readyph/ui

## 0.6.1

### Patch Changes

- a50c1d9: Button `danger` label now meets 4.5:1 in the dark theme. The filled background uses the light-theme red (#dc2626, 4.83:1 with white) in both themes instead of the lighter dark-theme error coral (3.16:1).
- 94e97e8: Menu: highlighted item label uses primary-800 so it meets 4.5:1 AA in dark (was 4.07:1) and light themes.
- 4598a62: Tabs omits `aria-controls` on a trigger while no matching `TabPanel` is rendered, so navigation-only tabs no longer report an invalid ARIA reference.
- 32da531: PlatformShell rail: hide the initials avatar from assistive tech so the platform aria-label matches the visible content (fixes axe label-content-name-mismatch).
- e56cead: PlatformShell rail platform links are now named by visually-hidden text instead of aria-label, so axe label-content-name-mismatch no longer flags the avatar initials.
- ce2f22c: Notifications unread badge pins the light-theme red (#dc2626) behind white text in both themes, so it meets WCAG AA (4.83:1) in dark
- a889238: PlatformShell's mobile off-canvas menu now lists the `account` entries (for example Account and Billing) and Sign out, matching the desktop account menu, so they are reachable below 640px.
- 5fe4500: Select forwards `aria-label` and `aria-labelledby` to its trigger, so selects without a visible label have an accessible name (axe `button-name`).
- 5277b5e: Repair shop prototype shell mobile menu now lists Account, Billing and Sign out under the email, each closing the menu, matching PlatformShell.
- 841bf7e: PlatformShell account button no longer overrides its name with aria-label "Account", which did not contain the visible initials (axe label-content-name-mismatch). The name now comes from content: the initials plus visually hidden "Account".
- 518acb8: Account buttons in the portal, inventory and repair-shop shells (and the mechanic shell) no longer override their name with aria-label "Account", which did not contain the visible initials (axe label-content-name-mismatch). The name now comes from content: the initials, a space, and visually hidden "Account". PlatformShell gets the same space so the name no longer reads "MSAccount".
- 540a4b8: Mechanic row buttons (job rows, Today "Needs you now" cards, customer rows) no longer override their name with an `aria-label`; an sr-only "Open" prefix plus the visible text forms the accessible name, so it contains the visible label (axe `label-content-name-mismatch`).
- 8cf238c: RoleBadge: remove the `owner` role from the tone map (there is no Owner role) and show `admin` as "Administrator". Team and related stories show a Creator badge instead of an Owner role.

## 0.6.0

### Minor Changes

- 094ceae: Add ButtonLink: a real anchor styled as Button (all variants and sizes, focus ring, disabled handling, rel defaults for target=\_blank) so cross-app exits support middle-click and copy-link.
- ccc1b74: Menu items accept `href` (plus `target` and `rel`) and render a real anchor, so account-menu exits support middle-click and copy-link while arrow, Enter and Esc behaviour is unchanged.

### Patch Changes

- c674f37: Button primary now uses primary-600 (hover primary-700) so white label text passes 4.5:1, and the secondary Button uses border-border-strong on bg-surface so it reads as a button in the light theme.
- edaf911: Button: the dark theme primary hover now uses primary-200 (the dark-darkened blue) so the white label stays at 4.5:1 or better instead of dropping to 2.5:1; the dark secondary keeps its transparent fill and subtle border while light uses border-border-strong on bg-surface; the label wrapper is no longer display:contents so axe can check Button label contrast.
- c6850b6: Tabs underline rule uses border-strong so it stays visible on the grey window surface in light and dark; the active indicator is unchanged. Adds an "Underline on window and card" story.

## 0.5.3

### Patch Changes

- b3381e2: Fix colour contrast: Notice info, success and warning body text now uses text-ink (as error already did), and the MainNav and PlatformShell brand-mark active label uses text-primary-900 in the dark theme, so axe reports 0 colour-contrast violations in light and dark.
- c40593e: Fix colour contrast through tokens. ink-subtle and ink-muted are darker in light and lighter in dark so secondary text passes 4.5:1 on canvas, surface and muted surfaces. New success-fg, warning-fg and error-fg text tokens (text-success-fg etc.) replace text-success, text-warning and text-error for text on tinted backgrounds; the base colors stay for fills and dots. Tabs pill active label gets a dark-theme override. axe reports 0 colour-contrast violations in the repair-shop prototype stories, light and dark.
- 4717ff5: Fix remaining colour contrast failures. The link token is now #1d4ed8 in light so links pass 4.5:1 on the canvas. Disabled Checkbox, Switch and RadioGroup labels use text-ink-muted instead of fading the whole label with opacity. Portal dashboard, portal reports and inventory reports stories no longer fail in light or dark. axe reports 0 colour-contrast violations across all 267 stories, light and dark.

## 0.5.2

### Patch Changes

- 81b67f1: Fix Avatar fallback initials contrast in dark theme (3.43:1): initials now use text-primary-800 on primary-100.
- 6f34fb5: Fix remaining Notifications contrast failures: item time labels use text-ink-muted and the selected tab uses text-link, so axe reports 0 colour-contrast violations in light and dark.
- d00faf0: Fix Notifications footer button contrast in dark theme (3.54:1): use the text-link token instead of text-primary-600.

## 0.5.1

### Patch Changes

- d7c6983: Fix remaining axe color-contrast failures: error Notice body text uses text-ink, and the active nav label in Sidebar and PlatformShell, and Kbd text, use primary-900 in dark mode.

## 0.5.0

### Minor Changes

- 353862b: PlatformShell: add `railState` (`'loading' | 'error' | 'ready'`, default `'ready'`) and `onRetryPlatforms` so the rail shows placeholder tiles while platforms load and a "Platforms failed" message with a Retry button on error. Exports the `PlatformShellRailState` type.

### Patch Changes

- 97cb785: PlatformShell: muted text (rail icons, "Back to Portal", search placeholder, sidebar section titles and badges) now uses the `ink-muted` token instead of `ink-subtle`, which failed WCAG AA colour contrast in light and dark.
- 71e54d4: PlatformShell: show the company name once in the mobile off-canvas (the dialog title is now visually hidden, the sidebar brand carries the name).
- e478c15: Add the Repair shop Set password pattern story (all states), merge the invalid-link message, drop the extra show/hide tab stop and add a light-mode card hairline.

## 0.4.0

### Minor Changes

- 702838f: Add the shared `PlatformShell` (platforms rail, sidebar, top bar, optional Leda launcher) with its prop types.

## 0.3.4

### Patch Changes

- 08151e0: Fix `Menu` content rendering underneath `Modal` and `OffCanvas` overlays. The
  menu now uses the `popover` z-index token (above `modal` and `drawer`), so its
  items can be chosen with the pointer when opened inside an overlay.

## 0.3.3

### Patch Changes

- 73fa894: Fix `Select` listbox rendering underneath `Modal` and `OffCanvas` overlays. The
  listbox now uses the `popover` z-index token (above `modal` and `drawer`), so it
  can be chosen with the pointer when opened inside an overlay.

## 0.3.2

### Patch Changes

- Button & IconButton: give every variant a consistent 1px border (transparent on
  primary/subtle/danger, coloured on secondary) so all variants share identical
  geometry. The `secondary` variant stays an outlined button (transparent
  background + border); previously only it had a border, which inset its fill and
  made it render a hair smaller than the other variants at the same size.
- Modal: add a `2xl` size (`max-w-4xl`) above `xl`, for wide dialogs such as a
  marketplace card grid.

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
