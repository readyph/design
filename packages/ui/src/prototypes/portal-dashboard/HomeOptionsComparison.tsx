/**
 * RDY-217: side-by-side comparison of the Home content options and a recommendation.
 * Review aid only (not part of the proposed product UI). Flat: a table on hairlines, no cards.
 */
import { Badge, cn } from '../../index';

type Bar = 'strip' | 'map' | 'list' | 'list-short';

/** Tiny page schematic built from token-colored bars; the map is always the largest block. */
function Schematic({ blocks, label }: { blocks: Bar[]; label: string }) {
  return (
    <div role="img" aria-label={label} className="flex h-28 w-32 flex-col gap-1.5 rounded-md border border-border bg-surface p-2">
      {blocks.map((b, i) => (
        <div
          key={i}
          className={cn(
            b === 'strip' && 'h-3 shrink-0 border-y border-border-strong',
            b === 'map' && 'min-h-0 flex-1 rounded-sm border border-border bg-surface-muted',
            b === 'list' && 'h-5 shrink-0 divide-y divide-border-strong border-y border-border-strong',
            b === 'list-short' && 'h-3.5 shrink-0 border-y border-border-strong',
          )}
        />
      ))}
    </div>
  );
}

interface Row {
  label: string;
  cells: [string, string, string, string, string];
}

const ROWS: Row[] = [
  { label: 'What it adds', cells: ['Nothing: the map alone (Needs attention was removed for now).', 'Four numbers above the map: sales today, open jobs, low stock, unpaid invoices.', 'A list of decisions waiting on the owner: transfers, purchase orders, repair quotes, Leda proposals.', 'A time-ordered list of what happened across platforms.', 'The KPI strip above the map, plus Pending approvals below it.'] },
  { label: 'Helps the owner', cells: ['See what is wrong.', 'See the day at a glance.', 'Decide without leaving Home.', 'Catch up after being away.', 'All three.'] },
  { label: 'Data and API', cells: ['None.', 'One small aggregate endpoint per platform kind (a count and one delta).', 'Each platform already has approvals; Portal aggregates them per platform. Leda proposals come from Leda.', 'New merged, time-ordered activity API across platforms. Not available.', 'Both of B and C.'] },
  { label: 'Live and actionable', cells: ['Live; the map nodes link to platform detail.', 'Live; each figure links to its source. Read only.', 'Live and actionable: Approve, Decline, Review in Leda.', 'Read only; links to the source.', 'Live; actionable in the approvals list.'] },
  { label: 'Fits v1', cells: ['Yes.', 'Yes, with 3 small endpoints.', 'Yes.', 'No. Out of scope for v1.', 'Yes, but the heaviest v1 page.'] },
  { label: 'Pushed below the fold (laptop)', cells: ['Nothing.', 'Map moves down about 72px.', 'Approvals sit under the map; part of the list needs a scroll.', 'Activity sits under the map, mostly unseen.', 'Map moves down about 72px, approvals below.'] },
  { label: 'Overlap with the map', cells: ['n/a', 'Same numbers as the map node badges, summarized.', 'None: approvals are not on the map.', 'Some: offline and sync events also colour map nodes.', 'As B and C.'] },
  { label: 'Leda hook', cells: ['Prompt "What needs my attention?".', 'Figures link to platforms; prompt "Why are sales up today?".', 'Ask Leda per request; Review in Leda opens the proposal confirm card.', 'Prompt "What happened today?".', 'Both of B and C.'] },
];

const SCHEMATICS: [string, Bar[]][] = [
  ['Map only', ['map']],
  ['Strip, then map', ['strip', 'map']],
  ['Map, then approvals list', ['map', 'list']],
  ['Map, then activity list', ['map', 'list']],
  ['Strip, then map, then approvals list', ['strip', 'map', 'list']],
];

const HEADS = ['A · Baseline', 'B · KPI strip', 'C · Pending approvals', 'D · Activity feed', 'E · Combined'];

export function HomeOptionsComparison() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 bg-canvas px-4 py-8 text-ink sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Portal Home: content options</h1>
        <p className="max-w-3xl text-sm text-ink-muted">
          Every option keeps the connections map as the main content, the full-height Leda column with the previous chat, and no cards. Pick one for v1; the choice is the owner&apos;s.
        </p>
      </header>

      <section aria-labelledby="rec-heading" className="flex flex-col gap-2 rounded-lg bg-surface-muted px-4 py-5">
        <h2 id="rec-heading" className="flex items-center gap-2 text-base font-semibold">
          Recommendation <Badge tone="success" size="sm">Option C</Badge> <Badge tone="warning" size="sm">Needs re-framing</Badge>
        </h2>
        <p className="max-w-3xl text-sm text-ink">
          The owner removed the Needs attention strip, which was the baseline and the thing Option C was weighed against. Home is now the map alone, so the question is what, if anything, to add. Still lean Option C, Pending approvals under the map: it is the only addition that lets the owner finish a job from Home and it keeps the map in view on a laptop. Its rows were previously de-duplicated against Needs attention; that rule is gone.
        </p>
        <ul className="max-w-3xl list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>Keep the KPI strip (B) as a follow-up once the three aggregate endpoints exist; it is cheap but repeats what the platforms already show.</li>
          <li>Skip the combined page (E) for v1: it pushes the map down.</li>
          <li>Defer the activity feed (D) until a tenant activity API exists.</li>
          <li>Decision for the owner: stay with the map alone (A), or add one of B, C, D, E.</li>
        </ul>
      </section>

      <section aria-label="Comparison" className="overflow-x-auto">
        <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
          <caption className="sr-only">Home content options compared</caption>
          <thead>
            <tr>
              <th scope="col" className="w-40 py-3 pr-4 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                &nbsp;
              </th>
              {HEADS.map((h) => (
                <th key={h} scope="col" className="px-3 py-3 font-semibold text-ink">
                  {h}
                </th>
              ))}
            </tr>
            <tr>
              <th scope="row" className="py-3 pr-4 text-xs font-medium text-ink-subtle">
                Layout
              </th>
              {SCHEMATICS.map(([label, blocks]) => (
                <td key={label} className="px-3 py-3">
                  <Schematic label={label} blocks={blocks} />
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="align-top">
                <th scope="row" className="py-3 pr-4 text-xs font-medium text-ink-subtle">
                  {r.label}
                </th>
                {r.cells.map((c, i) => (
                  <td key={i} className="px-3 py-3 text-ink-muted">
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
