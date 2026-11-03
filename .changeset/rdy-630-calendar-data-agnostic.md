---
'@readyph/ui': minor
---

RDY-630: WeekCalendar, CalCard and CalendarToolbar are data-agnostic. They take `env` (CalendarEnv: now, today, business hours, closed days, flag rules), `view(job)` (CalCard: `jobView`), `mechanics` (CalCard: `mechanic`) and `mechanicOptions` instead of reading the studio fixtures, and a structural job type (`TodayJob`) instead of the studio `Job`. New public helpers in `calendar/model`: `CalendarEnv`, `CalMechanic`, `CalendarItem`, `packDay`, `mechanicOptionsOf`, date helpers. `calMechanicOptions()` is no longer exported by CalendarToolbar (BREAKING removal: use `mechanicOptionsOf(mechanics)`). Stories look the same.
