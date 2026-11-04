---
'@readyph/ui': minor
---

RDY-662: MechFrame, MechMe and BizMark no longer read studio sample data. MechFrame now takes `business`, `branchName?`, `logoSrc?` and a minimal `me` ({ name, initials?, id? }); BizMark takes `name`; MechMe is props-driven (`name`, `subtitle`, `prefs`, `onPref`, `hoursText`, `onSignOut`). Breaking for MechMe callers (`me`, `s`, `offToday` removed).
