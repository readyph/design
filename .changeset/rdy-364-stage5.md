---
'@readyph/ui': patch
---

PlatformShell phone `actionBar` now matches the workshop `.pbar`: on the frame colour, no top border, 8px 16px padding plus the bottom safe-area inset, 44px buttons sharing the row at 14px. Callers keep passing plain `Button`s; the bar sizes them. The Platform page place column header (name 22px/28px, 13px/20px sub line) and vertical Tabs now sit at the workshop's x/y (tabs span the full column, no extra 12px inset).
