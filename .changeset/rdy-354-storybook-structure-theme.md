---
'@readyph/ui': patch
---

Storybook only (RDY-354, no package API change): Prototypes now holds just the five pages (Home, Platforms, Platform, Team, Memory, in that order); the component-level prototype stories moved under Components (files renamed `*.shell.stories.tsx`, same stories, states and tests). A toolbar Theme switch (System, Light, Dark; `?globals=theme:dark`) sets `data-theme` on the document so every story, portalled overlays included, follows it. Introduction describes the new structure.
