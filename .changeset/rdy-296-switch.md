---
'@readyph/ui': minor
---

Switch row (C36): rebuilt on the new tokens. 34x20 track, 14px thumb, accent when on, faint border and thumb when off, hover, focus ring and disabled states. Adds optional `example` and `lockNote` props; the visible label is now a real `<label>` (the description is announced through `aria-describedby`, no longer part of the name). Existing props are unchanged.
