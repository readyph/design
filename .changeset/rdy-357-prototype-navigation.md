---
'@readyph/ui': patch
---

Prototype pages only (RDY-357; no published API change). The five Prototypes pages are one connected prototype in Storybook: the rail, phone nav and More menu, platform rows, breadcrumbs, Back links and Add a platform move to the matching page story, keeping theme and viewport, also in "Open canvas in new tab". The unexported `PortalFrame` gets an optional `onNavigate` prop (no default behaviour change).
