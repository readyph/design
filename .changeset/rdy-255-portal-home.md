---
'@readyph/ui': patch
---

Add the Portal Home prototype page (RDY-255, story `Prototypes/Portal/[For Review] Home`; not exported from the package): the map and Needs you in the place column, and Today, a case (facts line, day bar, evidence, Leda note, proposal with Confirm and Undo) or the overview in the sheet, composed only from existing parts (`PlatformShell`, `TownMap`, `Queue`, `PlatformToday`, `OverviewCharts`, `Tabs`, `SheetBar`, `AskLedaBar`, `CommandPalette`, `Chat`, `LedaProposal`, `DayBar`, `StatusBar`). States: live, quiet, loading, platform error, many (8) and few (3) platforms, conversation open, phone. No change to any component API.
