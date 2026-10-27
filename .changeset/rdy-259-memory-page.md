---
'@readyph/ui': patch
---

Prototype page `Prototypes/Memory` (RDY-259): Memory composed from existing parts in the real PlatformShell (tabs, folder list, map, topic page, Try it, all states). No package API changes. The old "Memory: Blocked questions tab" story is now this page's Blocked questions tab.

The page now uses the shared Portal frame (rail, phone top bar, phone nav with More); no component API change.

Round 3 (RDY-358): Memory's phone Ask Leda bar uses `AskLedaBar variant="field"` (workshop `.pask`: 12px padding, 10px gap, 22px mark, 15px text, halo on a phone); `overview` and `bar` are unchanged. `PortalFrame`: a page under More (Memory) no longer marks More as current (the workshop marks no phone tab there); Home, Platforms and Team are unaffected. `TownMap` `error` now dims the map only (the SVG at 35%), not the building labels, so label text keeps its contrast.
