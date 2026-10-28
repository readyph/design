---
'@readyph/ui': patch
---

RevenueChart: bars and legend swatches stay visible and distinguishable in forced-colors (alternating Highlight and Canvas fills with a CanvasText outline). Sparkline: non-finite values leave gaps instead of NaN paths, and fewer than two finite points renders a dashed empty baseline. Normal rendering is unchanged.
