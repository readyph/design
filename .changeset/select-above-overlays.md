---
"@readyph/ui": patch
---

Fix `Select` listbox rendering underneath `Modal` and `OffCanvas` overlays. The
listbox now uses the `popover` z-index token (above `modal` and `drawer`), so it
can be chosen with the pointer when opened inside an overlay.
