---
'@readyph/ui': patch
---

Fix colour contrast through tokens. ink-subtle and ink-muted are darker in light and lighter in dark so secondary text passes 4.5:1 on canvas, surface and muted surfaces. New success-fg, warning-fg and error-fg text tokens (text-success-fg etc.) replace text-success, text-warning and text-error for text on tinted backgrounds; the base colors stay for fills and dots. Tabs pill active label gets a dark-theme override. axe reports 0 colour-contrast violations in the repair-shop prototype stories, light and dark.
