---
'@readyph/ui': patch
---

Storybook only (RDY-354, no package API change): Prototypes now holds just the five pages (Home, Platforms, Platform, Team, Memory, in that order); the component-level prototype stories moved under Components (files renamed `*.shell.stories.tsx`, same stories, states and tests). A toolbar Theme switch (System, Light, Dark; `?globals=theme:dark`) sets `data-theme` on the document so every story, portalled overlays included, follows it. Components has no loose stories at the top: AccountMenu and IconRail moved under Navigation, Menu under Overlays, Leda mark under Leda, and the chart stories under Charts; families are sorted. The AccountMenu and IconRail stories that are not Light or Dark variants now follow the toolbar. Introduction describes the new structure.
