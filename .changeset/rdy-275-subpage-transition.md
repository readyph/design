---
'@readyph/ui': minor
---

SubpageTransition (C15, new): the route-transition helper for list to detail. `SubpageTransition` (props `paneKey`, `direction` 'in' | 'out', `onExited`, `restoreFocus`) wraps one or more `SubpageLane`s (`from` 'left' | 'right', `focus`, `scroll`). Slide in 240ms, out 220ms on `--ease-subpage`; the old pane drifts 6% and dims to 0.55; the rail, map and status bar are outside the lanes and never move. Reduced motion: the old pane goes at once and the new one fades in over 140ms. Old pane is `inert` + `aria-hidden`; focus moves to the new pane's `[data-subpage-focus]`/`h1` and returns to the opener on 'out'; scroll position is restored per pane. New tokens `--subpage-drift`, `--subpage-dim` and keyframes `sub-*` (`animate-sub-in-r` ...). Also exports `usePrefersReducedMotion`.

Review round 1: panes are opaque (`SubpageLane surface="frame"` for the place column, default `surface`). On a phone, inside `PlatformShell` with a place column, the shell now slides the whole visible screen while a `SubpageTransition` runs (list region drifts and dims, sheet region slides over it, and the reverse); `PlatformShell` reads the transition from context, no new props. Focus on 'out' finds the opener in any lane. `useMatchMedia` util with an `addListener` fallback. `position: fixed` children are positioned against the sliding pane until it ends (JSDoc).

Review round 2: `PlatformShell` sets `inert` on the region under a phone slide in the render (not in an effect), so a lane moving focus in the same commit (Back during an 'in' slide) no longer meets a stale inert region. `SubpageTransition` moves focus only when it was lost or sits in the lanes; it never steals it from where the user put it.
