---
'@readyph/ui': minor
---

PlatformShell: add `railState` (`'loading' | 'error' | 'ready'`, default `'ready'`) and `onRetryPlatforms` so the rail shows placeholder tiles while platforms load and a "Platforms failed" message with a Retry button on error. Exports the `PlatformShellRailState` type.
