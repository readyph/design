---
'@readyph/ui': patch
---

PlatformShell: one visible `main` and one `h1` on phone (RDY-309, fixes axe landmark-one-main and page-has-heading-one). With the place column showing on phone the sheet is hidden, so the place section now takes `role="main"` (and the hidden sheet `main` gets `hidden`); with the sheet open it is the `main` as before. New optional `heading` prop (the platform name) renders a visually hidden `h1` in whichever region is visible. If you do not pass `heading`, the phone place column falls back to `placeLabel` as its `h1`; the sheet gets no `h1` unless you pass `heading`, so pass it unless your content has its own `h1` (two `h1`s would fail "one h1"). Desktop landmarks, focus handling (`focusIfLost`), `inert` during the subpage slide and the transition are unchanged. For Leonardo: add `heading` to every PlatformShell consumer that has no `h1` of its own.
