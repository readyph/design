---
'@readyph/ui': patch
---

Storybook only (RDY-356; no component or package API change). Laptop, Desktop and Large desktop fit the preview pane like a normal browser window: the page is scaled to the pane width (the story still sees 1280, 1440 or 1920 wide, so media queries and shell breakpoints do not change) and is as tall as the pane, up to its nominal height, so nothing overlaps the addons panel or the sidebar and the pane does not scroll. Phone, tablet and Responsive sizes are unchanged, and "Open canvas in new tab" is unchanged. A size picked in the toolbar now survives walking the Prototypes pages: the pages no longer force Desktop 1440 on every story change (they open at Desktop 1440 only when no size is chosen; phone stories still force phone), and the toolbar no longer falls back to Responsive after opening a story for the first time in a session.
