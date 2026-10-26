---
'@readyph/ui': minor
---

StatusBar (C4, new): the 34px Portal status strip for PlatformShell's `status` slot. A logo per platform (name beside it with 3 or fewer platforms or from 1180px; non-running platforms always show a plain word), people, invites waiting, Leda usage minibar (warn from 80%), plan and "Updated" time. Narrow widths drop Updated, then plan, then the invite word. It renders a plain list, no `footer` of its own: the shell supplies the labelled landmark.
