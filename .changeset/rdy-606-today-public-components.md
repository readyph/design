---
"@readyph/ui": minor
---

Today components are now data-agnostic public exports: `PartChip`, `JobRow`, `InfiniteSentinel` / `ListEnd` / `CardSkeletons` / `ResultCount`, `PanelToggle` and `SidePanelLayout`. They take data, the clock (`TodayEnv`) and stock rules as props. New structural types (`TodayJob`, `TodayProduct`, `TodayMechanic`, `TodayInquiry`, `JobStatus`, `PendingReason`, `NeedsReason`, `NextAction`) and pure helpers (`hm`, `minOf`, `dayWord`, `serviceTitle`, `shortName`, `flagOf`, `reasonOf`, `nextAction`) are exported. Breaking for consumers of the earlier SMS `JobRow` / `PartChip` / `SidePanelLayout`: they now require `env`, `view`, `mechanics`, `inventoryName`, `feed` and `stats` props.
