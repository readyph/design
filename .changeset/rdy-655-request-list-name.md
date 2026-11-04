---
'@readyph/ui': patch
---

RDY-655 / RDY-658: RequestList rows no longer carry a custom `aria-label`; the accessible name comes from the visible row text (plus a screen-reader-only "Unread"), so it always contains what is shown and axe `label-content-name-mismatch` passes at desktop and 390px.
