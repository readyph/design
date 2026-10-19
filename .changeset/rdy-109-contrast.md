---
'@readyph/ui': patch
---

Fix colour contrast: Notice info, success and warning body text now uses text-ink (as error already did), and the MainNav and PlatformShell brand-mark active label uses text-primary-900 in the dark theme, so axe reports 0 colour-contrast violations in light and dark.
