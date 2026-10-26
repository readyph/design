---
'@readyph/ui': minor
---

Add `TryIt` (C30, new): the Try it tester on `Modal size="panel"` with the Leda mark in the header. Props: `open`, `onOpenChange`, `abouts[]`, `about?`/`onAboutChange?`, `aboutFixed?`, `questions[]` (optional `about` filter), `question?`/`onQuestionChange?`, `ask(about, question)` (sync or async, returns `{ answer, reason, tone }`), `thinkingMs` (900), `title`, `description`, `onCloseAutoFocus`. Asks on open and on every change; "Thinking…" with Aurora on the header mark and the reply tile while the reply is laid out beneath it; focus starts on the question and returns there through `focusIfLost` only if lost.

`Select` gets a `wrap` prop (non-breaking, default off): long labels wrap inside the button instead of being cut off (the list already wraps).
