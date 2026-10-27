---
'@readyph/ui': minor
---

StatusBar: three optional props, all additive. `planDetail` ("10 of 15 seats") renders "Starter · 10 of 15 seats", with `planTone="bad"` for an over-seat plan. `hide` (`['people']` etc.) hides single items, so `noaccess` hides only people (and the invites folded into it) while Leda usage and plan stay. When a platform is not running, the "N platforms" summary stays without "all running" and the healthy platforms collapse to a logo; the invite item word is "pending" in the default order ("waiting" with `ledaFirst={false}`). For Leonardo: Portal Team and Home pass `planDetail` and `hide`.
