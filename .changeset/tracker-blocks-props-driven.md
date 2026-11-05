---
"@readyph/ui": minor
---

Customer tracker blocks and `ChatPanel` are now props-driven (no store access). `WhoBlock`, `StatusBlock`, `ItemsBlock`, `PaymentBlock`, `UpdatesBlock`, `QuoteCard` take plain view-models; `QuoteCard` takes `onAnswer(quoteId, 'approved' | 'declined')` with optional `pending` / `error`; `ChatPanel` takes `thread`, `manager`, `shop`, `today`, `onSend(text)`, optional `onMarkRead`, `pending`, `error`; `TrackerFrame` takes `business` and `branchName`. The redacted tracker view-model types (`TrackerView`, `TrackerWhoView`, `TrackerStatusView`, `TrackerQuoteView`, `TrackerUpdateView`, `TrackerPaymentView`, `TrackerChatMessage`, ...) are exported. Storybook output is unchanged (a story adapter supplies the store-backed props).
