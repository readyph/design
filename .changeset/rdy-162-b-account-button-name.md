---
'@readyph/ui': patch
---

Account buttons in the portal, inventory and repair-shop shells (and the mechanic shell) no longer override their name with aria-label "Account", which did not contain the visible initials (axe label-content-name-mismatch). The name now comes from content: the initials, a space, and visually hidden "Account". PlatformShell gets the same space so the name no longer reads "MSAccount".
