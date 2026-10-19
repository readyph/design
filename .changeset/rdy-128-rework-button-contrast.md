---
'@readyph/ui': patch
---

Button: the dark theme primary hover now uses primary-200 (the dark-darkened blue) so the white label stays at 4.5:1 or better instead of dropping to 2.5:1; the dark secondary keeps its transparent fill and subtle border while light uses border-border-strong on bg-surface; the label wrapper is no longer display:contents so axe can check Button label contrast.
