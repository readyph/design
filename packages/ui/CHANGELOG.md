# @readyph/ui

## 0.7.0

### Minor Changes

- 0a03db1: Reset the design system: all components, tokens and styles are removed (preserved on the `legacy` branch). The package builds empty; the Portal redesign (RDY-243) rebuilds it.
- af04883: Tokens for the Portal redesign (RDY-246), applied globally: IBM Plex Sans/Mono, cobalt accent, light + grey dark (`data-theme="light|dark"` on html, absent = system), status tones (text/dot/bg/ink), data-viz, identity and map colours, Leda palette, type scale, radius, spacing, layout, shadow, blur and motion. Replaces every legacy `--ds-*` variable and Tailwind colour name (`ink`, `primary-*`, `surface-subtle`, `canvas`, ...); consumers must migrate. Tokens are also exported from `src/tokens`.
- eda9b55: PlatformShell (C1) rebuilt as the Portal app shell: grid rail | place column | sheet over a status row, with slots `rail`, `place`, `sheetBar`, `actionBar`, `status`, `topBar`, `phoneNav` and a `detail` flag for the phone one-region-at-a-time layout. The sheet is a container named `sheet`. Breaking: the old sidebar/rail props (platform, sections, account, menuOpen, railState ...) are removed.
- d3da286: IconRail (C2) rebuilt: 52px `--frame` rail (no border), `IconRailMark` (the R, links Home), 36x36 `IconRailItem` (19px icon, 5px radius; default / hover `--frame-hover` / current `--frame-active` with `aria-current="page"` / count badge, `99+` above 99), `IconRailSpacer`, `IconRailFoot` (hosts the AccountMenu avatar button) and a reusable `CountBadge`. Tooltip to the right on hover and focus, Esc dismisses. No Settings item (it lives in the avatar menu).

  API notes for consumers of the old IconRail (portal, inventory, sms): `IconRailItem` keeps `icon`, `label`, `href`, `onClick`; `active` still works but is deprecated for `current`; the rail drops its right border and `bg-surface` for `bg-frame`, width 56 -> 52, items 40 -> 36px; `IconRail` now has `aria-label="Main"` by default and a fixed width that `className` cannot override; the tooltip is now Radix with its own shared provider inside `IconRail`. New: `count`, `tooltip={false}` (phone bottom nav, RDY-261, reuses `IconRailItem` and `CountBadge`). The old IconRail also had no mark, add-platform or foot slot: compose them as children.

  For `PlatformShell`'s `rail` slot (which already supplies the `nav`), use the new `IconRailContent`: same colour, column layout and shared tooltip timing, no landmark. `IconRailItem` no longer needs an outer tooltip provider (it mounts its own when none is above it).

- 0461b97: AccountMenu (C3): 304px translucent avatar menu with header and role chip, Account settings, the only theme control (Light / Dark / System via SegmentedControl, sets data-theme on html, System removes it) and Log out. Menu now exports its item class constants (menuItemBase, menuItemTone, menuItemDanger); behaviour unchanged.

  Token change: --overlay alpha raised to .86 (light) / .90 (dark) so 12px muted text is AA over any backdrop.

- 136e207: StatusBar (C4, new): the 34px Portal status strip for PlatformShell's `status` slot. A logo per platform (name beside it with 3 or fewer platforms or from 1180px; non-running platforms always show a plain word), people, invites waiting, Leda usage minibar (warn from 80%), plan and "Updated" time. Narrow widths drop Updated, then plan, then the invite word. It renders a plain list, no `footer` of its own: the shell supplies the labelled landmark.
- f6906ba: Sheet bar and tabs (C5): `Tabs` and `TabPanel` rebuilt on the new tokens, plus a new `SheetBar` (48px, 24px side padding, tabs or breadcrumb left, Leda bar and buttons right). New `variant` values: `editor` (closable tabs, 96-180px, shrink before the strip scrolls; Delete closes; preview tabs are italic and `onPin` fires on double-click), `fixed`, `vertical` (icon, name, status word; `statusTone="warn"` for "Unsaved") and `chips` (44px on phone, chosen chip scrolls into view). Panels fade in over 120ms (opacity only, kept under reduced motion). The preset gains a `tab-fade` animation. API changes for consumers (portal, inventory, sms): the default `variant` is now `fixed`; `underline` and `pill` still work as aliases of `fixed` and `chips`. The list needs `aria-label` (defaults to "Tabs"). New optional `TabItem` fields: `leading`, `closable`, `preview`, `status`, `statusTone`; new props `onClose`, `onPin`. The close X is a pointer-only affordance inside the tab (a tablist may hold only tabs): keyboard users press Delete (`aria-keyshortcuts`). Tabs belong only on Home, platform.html and Memory.
- c5e97b9: Ask Leda bar (RDY-266, C6, new; replaces `LedaLauncher` in the Portal): `AskLedaBar` (+ `useAskLedaShine`, `ASK_LEDA_TIMING`). Props: `variant` (`bar` 320x34, 44px icon at 640px and below; `overview` 560x44), `scope`, `onOpen(source: 'click' | 'shortcut' | 'slash')`, `paused` (pass `true` while the palette is open), `shine="hold"`, `shortcuts` (document-level Cmd/Ctrl+K and "/"; leave on for one bar per page), `shortcutLabel`. Accessible name is "Ask Leda or tell it what to do" (or "Ask Leda about {scope}"). When the conversation panel is open, the page's `onOpen` should focus the composer. The preset gains `w-leda-w-overview`, `bg-halo` and the `animate-halo-spin`, `animate-halo-fade`, `animate-halo-fade-reduced` animations (generated by `generate.ts`). Reduced motion follows handover 4.7: the ring fades for 1.6s (no rotation, no glow), the Scan stays still.
- 030eb2f: CommandPalette (C7, new): the Cmd+K palette. A 640px translucent panel 72px from the top (full screen on a phone) with a 48px input row carrying Leda's mark, and a grouped listbox (Ask, Leda conversation, then the page's own groups such as Ask Leda, Tell Leda to do, page objects, Go to). Combobox/listbox semantics with `aria-activedescendant`, type-ahead filtering, IME-safe Enter, focus trap and return, Esc closes. It registers no global keys: `AskLedaBar` owns Cmd/Ctrl+K and "/", the page sets `open` here and `paused` on the bar. Different from the reverted `CommandPalette`.
- 9f98c6d: Leda proposal / confirm card (C9, RDY-269): `LedaProposal`. Raised card with the top line (Leda mark, state in words, mono ID), title, lines table, "Confirm writes" list (with muted notes and a "cannot" line), warning, and actions (Confirm with a custom label, optional extra, Discard). States: waiting, writing (Aurora, `aria-busy`, Confirm keeps focus), done, discarded, and "Open {page} to confirm". Props: `id`, `title`, `lines[{label, value, detail?, total?}]`, `writes[]`, `writesHeading`, `notes[]`, `cannot`, `warning`, `state`, `confirmLabel`, `extra`, `onConfirm`, `onDiscard`, `after`, `doneAt`, `doneAction`, `openPage`, `openHref`.
- 3c1c3f4: Toast with Undo (C11, update of Toaster / toastStore): one-line ink toast (inverts in dark), 13px, 5px radius, float shadow, optional Leda tile (`leda: true`) and a first-class Undo (`toast.undo(message, onUndo)`). One at a time (a new toast replaces the one showing), 5000ms, paused while hovered or focused, Esc closes, `role="status"` polite. Anchors bottom-left of the sheet (phone: full-width above the bottom nav), portalled to body and placed from the shell geometry. Breaking for consumers of the legacy toast: `Toaster` loses the `position` prop (new optional `anchor`, `className`), no queue (last toast wins), no per-toast close button or swipe, `title` now sits inline before the message, tone shows only as a warning/error icon, Radix Toast is no longer used. Phone placement targets only PlatformShell's bottom nav (new `data-shell="phone-nav"` attribute; the sheet gets `data-shell="sheet"`), so breadcrumb navs cannot capture the toast. New `toast.runAction()` runs the showing toast's action (Undo) and closes it, for page-level Mod+Z. Removed the unused `@radix-ui/react-toast` dependency.
- da7a781: ConfirmDialog (C12): 420px alertdialog with an item box (icon or platform logo, name, context line), consequence line, focus on Cancel, 44px phone buttons. New props `name`, `context`, `icon`, `iconNode`; `onCancel` now also fires on Esc and backdrop. Modal gains `size="confirm"`, `role` and `initialFocus`.
- 2fdd72c: Modal (C13/C20, rebuilt from legacy): fixed-size `panel` (720 x 640) and `marketplace` (904 x 744) sizes, window less 48px on small screens, full screen on phone. Header with 32px icon well, title, description and close; body scrolls inside; pinned footer. Focus trap, Esc, backdrop click, focus returns to the opener. API: `size` is now `sm | md | lg | panel | marketplace` (legacy `xl`/`2xl` removed); `icon` (Phosphor component) added; `Modal.Header` now renders the close button and takes `icon`/`description`; the quick API is triggered by `title`.

  Review round 1: `Modal.Body` is keyboard focusable (tabIndex 0, inset focus ring) so it scrolls from the keyboard; Esc on an open Select closes only its listbox; icon well is `bg-raised` with `rounded-card` and an accent icon; new `iconNode` prop (header and quick API) puts any node, such as `<LedaMark size={18} decorative />`, in the well; the description wraps (13/18) and the header aligns to `items-start`; the close button is labelled "Close {title}" (string titles).

- c925dac: Select (C14): custom single-select listbox with keyboard support, type-ahead, icons, meta text, upward flip and a hidden form input that fires `change`. Replaces native selects.
- e126202: SubpageTransition (C15, new): the route-transition helper for list to detail. `SubpageTransition` (props `paneKey`, `direction` 'in' | 'out', `onExited`, `restoreFocus`) wraps one or more `SubpageLane`s (`from` 'left' | 'right', `focus`, `scroll`). Slide in 240ms, out 220ms on `--ease-subpage`; the old pane drifts 6% and dims to 0.55; the rail, map and status bar are outside the lanes and never move. Reduced motion: the old pane goes at once and the new one fades in over 140ms. Old pane is `inert` + `aria-hidden`; focus moves to the new pane's `[data-subpage-focus]`/`h1` and returns to the opener on 'out'; scroll position is restored per pane. New tokens `--subpage-drift`, `--subpage-dim` and keyframes `sub-*` (`animate-sub-in-r` ...). Also exports `usePrefersReducedMotion`.

  Review round 1: panes are opaque (`SubpageLane surface="frame"` for the place column, default `surface`). On a phone, inside `PlatformShell` with a place column, the shell now slides the whole visible screen while a `SubpageTransition` runs (list region drifts and dims, sheet region slides over it, and the reverse); `PlatformShell` reads the transition from context, no new props. Focus on 'out' finds the opener in any lane. `useMatchMedia` util with an `addListener` fallback. `position: fixed` children are positioned against the sliding pane until it ends (JSDoc).

  Review round 2: `PlatformShell` sets `inert` on the region under a phone slide in the render (not in an effect), so a lane moving focus in the same commit (Back during an 'in' slide) no longer meets a stale inert region. `SubpageTransition` moves focus only when it was lost or sits in the lanes; it never steals it from where the user put it.

- f5696b9: Platform map (RDY-276, C16, new): `TownMap`, replacing the Lab TownScene. Building per platform kind (warehouse, service, store, generic office with the kind on its sign, HQ plot), empty lots, roads by link status (solid, long dashes, short dashes), HTML label buttons with a collision pass (`placeLabels`), selected/highlight/focus/loading/error states. Props: `platforms` (null = lot), `links`, `selected`, `highlight`, `focus`, `dimOthers`, `onSelect`, `onHover`, `loading`, `error`, `onRetry`, `caption`; ref `TownMapHandle` (rotate, zoom, runVan, state, morph, placeLabels, setDark no-op). Tokens: `map-top/side/road` light values replaced (were placeholders), new `map-side-2`; preset keyframes `town-flow-a/b`. Colours follow the theme through tokens and `light-dark()`; motion is static under reduced motion.
- 5deee2f: Add PlatformLogo (C17): 16/24/32px identity tile with uploaded logo or generated monogram, stop-word-aware collision-safe initials, stored `color` (identity_color), `nextIdentityColor` helper and a `decorative` option.
- 6bd2149: List rows (RDY-278, C18, new): `List`, `ListHeader`, `ListHeaderCell`, `ListRow`, `ListCell`, `ListMetrics`, `ListMetric` and `listRowSurface`. Ruled rows (radius 0, `--row-y` 16px, 1px `--rule`, subgrid value columns), `as="table"` for row/columnheader/cell roles, and a j/k cursor (2px accent, Enter opens, `aria-current`, live announcement). Only the hovered row highlights; the 8px transparent border + `background-clip: padding-box` rule is restated on hover, cursor and flash. Rows stack by the list's own width (`stackBelow` 600 / 760 / 880). The preset now ships a small container-query plugin (`@container/list`, `@max-[760px]/list:`; file `plugins/container-queries.cjs`, included in the package `files`) and a `row-flash` animation. There is no `Table` in `@readyph/ui` since the reset; when one returns it should spread `listRowSurface` on its rows for the same hover rule.
- 4795721: Queue "Needs you" (RDY-279, C19, new): `Queue`. Header (22px title, filled count, platform filter menu with logos and open counts, "X only" chip with clear), Leda headline, a scrolling list (28px bottom fade while more is below, scroll contained) and three pinned groups folded to one line each (Leda is watching, Snoozed, Done today). Props: `items` (`QueueItem`: platform, source, due, urgent, title, detail, action), `watching`, `snoozed`, `done`, `platforms`, `filter` / `defaultFilter` / `onFilterChange`, `headline`, `loading`, `errors` + `onRetry`, `onOpen`, `onAction`, `onSnooze`, `onItemHover` (light the building on the map), `cursorId` / `onCursorChange`, `shortcuts`, `defaultOpenGroups`. Keys j / k / Enter use the `List` cursor hook; `s` snoozes the cursor row. Only one component per page keeps the page shortcuts: give other Lists `shortcuts={false}`. Rows are a list with `aria-current`, not a listbox, because each holds a real action button. Designed for --frame (the place column, 320-460px); the fade is a mask so it works on any surface.
- a9407da: Marketplace modal (RDY-280, C20, new): `Marketplace` on `Modal size="marketplace"`, fixed 904 x 744 in every filter and state (full screen on a phone; only the tiles scroll, footer pinned). Props: `items` (`MarketplaceItem`: key, name, category, icon, description, shares, reads, owned, comingSoon, hasApp), `categories` (default All / Operations / Sales / Finance / Marketing), `status` (`ready | loading | error`, `onRetry`), `picked` / `defaultPicked` / `onPickedChange`, `category` / `defaultCategory` / `onCategoryChange`, `onInstall(item)`, `ledaNote` (plain slot until the Leda note C38 exists), `title`, `description`, `icon`, `className` (tile grid only). Tiles are a radio group (one tab stop, arrows and Home/End pick, Space/Enter pick, double click installs); Coming soon tiles are dashed and skipped; Install is disabled until a pick. Also exports `defaultMarketplaceCategories` and `marketplaceIoLine`.
- 502a473: Add `DayBar` (C23): an SVG strip across business hours with hour ticks and Now, due and deadline marks. Props: `hours` ({ open, close } in minutes), `now`, `marks[]`, `closed`, `formatTime`/`locale`. Labels sit beside their own line, shorten below 520px, and the strip reads as one image.
- 678c9df: Platform Today block (RDY-284, C24, new): `PlatformToday`, plus `pickTodayRows` and the `TodayList`, `TodayItem`, `TodayLink`, `TodayFact`, `TodayActivity` types. One block per platform, the same for every kind: sticky header (24px logo, full name that wraps, kind, Open), facts line (up to 3 facts and "Leda acts here" / "Leda reads only"), then each list as a `ListGroup` (title, "View all N", up to `maxRows` ruled rows with state pill, quantity, time and a link chip to the other platform), or the latest activity when there are no lists. HQ uses the same shape (`platform.hq`, `children` for the plan bar). Loading, error and empty states. Its lists do not listen for j / k unless `shortcuts` is set. Data is generic: `lists[] { id, title, total, items[] { id, ref, title, detail, state, tone, qty, at, link } }`. `surface` is `frame` (place column) or `surface` (sheet).
- 2fa2c23: TopicLibrary (RDY-287, C27, new): what customers' Leda knows, as a list (default) or a grid. Toolbar with search (200ms debounce, matches marked with an escaped matcher, Esc clears), Turn all on / off, New topic, business filter (Select), filters with counts (SegmentedControl; a Select on narrow containers) and a list / grid toggle. List = ruled square `List` rows (title link, two-line paragraph, folder, source, lock icon named "off by default", Switch); grid = flat tiles on `--raised`, 6px radius, no shadow. States: search matches, empty folder, no match, empty filter, read only, loading, error. Emit-only: `onToggle(topic, next)`, `onToggleAll(next)`, `onNew`, `onOpen`, `onQueryChange`, `onFilterChange`, `onBusinessChange`, `onLayoutChange`; the page filters `topics`, saves, asks before a bulk change and shows `toast.undo`. One j / k / Enter cursor shared by list and grid (`shortcuts`), never `/`. Props: `topics[{id,title,lines,source,sourceKind,folder,locked,lockNote,on,href}]`, `counts`, `filter`, `businesses`, `business`, `folderLabel`, `query`, `layout`, `allOn`, `readOnly`, `readOnlyNote`, `loading`, `error`, `onRetry`, `emptyHeadingLevel`. Also exports `useTopicLayout()` (localStorage `rph-mem-layout` in try/catch, read after mount) and `topicMatcher()`.
- 2f69f93: C32 empty, loading and error patterns: `EmptyState` (update: `align="start"` inline variant, `restricted` no-permission line, `headingLevel`), `Skeleton` (update: soft pulse on the `skeleton` token, `lines` for text blocks), and new `ErrorBlock` (inline dashed "Couldn't load your {thing}" block with Try again). Existing `EmptyState` and `Skeleton` props are unchanged; the Skeleton shimmer is now a pulse.
- 1ed6e0e: Button and IconButton (RDY-293, C33): variants primary / secondary / text / danger (`subtle` renamed `text`), 32px tall (40 phone, 44 in phone action bars), 5px radius, 13px 500, 12px side padding, 14px icons, disabled at 70%. Danger is a filled `--bad` with the new `--bad-on` ink (white in light, #0b1020 in dark) so it passes AA on rest and hover; new token `--bad-on`. Secondary hover darkens the border to `--muted`; text hover uses `--raised`. IconButton requires a `label`. The `shortcut` prop is removed until Kbd is rebuilt (inventory `ProductsPage.tsx` uses it).
- 7a37ede: Status pill and dot (C34): add the `err` tone (control grey dot), an opt-in `pulse` prop (slow, off under reduced motion), and default an unlabelled StatusDot's accessible name to the health word.
- ca9559a: Menu (RDY-295, C35): rebuilt on the new tokens. Surface, border, 6px radius, float shadow, min 200px; items 7x10px, 4px radius, 13px type. New `meta` (optional right-aligned text) replaces the shortcut-mode `shortcut` hint, and new `type: 'radio'` items render `menuitemradio` with a check for filters. `href`, `danger`, `disabled`, label and separator items are unchanged.
- 3bbbbf7: Switch row (C36): rebuilt on the new tokens. 34x20 track, 14px thumb, accent when on, faint border and thumb when off, hover, focus ring and disabled states. Adds optional `example` and `lockNote` props; the visible label is now a real `<label>` (the description is announced through `aria-describedby`, no longer part of the name). Existing props are unchanged.
- f4f81de: Add FactsLine and Fact (C37): a wrapping row of short facts (13/20 muted, bold values, tones default/ok/warn/bad/muted) separated by 3px dots in a clipped 23px gutter so a wrapped line never starts with a separator. Renders a `ul` with `li` facts. New component, no change to existing consumers.
- 9e71d7a: Leda note and refusal (RDY-298, C38, new): `LedaNote` (raised box, 16px Leda tile, optional `byline`), `LedaRefusal` (Prohibit icon, one-line reason, `action` as the way out) and `LedaNoteLink`. Both are `role="note"` with an accessible name (`label`), wrap long text instead of truncating, and work on `--frame` and `--surface` in both themes.
- 094928c: Segmented control (C39): rebuilt on the new tokens (raised-2 track, 28px segments, 13px text, surface + border selected state), optional `count` and `disabled` per option, and a `disabled` prop. API changes for consumers: the group is now `role="group"` with `aria-pressed` buttons instead of a `tablist` (use `semantics="radio"` for a radiogroup with roving tabindex and arrow keys, or `semantics="menu"` for `menuitemradio` inside the account menu); `onChange` fires only when the value actually changes; `icon` takes a component (as before) and is 16px.
- 4e78b11: Usage meter (C40): rebuilt `ProgressBar` on the new tokens. 4px bar, 56px wide inline (status bar) or full width (`layout="full"`) with the readout under it. New props: `label` (readout and accessible name), `layout`, `warnAt`, `actionLabel`, `actionHref`, `onAction`. `tone` is now `auto` by default (accent, warn at `warnAt` or 85%, bad when `value >= max` with a "Plan and billing" link); `primary`, `success` and `error` still work and map to accent, accent and bad. API changes: the `size` prop is removed (the bar is always 4px); `label` is now the visible readout and names the bar (use `aria-label` for a bare bar); `className` goes on the wrapper, not the bar.
- 0b81bda: DataList (C41, update): key-value rows in a `minmax(120px, 34%) | 1fr` grid at 13/20, 7px rows with a top rule, muted single-line labels, weight 500 values with an optional right `note` and `tone="bad"`; stacks below 600px. API: new `note` and `tone` item fields; `stacked` and `icon` kept; values now wrap instead of truncating; the list is no longer `text-sm` and uses token colours (`text-muted`, `text-text`).
- 20eb369: Breadcrumbs (C42), rebuilt from legacy. New `variant`: `trail` (12/16 muted crumbs with optional `logo`), `sheet` (bordered link-style back control then "/ current" in 600) and `phone` ("‹ Team"). API change from legacy: `Crumb.label` is now a string (truncates, tooltip), `Crumb.logo` added, `className` applies to a wrapper, current item is text-text 600.
- 6811ead: List group (RDY-304, new): `ListGroups` and `ListGroup` for titled groups of List rows (Team, queue, connections editor). Each group is `role="group"` named by its heading and holds a real List; the column header is written once on `ListGroups`; one j / k cursor crosses all groups (skips titles, collapsed and empty groups) and the inner Lists never listen. `ListGroup` has `title`, `count`, `note`, `actions`, `level`, `collapsible` and `empty`. `List` now exports `useListCursor` (same behaviour) and no longer renders its live region when `shortcuts` is false. Use fixed or fr column tracks (not `auto`) so header and rows line up.

### Patch Changes

- 7209a14: Frame surface (RDY-305): PlatformShell's place column now sets `data-surface="frame"`, so Queue, List, ListGroup and PlatformToday inside it use `--frame-rule` for row rules and offset the focus ring on `--frame`. `data-surface="surface"` restores the sheet values (rule and ring offset) for a sheet nested in the column; PlatformToday sets it when `surface="surface"`. At phone width (640px and below) the shell is all `--surface`, so the place column's frame scope, including PlatformToday blocks inside it, resets to the sheet rule and ring offset (`data-shell-place`). Dev-only: `@types/node` added so ProgressBar's test type-checks on a clean `npm ci`.
- 32c4ec1: PlatformToday (RDY-306): on phone inside PlatformShell the sticky header paints the place column's colour (`--surface`) instead of `--frame`, and the title-link focus ring offsets on the same colour. New `--scope-bg` variable on the `data-surface` scope, overridden by the existing phone reset. Wider than 640px and standalone: unchanged.

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
