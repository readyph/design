---
'@readyph/ui': minor
---

RolePicker: three optional props for copy, all additive (defaults unchanged). `rolesIntro` and `accessIntro` add a muted line under "Roles on each platform" and "Portal access". `removeConfirm` ({ title, description, confirmLabel }, each text or a function of the platforms being removed) replaces the removal confirm words ("Remove access?", "Save and remove") so a page can say "Take Liza off Auto Works?" and "Remove and save". For Leonardo: no existing consumer changes; RDY-258 passes all three from the Portal Team person page.
