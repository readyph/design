---
'@readyph/ui': patch
---

Mechanic row buttons (job rows, Today "Needs you now" cards, customer rows) no longer override their name with an `aria-label`; an sr-only "Open" prefix plus the visible text forms the accessible name, so it contains the visible label (axe `label-content-name-mismatch`).
