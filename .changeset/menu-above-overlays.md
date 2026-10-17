---
"@readyph/ui": patch
---

Fix `Menu` content rendering underneath `Modal` and `OffCanvas` overlays. The
menu now uses the `popover` z-index token (above `modal` and `drawer`), so its
items can be chosen with the pointer when opened inside an overlay.
