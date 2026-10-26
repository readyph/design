---
'@readyph/ui': minor
---

SubpageTransition (C15, new): the route-transition helper for list to detail. `SubpageTransition` (props `paneKey`, `direction` 'in' | 'out', `onExited`, `restoreFocus`) wraps one or more `SubpageLane`s (`from` 'left' | 'right', `focus`, `scroll`). Slide in 240ms, out 220ms on `--ease-subpage`; the old pane drifts 6% and dims to 0.55; the rail, map and status bar are outside the lanes and never move. Reduced motion: the old pane goes at once and the new one fades in over 140ms. Old pane is `inert` + `aria-hidden`; focus moves to the new pane's `[data-subpage-focus]`/`h1` and returns to the opener on 'out'; scroll position is restored per pane. New tokens `--subpage-drift`, `--subpage-dim` and keyframes `sub-*` (`animate-sub-in-r` ...). Also exports `usePrefersReducedMotion`.
