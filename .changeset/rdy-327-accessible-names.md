---
'@readyph/ui': patch
---

Accessible names now start with the visible label (axe `label-content-name-mismatch`) on TownMap platform buttons, AccountButton, AskLedaBar and StatusBar items. TownMap's default name is the visible text plus visually hidden status; custom `platformLabel`/`hqLabel` should start with the visible label.
