---
'@readyph/ui': minor
---

CommandPalette (C7, new): the Cmd+K palette. A 640px translucent panel 72px from the top (full screen on a phone) with a 48px input row carrying Leda's mark, and a grouped listbox (Ask, Leda conversation, then the page's own groups such as Ask Leda, Tell Leda to do, page objects, Go to). Combobox/listbox semantics with `aria-activedescendant`, type-ahead filtering, IME-safe Enter, focus trap and return, Esc closes. It registers no global keys: `AskLedaBar` owns Cmd/Ctrl+K and "/", the page sets `open` here and `paused` on the bar. Different from the reverted `CommandPalette`.
