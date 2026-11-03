---
"@readyph/ui": minor
---

`Inspector`, `TrackingLink` and the Leda conversation (`useLedaPanel`) are now data-agnostic public exports. `Inspector` takes the service, `env` (`TodayEnv`), `view`, `customerPhone`, `mechanics`, `products`, `totals`, `quotation`, `proposals` and callbacks (`onConfirmProposal`, `onDiscardProposal`, `onAction`, `onAssign`, `onResolve`, `onViewQuote`, `onBookQuote`, `onEditQuote`, `onOpenService`) as props. `TrackingLink` takes `url`, `expiryDays`, the customer and `onCopy` / `onSendSms` / `onRegenerate`, with an optional `qr` slot. `useLedaPanel` takes `person`, `proposals` (`LedaProposalData`), `answer`, `palette` and `onConfirmed` / `onDiscarded`. New types: `LedaProposalData`, `InspectorJob`, `InspectorMechanic`, `InspectorQuotation`. Breaking for consumers of the earlier SMS `Inspector` and `TrackingLink`, which read the mock data directly.
