---
"@readyph/ui": minor
---

Add **Leda chat widgets** — the interactive in-conversation blocks that render
inside a `Chat.Message` (Portal §4 / Inventory §4). A compound `LedaWidget` card
plus self-contained widgets: `StatGrid`, `Chart` (area + value-pill bars),
`Heatmap` (Orders-Breakdown style), `SegmentBars` (Income style), `Table`
(borderless), `Facts`, `Proposal` (confirm-before-write), `Form`, `Choices`,
`Links`, `Result`, `Memory` and `Suggestions`.

Built to the portal's visual language: **fill and elevation, not borders** —
raised surfaces, filled inner tiles, blue carried through fill intensity, value
pills, and only the faintest hairline where a list needs it. Theme-aware via
tokens (tuned for `data-theme="dark"`, the portal default). Presentational — the
project owns the data and actions. Storybook: **Components › Chat › Widgets**.
