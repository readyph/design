---
'@readyph/ui': minor
---

Rail logo (RDY-365): `ReadyMark` gains `effect="shine"` beside the default `assemble` (swoop-assemble, unchanged): one 1.9 s light sweep along the 60 degree cut (two bands clipped to the lit and mid planes, a pale eye flash), CSS keyframes and inline SVG, rest frame identical to the static mark, reduced motion is one 900 ms brightness step. Five new brand tokens, `--rd-shine-lit`, `--rd-shine-lit-core`, `--rd-shine-mid`, `--rd-shine-mid-core`, `--rd-shine-eye`, light and dark. Exports `READY_SHINE_MS`. `IconRailMark` now plays the shine (once on mount, replay on hover and keyboard focus, never loops) and draws the full-detail cut at 36px inside the unchanged 36px link (before: swoop-assemble, small cut, 28px). `READY_ASSEMBLE_MS` stays exported.
