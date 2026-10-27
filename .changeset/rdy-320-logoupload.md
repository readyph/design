---
'@readyph/ui': minor
---

LogoUpload: new logo field for General info and onboarding step 1. Takes a PNG, JPG or SVG (2 MB by default), crops it from the centre to 128x128 and calls `onChange(file, dataUrl)` with a PNG; wrong type, too large or unreadable shows an error and does not call `onChange`. "Use the default" calls `onChange(null, null)` and shows the monogram, which follows `name`. The Platform prototype's General info now uses it. For Leonardo: Portal General info and onboarding step 1 can use it instead of their own upload code.
