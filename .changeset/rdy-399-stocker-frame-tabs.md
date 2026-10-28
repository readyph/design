---
'@readyph/ui': minor
---

RDY-399 StockerFrame: remove the `flow` prop. The workshop never hides the tab bar, so tabs are always shown except on the signed-out screen. Consumers passing `flow` must drop it.
