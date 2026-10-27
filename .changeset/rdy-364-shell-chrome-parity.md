---
"@readyph/ui": patch
---

Portal shell chrome matches the workshop shell (RDY-364): rail mark link is 36px (rail items 4px lower), sheet bar is 48px including its border, fixed Tabs use the workshop tab (13px, 8px padding, inset underline), status bar item padding/typography and footer padding, TownMap frame (caption + map) is exactly `--map-h` and 4px below the place column top, phone top bar and nav on the frame colour with the workshop sizes, rail order Home, Platforms, Reports, Team, Memory, default account Ramon Dela Cruz. Additive: StatusBar `ledaFirst` and `leda.daysLeft`, PlatformLogo sizes 14 and 20, TownMap `caption` as ReactNode (taken over from RDY-358/359).
