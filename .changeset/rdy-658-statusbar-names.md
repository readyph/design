---
'@readyph/ui': patch
---

StatusBar platform chips and the people item take their accessible name from the visible text instead of an `aria-label` (RDY-658). The label dropped the logo initials and joined spans without spaces, so axe `label-content-name-mismatch` flagged them. A running platform whose name is not shown now carries an `sr-only` name.
