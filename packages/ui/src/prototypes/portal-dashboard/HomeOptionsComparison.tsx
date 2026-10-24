/**
 * RDY-217: side-by-side comparison of the Home content options and a recommendation.
 * Review aid only (not part of the proposed product UI). Flat: a table on hairlines, no cards.
 */
import { Badge, cn } from '../../index';

type Bar = 'strip' | 'map' | 'list' | 'list-short';

/** Tiny page schematic built from token-colored bars; the map is always the largest block. */
function Schematic({ blocks, label }: { blocks: Bar[]; label: string }) {
  return (
    <div role="img" aria-label={label} className="flex h-28 w-36 flex-col gap-1.5 rounded-md border border-border bg-surface p-2">
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
  cells: [string, string, string, string];
}

const ROWS: Row[] = [
  { label: 'What it adds', cells: ['Four numbers above the map: orders, low stock, open jobs, approvals.', 'A list of decisions waiting on the owner, each with Approve and Decline.', 'The KPI strip and the approvals list together.', 'A time-ordered list of what happened across platforms.'] },
  { label: 'Helps the owner', cells: ['See the day at a glance.', 'Act without leaving Home.', 'Both of the left.', 'Catch up after being away.'] },
  { label: 'Data and API', cells: ['One small aggregate endpoint per platform kind (counts and one delta).', 'Each platform already has approvals; Portal aggregates them like Needs attention.', 'Both of the left.', 'New merged, time-ordered activity API across platforms. Not available.'] },
  { label: 'Fits v1', cells: ['Yes, with 3 small endpoints.', 'Yes.', 'Yes, but is the heaviest v1 page.', 'No. Out of scope for v1.'] },
  { label: 'Weight on the page', cells: ['Low (about 72px), but pushes the map down.', 'Medium, grows with the queue.', 'High; the map moves below the fold on laptops.', 'High; long list, low urgency.'] },
  { label: 'Overlap with Needs attention', cells: ['Same numbers, summarized.', 'Moves approval items out of Needs attention so nothing shows twice.', 'Both.', 'Repeats items that already appear in the strip.'] },
  { label: 'Leda hook', cells: ['Each figure links to its platform; prompt "Why did orders go up today?".', '"Ask Leda" per request; prompt "Is PO-1042 a normal amount?".', 'Both.', 'Prompt "What happened today?".'] },
];

const HEADS = ['A · KPI strip', 'B · Pending approvals', 'C · Combined', 'D · Activity feed'];

export function HomeOptionsComparison() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 bg-canvas px-4 py-8 text-ink sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Portal Home: content options</h1>
        <p className="max-w-3xl text-sm text-ink-muted">
          Every option keeps the connections map as the main content, the fixed flush Leda column with the previous chat, and no cards. Pick one for v1; the choice is the owner&apos;s.
        </p>
      </header>

      <section aria-labelledby="rec-heading" className="flex flex-col gap-2 border-y border-border py-5">
        <h2 id="rec-heading" className="flex items-center gap-2 text-base font-semibold">
          Recommendation <Badge tone="success" size="sm">Option B</Badge>
        </h2>
        <p className="max-w-3xl text-sm text-ink">
          Ship Pending approvals under the map for v1. It is the only addition that lets the owner finish a job from Home, it needs no new platform capability beyond what Needs attention already aggregates, and it leaves the map in view on a laptop.
        </p>
        <ul className="max-w-3xl list-disc space-y-1 pl-5 text-sm text-ink-muted">
          <li>Keep the KPI strip (A) as a follow-up once the three aggregate endpoints exist; it is cheap but duplicates what the platforms show.</li>
          <li>Skip the combined page (C) for v1: it pushes the map down and doubles the API work.</li>
          <li>Defer the activity feed (D) until a cross-platform activity API exists.</li>
        </ul>
      </section>

      <section aria-label="Comparison" className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <caption className="sr-only">Home content options compared</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="w-40 py-3 pr-4 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                &nbsp;
              </th>
              {HEADS.map((h) => (
                <th key={h} scope="col" className="px-3 py-3 font-semibold text-ink">
                  {h}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border">
              <th scope="row" className="py-3 pr-4 text-xs font-medium text-ink-subtle">
                Layout
              </th>
              <td className="px-3 py-3">
                <Schematic label="Strip, then map, then attention list" blocks={['strip', 'map', 'list-short']} />
              </td>
              <td className="px-3 py-3">
                <Schematic label="Map, then approvals list, then attention list" blocks={['map', 'list', 'list-short']} />
              </td>
              <td className="px-3 py-3">
                <Schematic label="Strip, then map, then approvals and attention lists" blocks={['strip', 'map', 'list', 'list-short']} />
              </td>
              <td className="px-3 py-3">
                <Schematic label="Map, then attention list, then activity list" blocks={['map', 'list-short', 'list']} />
              </td>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
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
