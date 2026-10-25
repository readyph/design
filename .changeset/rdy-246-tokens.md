---
'@readyph/ui': minor
---

Tokens for the Portal redesign (RDY-246), applied globally: IBM Plex Sans/Mono, cobalt accent, light + grey dark (`data-theme="light|dark"` on html, absent = system), status tones (text/dot/bg/ink), data-viz, identity and map colours, Leda palette, type scale, radius, spacing, layout, shadow, blur and motion. Replaces every legacy `--ds-*` variable and Tailwind colour name (`ink`, `primary-*`, `surface-subtle`, `canvas`, ...); consumers must migrate. Tokens are also exported from `src/tokens`.
