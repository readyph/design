---
'@readyph/ui': patch
---

Memory prototype page: an exact copy of the workshop's memory.html (RDY-358). Page-level work: the workshop's own data, copy, left column, tabs, library (list and grid), blocked questions, customer requests, topic page and new-topic page, confirm cards, loading, error, empty, full and read-only states, the phone folder and detail screens (own back bar, icon-less chips, no bottom nav), Esc and history behaviour, deep links.

Shared components, all additive (defaults unchanged): `SheetBar` `flatActions` (the actions wrap onto their own rows between 641 and 1100px), `TryIt` `variant="workshop"` with `footnote` and `note` plus `meta` on a question (the prototype's own Try it layout), `Switch` `look="workshop"` (control-grey off track, white thumb), `Tabs` `keepInView` (default true), `TownMap` `hqLabel`, `StatusBar` `planHref` and `onPlanSelect`, `PortalFrame` (prototype only) `hidePhoneNav`. Two exact-copy fixes to existing behaviour: `Modal` becomes the full-screen phone sheet at 640px and below (was 639), and `StatusBar` shows "0 platforms · all running" when there are no platforms.
