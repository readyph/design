---
'@readyph/ui': patch
---

Tabs omits `aria-controls` on a trigger while no matching `TabPanel` is rendered, so navigation-only tabs no longer report an invalid ARIA reference.
