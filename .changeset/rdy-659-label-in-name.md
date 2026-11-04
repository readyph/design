---
"@readyph/ui": patch
---

RDY-659, RDY-660: accessible names now contain the visible text (axe label-content-name-mismatch, WCAG 2.5.3). PlatformToday "View all N" button, the AskLedaBar button (name from its visible placeholder, `aria-keyshortcuts` for the shortcut) and CustomerCard (phone) drop their `aria-label`; the extra cue stays sr-only.
