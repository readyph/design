---
"@readyph/ui": minor
---

`CustomerField` (New service wizard) is no longer capped at 6 matches for a host that searches on the server. `WizardData` gains `onSearchCustomers(query)` (called as the user types), `customerListLimit` (default 6), `customersTotal` and `customersNote`; the field shows "Showing N of total, type a name, phone or plate to narrow." under the input when the total is larger than the matches shown, or the host's own note. Defaults are unchanged, so Storybook output is the same.
