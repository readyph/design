---
'@readyph/ui': patch
---

Storybook only (RDY-355; no component or package API change). Faster to open: the render-blocking Google Fonts `@import` in `globals.css` is loaded without blocking in the Storybook preview, `storybook dev` rewrites the 6 MB `@phosphor-icons/react` barrel to per-icon imports and pre-bundles them up front, axe no longer runs on every story render (Accessibility panel "Run test" and the vitest axe tests still cover it), and telemetry, crash reports and update checks are off. Viewport menu: Laptop 1280, Desktop 1440, Large desktop 1920 and the shell breakpoint widths (320, 375, 640, 641) next to the existing phone and tablet sizes; the five `Prototypes` pages open at Desktop 1440 (phone stories still force phone).
