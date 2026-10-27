---
'@readyph/ui': patch
---

Home prototype page is an exact copy of the workshop page (live, quiet, loading, error, many and few platforms, HQ and platform filters, case pages, Leda panel). Shared parts get additive options only: WeekChart and OverviewCharts `variant`, Queue `hideEmpty` / `flushGroups` / `footer` / `tightGroups`, ChatChips `variant`, AskLedaBar overview sizes, PlatformToday `bare` and exported `LedaFact`, ChatHeader / ChatMessage / ChatComposer / ChatEmpty / ChatBlocks `layout` ('inline' / 'workshop'), FactsLine, SubpageTransition. Defaults unchanged. PlatformShell keeps its border under the sheet bar and the phone action bar takes the frame colour.
