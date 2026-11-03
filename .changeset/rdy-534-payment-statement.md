---
"@readyph/ui": minor
---

SMS payment statement: new `PaymentStatement` (statement of account card with "Add line" under the last row, totals in the Amount column, "Added at billing" marker) and `StatementActions` (Download menu and Print; Download saves a self-contained HTML file). `Combobox` and `PartPicker` are added as internals (not exported); `statementFile` and `paymentModel` sit under `src/components/sms/`.
