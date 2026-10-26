---
'@readyph/ui': minor
---

Toast with Undo (C11, update of Toaster / toastStore): one-line ink toast (inverts in dark), 13px, 5px radius, float shadow, optional Leda tile (`leda: true`) and a first-class Undo (`toast.undo(message, onUndo)`). One at a time (a new toast replaces the one showing), 5000ms, paused while hovered or focused, Esc closes, `role="status"` polite. Anchors bottom-left of the sheet (phone: full-width above the bottom nav), portalled to body and placed from the shell geometry. Breaking for consumers of the legacy toast: `Toaster` loses the `position` prop (new optional `anchor`, `className`), no queue (last toast wins), no per-toast close button or swipe, `title` now sits inline before the message, tone shows only as a warning/error icon, Radix Toast is no longer used.
