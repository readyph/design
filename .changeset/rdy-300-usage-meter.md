---
'@readyph/ui': minor
---

Usage meter (C40): rebuilt `ProgressBar` on the new tokens. 4px bar, 56px wide inline (status bar) or full width (`layout="full"`) with the readout under it. New props: `label` (readout and accessible name), `layout`, `warnAt`, `actionLabel`, `actionHref`, `onAction`. `tone` is now `auto` by default (accent, warn at `warnAt` or 85%, bad when `value >= max` with a "Plan and billing" link); `primary`, `success` and `error` still work and map to accent, accent and bad. API changes: the `size` prop is removed (the bar is always 4px); `label` is now the visible readout and names the bar (use `aria-label` for a bare bar); `className` goes on the wrapper, not the bar.
