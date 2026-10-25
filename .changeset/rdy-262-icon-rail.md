---
'@readyph/ui': minor
---

IconRail (C2) rebuilt: 52px `--frame` rail (no border), `IconRailMark` (the R, links Home), 36x36 `IconRailItem` (19px icon, 5px radius; default / hover `--frame-hover` / current `--frame-active` with `aria-current="page"` / count badge, `99+` above 99), `IconRailSpacer`, `IconRailFoot` (hosts the AccountMenu avatar button) and a reusable `CountBadge`. Tooltip to the right on hover and focus, Esc dismisses. No Settings item (it lives in the avatar menu).

API notes for consumers of the old IconRail (portal, inventory, sms): `IconRailItem` keeps `icon`, `label`, `href`, `onClick`; `active` still works but is deprecated for `current`; the rail drops its right border and `bg-surface` for `bg-frame`, width 56 -> 52, items 40 -> 36px; `IconRail` now has `aria-label="Main"` by default and a fixed width that `className` cannot override; the tooltip is now Radix with its own shared provider inside `IconRail`. New: `count`, `tooltip={false}` (phone bottom nav, RDY-261, reuses `IconRailItem` and `CountBadge`). The old IconRail also had no mark, add-platform or foot slot: compose them as children.
