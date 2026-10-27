---
'@readyph/ui': minor
---

RDY-361 stage 2 (Platform detail, General info exact copy). New shared parts: `TextField` (labelled text box with the workshop focus: 2px accent outline at 1px offset and an accent border; props `id, label, value, onChange, hint, error, unit, type, required, max, className`; place it in a two-column grid with a 24px row gap) and `FactsTable` (read-only `dl`, 140px label column, 13/20, 12px rows with a rule, up to 720px; props `items: {label, value}[]`, `className`). `PlatformLogo` gains size 40. The Platform page now uses them; no existing component API changed.

For Leonardo: `TextField` replaces the local labelled input in the Platform prototype (same classes as BlockedQuestions' field, which can adopt it later); `FactsTable` is a never-stacking sibling of `DataList` for the facts block under a form.
