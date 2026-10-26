---
'@readyph/ui': minor
---

Leda proposal / confirm card (C9, RDY-269): `LedaProposal`. Raised card with the top line (Leda mark, state in words, mono ID), title, lines table, "Confirm writes" list (with muted notes and a "cannot" line), warning, and actions (Confirm with a custom label, optional extra, Discard). States: waiting, writing (Aurora, `aria-busy`, Confirm keeps focus), done, discarded, and "Open {page} to confirm". Props: `id`, `title`, `lines[{label, value, detail?, total?}]`, `writes[]`, `writesHeading`, `notes[]`, `cannot`, `warning`, `state`, `confirmLabel`, `extra`, `onConfirm`, `onDiscard`, `after`, `doneAt`, `doneAction`, `openPage`, `openHref`.
