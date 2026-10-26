---
'@readyph/ui': minor
---

Platform map (RDY-276, C16, new): `TownMap`, replacing the Lab TownScene. Building per platform kind (warehouse, service, store, generic office with the kind on its sign, HQ plot), empty lots, roads by link status (solid, long dashes, short dashes), HTML label buttons with a collision pass (`placeLabels`), selected/highlight/focus/loading/error states. Props: `platforms` (null = lot), `links`, `selected`, `highlight`, `focus`, `dimOthers`, `onSelect`, `onHover`, `loading`, `error`, `onRetry`, `caption`; ref `TownMapHandle` (rotate, zoom, runVan, state, morph, placeLabels, setDark no-op). Tokens: `map-top/side/road` light values replaced (were placeholders), new `map-side-2`; preset keyframes `town-flow-a/b`. Colours follow the theme through tokens and `light-dark()`; motion is static under reduced motion.
