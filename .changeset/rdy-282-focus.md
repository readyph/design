---
'@readyph/ui': minor
---

Modal and ConfirmDialog gain `onCloseAutoFocus(event)`: call `event.preventDefault()` to skip the return of focus to the opener and place it yourself (default unchanged). RolePicker keeps Save and Discard focusable (`aria-disabled`, `aria-busy`, label "Saving") and, when a save, "Save and remove" or Discard completes, moves focus to the "Roles on each platform" heading (or back to Save on a failed save) with `focusIfLost`, so it never takes focus from where the user went meanwhile.
