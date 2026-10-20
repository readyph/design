---
'@readyph/ui': patch
---

PlatformShell account button no longer overrides its name with aria-label "Account", which did not contain the visible initials (axe label-content-name-mismatch). The name now comes from content: the initials plus visually hidden "Account".
