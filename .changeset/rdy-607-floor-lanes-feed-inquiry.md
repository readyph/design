---
"@readyph/ui": minor
---

`FloorLanes`, `FloorFeed` and `InquiryDetail` are now data-agnostic public exports. Lanes, business hours, the now-minute, the clock (`TodayEnv`), car/customer lookups (`view`), inquiries, part movements, `productOf`, the Inventory name and the mechanic app's items (`mechItems`) arrive as props; nothing is read from a data module or store. Breaking for consumers of the earlier `FloorLanes` and `InquiryDetail`: `FloorLanes` now requires `env`, `view`, `moveTargets`, `open`, `close` and `now`; `InquiryDetail` takes `jobView` for the linked service. New types `FloorLane`, `FloorMoveTarget`, `FeedMechItem`, `TodayPartMovement`, and `state="loading"` on `FloorFeed` and `InquiryDetail`.
