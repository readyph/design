---
"@readyph/ui": minor
---

SMS mechanic service screen: `MechServiceBody` (customer, service items, actions, pause / mark-done / ask dialogs; also exports `ServiceItemRow`, `MechCustomer`, `MechAsk`, `ServiceHeader`, `MechServiceBar`), `MechParts` (parts checklist table and part requests) and `MechFeed` (updates composer with the Found a problem switch, and the activity log). The card step view model sits under `src/components/sms/mechCardView.ts` and is not exported.
