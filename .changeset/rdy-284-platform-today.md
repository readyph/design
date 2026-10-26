---
'@readyph/ui': minor
---

Platform Today block (RDY-284, C24, new): `PlatformToday`, plus `pickTodayRows` and the `TodayList`, `TodayItem`, `TodayLink`, `TodayFact`, `TodayActivity` types. One block per platform, the same for every kind: sticky header (24px logo, full name that wraps, kind, Open), facts line (up to 3 facts and "Leda acts here" / "Leda reads only"), then each list as a `ListGroup` (title, "View all N", up to `maxRows` ruled rows with state pill, quantity, time and a link chip to the other platform), or the latest activity when there are no lists. HQ uses the same shape (`platform.hq`, `children` for the plan bar). Loading, error and empty states. Its lists do not listen for j / k unless `shortcuts` is set. Data is generic: `lists[] { id, title, total, items[] { id, ref, title, detail, state, tone, qty, at, link } }`. `surface` is `frame` (place column) or `surface` (sheet).
