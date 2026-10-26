---
'@readyph/ui': minor
---

Add `OpeningHours` (C25): controlled opening hours editor. Value `{ sameAsCompany, week: Record<mon..sun, { open, from, to }>, holidays: { closed, openOn }, closures: { id, date, reason? }[] }` (24h "HH:MM", ISO dates). "Same as company hours" with a one-line week summary; per-day Open/Closed switch and opening/closing dropdowns (30-minute steps, 5:00 AM to 11:00 PM, closing always after opening and auto-adjusted with an announcement); "Copy Monday to the other open days"; the next 5 public holidays; one-off closures removed through `ConfirmDialog`; the Leda line. Locale, 12/24h and `today`/`now` come from props. Optional `savedValue`/`onSave`/`onDiscard` give one Save and Discard.

`Modal` and `ConfirmDialog` gain an optional `onCloseAutoFocus(event)`: it runs when the dialog has closed, before focus returns to the opener; `event.preventDefault()` lets the page place focus (for example with `focusIfLost`). Default behaviour is unchanged. `OpeningHours` moves focus only when it was lost, with no timers.
