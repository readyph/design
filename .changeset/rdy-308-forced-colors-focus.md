---
'@readyph/ui': patch
---

Forced-colors (Windows High Contrast) fixes, no change in other modes. `focusRing` (and the Tabs, StatusBar, LedaProposal and CommandPalette rings) now paint a 2px `Highlight` outline on focus-visible, because forced-colors drops box-shadow, and drop Tailwind's transparent `outline-none` outline there so no permanent box is drawn on idle controls. Headings made focusable with `tabIndex={-1}` (OpeningHours, RolePicker, OnboardingStepper, OverviewCharts) use `outline-0` instead of `outline-none`, so they no longer draw a permanent box. Switch uses system colours in forced-colors: off is a Canvas track with a CanvasText border and thumb, on is a Highlight track with a HighlightText thumb. The `PlatformShell > PlaceColumnSurfacesPhone` play step asserts the outline when `(forced-colors: active)` matches. New export `focusForced` in `utils/cn` (internal; API notes for Leonardo: none needed for consumers).
