---
'@readyph/ui': minor
---

Portal frame (RDY-316): `PortalFrame` moves from the prototypes into `components/` and is exported (with `PortalPage`, `PortalDest`, `PortalAccount`, `PortalFrameProps`), so Portal can import the shared rail, phone top bar and phone nav. It takes `current`, `place`, `sheetBar`, `detail`, `topBar`, `leda`, `account`, `teamCount`, `onAddPlatform`, and `onNavigate(dest)` (no routing library inside; links keep their `#` hrefs without it). New `DetailTopBar` (back link, title, Ask Leda button, account avatar) is the phone top bar for a detail screen, passed as `topBar`. New `hideSheetBarOnPhone` on `PlatformShell` (inherited by `PortalFrame`) hides the sheet bar and its border at 640px and below. New `focusOnArrival` prop moves focus to the page heading after an in-app navigation. The prototype pages keep working through a thin adapter in `prototypes/PortalFrame.tsx`.
