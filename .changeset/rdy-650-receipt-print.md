---
'@readyph/ui': minor
---

RDY-650: ReceiptModal's Print now prints. New optional `onPrint` prop (default `printReceipt`, exported: sets `body[data-print-receipt]`, calls `window.print()`, clears the flag on `afterprint`) replaces the "Sent to the printer" toast. `styles.css` ships the `@media print` isolation, so only the receipt article (`data-receipt-doc`) prints. Consumers with their own `body[data-print-receipt]` print CSS (sms RDY-575) can drop it. Stories unchanged.
