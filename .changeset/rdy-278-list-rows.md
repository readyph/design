---
'@readyph/ui': minor
---

List rows (RDY-278, C18, new): `List`, `ListHeader`, `ListHeaderCell`, `ListRow`, `ListCell`, `ListMetrics`, `ListMetric` and `listRowSurface`. Ruled rows (radius 0, `--row-y` 16px, 1px `--rule`, subgrid value columns), `as="table"` for row/columnheader/cell roles, and a j/k cursor (2px accent, Enter opens, `aria-current`, live announcement). Only the hovered row highlights; the 8px transparent border + `background-clip: padding-box` rule is restated on hover, cursor and flash. Rows stack by the list's own width (`stackBelow` 600 / 760 / 880). The preset now ships a small container-query plugin (`@container/list`, `@max-[760px]/list:`; file `plugins/container-queries.cjs`, included in the package `files`) and a `row-flash` animation. There is no `Table` in `@readyph/ui` since the reset; when one returns it should spread `listRowSurface` on its rows for the same hover rule.
