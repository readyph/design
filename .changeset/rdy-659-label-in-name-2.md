---
"@readyph/ui": patch
---

RDY-659: finish WCAG 2.5.3 Label in Name across components and sms/inventory/portal prototypes. Accessible names now come from visible content (ServicesPage day strip, DayTimeline chips, Marketplace tiles, TownMap, OrderListsPanel, ProductList, Switch On/Off word, MechFrame Profile, RequestList options, NotificationsSection); extra cues are sr-only suffixes. `aria-label` props that replaced visible text are now appended as sr-only extras (ProductList `ariaLabel`, DayTimeline chip `aria-label`, TownMap label).
