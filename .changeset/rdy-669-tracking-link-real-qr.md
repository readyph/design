---
'@readyph/ui': minor
---

RDY-669: TrackingLink hides the "Preview only: not scannable" badge when a real `qr` is passed, shows Send by SMS only when `onSendSms` is passed (callers that relied on the always-on button must now pass it), and no longer says "(simulated)" in the SMS status and toast.
