---
"@readyph/ui": minor
---

`MechParts` is now data-driven (props: parts, requests, readOnly, onToggle, onRequest); `MechPartsSample` is its sample-data adapter with the same output. `MechFeed` posts accept an optional real `author` and `time` label, and the composer accepts real photo files through `onPickPhotos` (files are also passed as the 4th argument of `onPost`).
