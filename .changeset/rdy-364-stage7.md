---
'@readyph/ui': patch
---

RDY-364 stage 7, focus parity with the workshop. StatusBar items and Team person rows use the shared `focusRing` (2px accent outline, offset 2px; no ring-2/ring-offset). Tabs editor and chips variants and the tab panel use the same outline instead of an inset ring (vertical and fixed keep offset -2px). The Home and Team page headings that take programmatic focus use `focusRing`. TownMap labels no longer call `onHover` on keyboard focus/blur (workshop map.js reacts to mouseenter/mouseleave only; focus shows the outline, not the accent highlight). API note for Leonardo: `TownMap.onHover` now fires for pointer only.
