---
'@readyph/ui': minor
---

RDY-629 Services & prices is data-agnostic: `ServicesPricesPage` accepts host `services`, `products`, `state` (`ready` / `loading` / `empty` / `error`), `onCreate` / `onUpdate` / `onToggleActive`, `searchParts` and `partsStatus`; `PartPicker` takes `search` and `status` (`ok` / `slow` / `down`) and `onPick` now also passes the product; `ServicePartsEditor`, `ServiceTypeForm` and `CatalogueTable` resolve linked parts from host `products` (or the picked option), not the static sample. `partsCost` / `partsStock` take an optional product list. Without these props everything still runs on the sample data.
