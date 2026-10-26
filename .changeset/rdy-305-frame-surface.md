---
'@readyph/ui': patch
---

Frame surface (RDY-305): PlatformShell's place column now sets `data-surface="frame"`, so Queue, List, ListGroup and PlatformToday inside it use `--frame-rule` for row rules and offset the focus ring on `--frame`. `data-surface="surface"` restores the sheet values (rule and ring offset) for a sheet nested in the column; PlatformToday sets it when `surface="surface"`. At phone width (640px and below) the shell is all `--surface`, so the place column's frame scope, including PlatformToday blocks inside it, resets to the sheet rule and ring offset (`data-shell-place`). Dev-only: `@types/node` added so ProgressBar's test type-checks on a clean `npm ci`.
