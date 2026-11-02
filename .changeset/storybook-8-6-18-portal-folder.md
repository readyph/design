---
"@readyph/ui": patch
---

Storybook tooling and sidebar: `@storybook/addon-essentials` and `@storybook/blocks` are pinned to 8.6.18 so every Storybook package matches (clears the "incompatible packages" warning), the `storybook` and `build-storybook` scripts silence the Node 24 `DEP0190` warning raised by the Storybook CLI, and the Home, Platforms, Platform, Team and Memory prototypes move into a `Prototypes/Portal` folder (story ids become `prototypes-portal-*`), with the sidebar order Portal, Inventory, SMS.
