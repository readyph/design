---
'@readyph/ui': patch
---

PlatformToday (RDY-306): on phone inside PlatformShell the sticky header paints the place column's colour (`--surface`) instead of `--frame`, and the title-link focus ring offsets on the same colour. New `--scope-bg` variable on the `data-surface` scope, overridden by the existing phone reset. Wider than 640px and standalone: unchanged.
