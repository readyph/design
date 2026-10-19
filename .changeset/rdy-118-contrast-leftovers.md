---
'@readyph/ui': patch
---

Fix remaining colour contrast failures. The link token is now #1d4ed8 in light so links pass 4.5:1 on the canvas. Disabled Checkbox, Switch and RadioGroup labels use text-ink-muted instead of fading the whole label with opacity. Portal dashboard, portal reports and inventory reports stories no longer fail in light or dark. axe reports 0 colour-contrast violations across all 267 stories, light and dark.
