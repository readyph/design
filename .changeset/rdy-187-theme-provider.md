---
'@readyph/ui': minor
---

Add `ThemeProvider`, `useTheme()` and the no-flash `themeScript`. Preference is `system` (default), `light` or `dark`, stored per browser in `localStorage` key `readyph.theme`; `system` follows `prefers-color-scheme` live; the resolved theme is written to `data-theme` on `<html>`. Put `themeScript` inline in `<head>` to set `data-theme` before first paint.
