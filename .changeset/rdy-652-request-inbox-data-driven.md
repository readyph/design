---
'@readyph/ui': minor
---

RDY-652: the Requests inbox components are data-driven. `RequestList` takes `RequestListItem[]` (plate, jobTitle, sender, agoLabel supplied by the caller) and no longer reads studio data. `RequestHeader`/`RequestBody` read the same display fields plus optional `vehicleLabel`, `customerName`, `jobNumber`, `partView`, `quotePartsLabel`. `RequestThread` now takes `posts`, `hasService`, `you`, `mech`; `CustomerThread` takes `customer`, `you`, `posts`. `QuoteModal` takes optional `search`/`status` for the Inventory part search.
