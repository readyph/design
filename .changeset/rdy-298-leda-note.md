---
'@readyph/ui': minor
---

Leda note and refusal (RDY-298, C38, new): `LedaNote` (raised box, 16px Leda tile, optional `byline`), `LedaRefusal` (Prohibit icon, one-line reason, `action` as the way out) and `LedaNoteLink`. Both are `role="note"` with an accessible name (`label`), wrap long text instead of truncating, and work on `--frame` and `--surface` in both themes.
