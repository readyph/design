---
'@readyph/ui': minor
---

Modal (C13/C20, rebuilt from legacy): fixed-size `panel` (720 x 640) and `marketplace` (904 x 744) sizes, window less 48px on small screens, full screen on phone. Header with 32px icon well, title, description and close; body scrolls inside; pinned footer. Focus trap, Esc, backdrop click, focus returns to the opener. API: `size` is now `sm | md | lg | panel | marketplace` (legacy `xl`/`2xl` removed); `icon` (Phosphor component) added; `Modal.Header` now renders the close button and takes `icon`/`description`; the quick API is triggered by `title`.

Review round 1: `Modal.Body` is keyboard focusable (tabIndex 0, inset focus ring) so it scrolls from the keyboard; Esc on an open Select closes only its listbox; icon well is `bg-raised` with `rounded-card` and an accent icon; new `iconNode` prop (header and quick API) puts any node, such as `<LedaMark size={18} decorative />`, in the well; the description wraps (13/18) and the header aligns to `items-start`; the close button is labelled "Close {title}" (string titles).
