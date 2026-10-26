---
'@readyph/ui': patch
---

Queue and PlatformToday (RDY-255 review): add `retryLabel` to both (button text on the error block, default "Try again"); Queue gets a `belowHeadline` slot (under Leda's headline, above the list, e.g. the phone Leda bar); Queue's cursor row carries the primary action button (the others stay secondary); the Queue scroll box no longer scrolls while loading (axe scrollable-region-focusable); `ref` text in PlatformToday rows and link chips stays whole (no break inside "ALT-NCP150").

Queue rows also hide their transparent border in forced colors and mark the cursor row with `Highlight`.
