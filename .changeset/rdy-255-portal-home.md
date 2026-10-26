---
'@readyph/ui': patch
---

Add the Portal Home prototype page (RDY-255, story `Prototypes/Home`; not exported from the package): the map and Needs you in the place column, and Today, a case (facts line, day bar, evidence, Leda note, proposal with Confirm and Undo) or the overview in the sheet, composed only from existing parts (`PlatformShell`, `TownMap`, `Queue`, `PlatformToday`, `OverviewCharts`, `Tabs`, `SheetBar`, `AskLedaBar`, `CommandPalette`, `Chat`, `LedaProposal`, `DayBar`, `StatusBar`). States: live, quiet, loading, platform error, many (8) and few (3) platforms, conversation open, phone. No change to any component API.

The Portal chrome is one shared prototype composition, `PortalFrame` (`packages/ui/src/prototypes/PortalFrame.tsx`, not exported from the package): the rail (Home, Platforms, Reports, Memory, Team, account), a phone top bar with the account avatar and Leda, and a phone nav with labelled tabs plus More. Home carries it; the other Portal prototype pages adopt it.
