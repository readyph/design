---
'@readyph/ui': patch
---

Prototype page (RDY-257, handover 2.3), Storybook only and not exported: `Prototypes/Portal/[For Review] Platform`. The Portal Platform detail in the real PlatformShell (map, vertical tab list with status words, five tabs: General info, System, Team, Connections, Leda & Memory; a draft per tab with "Unsaved", Save and Discard, and the browser's leave prompt) and the onboarding (`?new=<kind>`, resumable) on `OnboardingStepper`, plus the blocked and confirm disconnect dialogs. Composed from existing parts: `Tabs`, `OpeningHours`, `ConnectionsEditor`, `BlockedQuestions`, `TryIt`, `Select`, `Switch`, `DataList`, `ConfirmDialog`, `Modal`, `TownMap`.
