---
'@readyph/ui': minor
---

List group (RDY-304, new): `ListGroups` and `ListGroup` for titled groups of List rows (Team, queue, connections editor). Each group is `role="group"` named by its heading and holds a real List; the column header is written once on `ListGroups`; one j / k cursor crosses all groups (skips titles, collapsed and empty groups) and the inner Lists never listen. `ListGroup` has `title`, `count`, `note`, `actions`, `level`, `collapsible` and `empty`. `List` now exports `useListCursor` (same behaviour) and no longer renders its live region when `shortcuts` is false. Use fixed or fr column tracks (not `auto`) so header and rows line up.
