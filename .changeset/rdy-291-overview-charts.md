---
'@readyph/ui': minor
---

Add `OverviewCharts` (C31, new): each platform's last 7 days. Exports `OverviewCharts`, `WeekChart` (bars: yesterday in `chart-1`, others `chart-muted`, labelled y axis, true zero; diverging In/Out), `ShareBar`, `chartNumberFormat`, `niceTicks`. Props: `platforms[] { id, name, kind?, logo?, status?, figure?, sub?, chart? | null, shares?, facts?, state? 'ready'|'loading'|'error', onRetry?, onOpen? }`, `locale`, `stackBelow` (default 760, of the component's own width). Formats are props (`format`, `tickFormat`, `locale`; `chartNumberFormat({ locale, currency, compact })`), nothing is hard-coded to a currency. Each chart is one image with a summary plus a hidden table, readable by keyboard (arrows) and has forced-colors fallbacks.

Restore `RevenueChart` and `Sparkline` (wiped by the RDY-244 reset) from `legacy`: same props and behaviour, only remapped to the current tokens (`text-accent`, `bg-raised`, `text-muted` ...; default series colours are chart tokens) so they compile and follow light and dark.

Review round 1: non-finite values (NaN, Infinity, undefined) are missing data ("No data" via `noDataLabel`, `null` stays "Closed"); text zoom folds the rows by the root font size; Retry focus uses the shared `focusIfLost`; hover no longer announces; the chart note shows under the figure in rows.
