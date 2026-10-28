---
'@readyph/ui': patch
---

Overlay focus fixes: Modal returns focus to the opener without a body-focused frame; `focusIfLost` walks nested shadow roots (and documents the `null` container); ConfirmDialog/TryIt opened already `loading` focus the dialog; Marketplace filter segments scroll into view on focus.
