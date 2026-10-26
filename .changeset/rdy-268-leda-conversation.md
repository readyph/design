---
'@readyph/ui': minor
---

Add the Leda conversation panel (C8), the new `Chat` family: `Chat` (region; `variant="overlay"` is the 440px fixed panel, full screen at 640px and below, `inline` fills its parent), `ChatHeader` (Leda mark with Aurora while `busy`, "New conversation" asks first through `ConfirmDialog`, close), `ChatThread` (`role="log"`, keeps the newest message in view), `ChatMessage` (flat rows, no bubbles; owner initials or the bare Leda shard; scope chip; `thinking` row), `ChatBlocks` (text with optional word streaming, meta, table, figure, refusal, actions, `LedaProposal` card, chips), `ChatEmpty`, `ChatChips`, `ChatScopeChip`, `ChatComposer` (auto-growing textarea, Enter sends, Shift+Enter newline, scope chip, send stays focusable while busy or empty), `usePersistedChat` and `LEDA_CONVERSATION_KEY` (`rph-leda-convo-v1`).

Breaking for old `Chat` consumers: the former `Chat.Header/Messages/Message/Input/QuickActions` compound parts and the `sm/md/lg` sizes no longer exist (they were removed by the RDY-244 reset); messages are JSON `ChatMessageData` and the project owns streaming and what Send does. `LedaWidget` blocks are `table` and `figure` blocks.

`Chat` moves focus only through `focusIfLost` (composer on open, opener on close when focus was lost, composer after "New conversation"), with no timers for focus. Esc closes it unless a dialog, menu or list above it takes the key. `Toaster` keeps clear of a visible `[data-leda-panel]`: it ends 16px before the panel on desktop and pins under the panel header on a phone.
