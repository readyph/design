---
'@readyph/ui': minor
---

Shell chrome exact copy, stage 6 (RDY-364). The shared `focusRing` is now the workshop focus outline (2px accent, offset 2px) instead of a box-shadow ring with an offset-colour gap, so rings no longer draw pale corner arcs and need no `ring-offset-*` colour; `ring-offset-*` classes beside `focusRing` are now inert. Vertical and fixed `Tabs` use the workshop `outline-offset: -2px` (drawn inside the tab, was an inset 2px ring); editor and chips tabs keep the inset ring. Platform and Blocked questions text fields: focus outline offset 1px and accent border, as the workshop `.field input:focus`. No API change.

Review round 1 fixes: ModalBody focus outline is drawn inside the dialog (`-outline-offset-2`) so overflow-hidden no longer clips it; removed the inert `ring-offset-*` classes and the `--ring-offset-bg` surface rules (IconRail, PortalFrame, LedaNote, Chat, LedaProposal); LedaProposal result link uses the shared outline.
