---
'@readyph/ui': minor
---

Modal (C13/C20, rebuilt from legacy): fixed-size `panel` (720 x 640) and `marketplace` (904 x 744) sizes, window less 48px on small screens, full screen on phone. Header with 32px icon well, title, description and close; body scrolls inside; pinned footer. Focus trap, Esc, backdrop click, focus returns to the opener. API: `size` is now `sm | md | lg | panel | marketplace` (legacy `xl`/`2xl` removed); `icon` (Phosphor component) added; `Modal.Header` now renders the close button and takes `icon`/`description`; the quick API is triggered by `title`.
