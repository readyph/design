---
'@readyph/ui': patch
---

Home prototype page is an exact copy of the workshop page (live, quiet, loading, error, many and few platforms, HQ and platform filters, case pages, Leda panel). Shared parts get additive options only: WeekChart and OverviewCharts `variant`, Queue `hideEmpty` / `flushGroups` / `footer` / `tightGroups`, ChatChips `variant`, AskLedaBar overview sizes, PlatformToday `bare` and exported `LedaFact`, ChatHeader / ChatMessage / ChatComposer / ChatEmpty / ChatBlocks `layout` ('inline' / 'workshop'), FactsLine, SubpageTransition. Defaults unchanged. PlatformShell keeps its border under the sheet bar and the phone action bar takes the frame colour.

B9: ChatChips `overview` chips are a fixed 30px high like the workshop (a long chip overflows, not reflows); Queue `hideEmpty` drops the rule above the pinned groups and keeps 12px under the list. Defaults unchanged.

B11: ChatChips `overview` chips centre their text and use the border colour (hover: control), PlatformToday's Open button is 40px high on a phone, Home phone ask bar uses AskLedaBar `field`. Home: Team rail badge and status-bar invites show the pending count (invites less HQ decisions cleared), the loading state has the workshop's fixed "Loading" tab and case skeleton, and asking from the command palette leaves focus in the Leda composer. Defaults unchanged.
