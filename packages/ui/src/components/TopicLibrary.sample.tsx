import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { cn, focusRing } from '../utils/cn';
import { PlatformLogo } from './PlatformLogo';
import { ConfirmDialog } from './ConfirmDialog';
import { Toaster } from './toast/Toaster';
import { toast } from './toast/toastStore';
import type { SelectOption } from './Select';
import { TopicLibrary, useTopicLayout, type TopicCounts, type TopicFilter, type TopicItem, type TopicLibraryProps } from './TopicLibrary';

/** Sample data and a stateful page for the stories and tests. Not exported from the package. */

const FOLDERS: Record<string, string> = { company: 'Company', autoworks: 'Auto Works Quezon City', cafe: 'Café POS', stockroom: 'Main Stockroom' };

const folderOf = (id: string) => ({ label: FOLDERS[id], logo: <PlatformLogo name={FOLDERS[id]} size={16} decorative /> });

const base: Array<Omit<TopicItem, 'folder'> & { f: string }> = [
  { id: 't1', f: 'autoworks', title: 'Services and prices', lines: 'Oil change from ₱1,200, brake pads from ₱3,500, full diagnostics ₱800. Prices include labour; parts are quoted before work starts. Ask the front desk about fleet rates.', source: 'From Auto Works Quezon City data', on: true },
  { id: 't2', f: 'autoworks', title: 'Opening hours', lines: 'Monday to Saturday, 8 AM to 6 PM. Closed on Sundays and public holidays. The last car is accepted at 5 PM.', source: 'From Auto Works Quezon City data', on: true },
  { id: 't3', f: 'autoworks', title: 'Payment details', lines: 'Cash, GCash and cards at the counter. Bank transfer details are for staff only.', source: 'From Auto Works Quezon City data', on: false, locked: true, lockNote: 'Off by default. Payment details.' },
  { id: 't4', f: 'autoworks', title: 'Warranty on repairs', lines: 'Every repair carries a 30 day or 1,000 km warranty on labour. Parts follow the maker’s own warranty.', source: 'Custom', sourceKind: 'custom', on: true },
  { id: 't5', f: 'company', title: 'Where to park', lines: 'Free parking behind the building, entrance on Rizal Street. Two spaces by the door are kept for senior citizens.', source: 'Custom', sourceKind: 'custom', on: true },
  { id: 't6', f: 'company', title: 'Senior citizen discount', lines: 'Senior citizens get 20% off labour with a valid ID. Not combined with other discounts.', source: 'Custom', sourceKind: 'custom', on: false },
  { id: 't7', f: 'cafe', title: 'Menu and prices', lines: 'Coffee from ₱95, pastries from ₱80, lunch sets ₱240. Oat milk is ₱30 extra. Seasonal drinks change monthly.', source: 'From Café POS data', on: true },
  { id: 't8', f: 'cafe', title: 'Opening hours', lines: 'Every day, 7 AM to 9 PM.', source: 'From Café POS data', on: true },
  { id: 't9', f: 'stockroom', title: 'Parts in stock', lines: 'Leda can say whether a part is in stock, never how many are left or what it cost us.', source: 'From Main Stockroom data', on: false, locked: true, lockNote: 'Off by default. Stock levels.' },
  { id: 't10', f: 'stockroom', title: 'A very long title that goes on and on about the delivery windows, pick-up rules and what to bring', lines: 'Deliveries arrive Tuesday and Friday mornings. Bring the order number and a valid ID when you pick up.', source: 'From Main Stockroom data', on: true },
];

export const sampleTopics: TopicItem[] = base.map(({ f, ...t }) => ({ ...t, folder: folderOf(f) }));

/** 240 topics, for the performance story. */
export const manyTopics: TopicItem[] = Array.from({ length: 240 }, (_, i) => {
  const s = sampleTopics[i % sampleTopics.length];
  return { ...s, id: `m${i}`, title: `${s.title} ${Math.floor(i / sampleTopics.length) + 1}`, on: i % 3 !== 0 };
});

export const FOLDER_NAMES = FOLDERS;

export const businessOptions: SelectOption[] = [
  { value: '', label: 'All businesses' },
  ...Object.entries(FOLDERS).map(([value, label]) => ({ value, label, icon: <PlatformLogo name={label} size={16} decorative /> })),
];

const folderKey = (t: TopicItem) => Object.keys(FOLDERS).find((k) => FOLDERS[k] === t.folder?.label) ?? '';

export function countTopics(ts: TopicItem[]): TopicCounts {
  return { all: ts.length, on: ts.filter((t) => t.on).length, off: ts.filter((t) => !t.on).length, custom: ts.filter((t) => t.sourceKind === 'custom').length, data: ts.filter((t) => t.sourceKind !== 'custom').length };
}

const passes = (t: TopicItem, f: TopicFilter) => f === 'all' || (f === 'on' ? t.on : f === 'off' ? !t.on : f === 'custom' ? t.sourceKind === 'custom' : t.sourceKind !== 'custom');

/**
 * A page around TopicLibrary: filters by business, search and filter, saves a switch at once with Undo, and asks
 * before Turn all (off lists the topics that go quiet; on turns on only the safe ones).
 */
export function TopicLibraryPage({
  initial = sampleTopics,
  store,
  business: businessProp,
  onBusiness,
  ...props
}: Partial<TopicLibraryProps> & {
  initial?: TopicItem[];
  /** Controlled topics (a page that shares them with a folder list or a topic page). */
  store?: [TopicItem[], Dispatch<SetStateAction<TopicItem[]>>];
  /** Controlled business filter (a folder list or map in step with it). */
  business?: string;
  onBusiness?: (value: string) => void;
}) {
  const own = useState(initial);
  const [topics, setTopics] = store ?? own;
  const ownBusiness = useState('');
  const business = businessProp ?? ownBusiness[0];
  const setBusiness = (v: string) => (onBusiness ?? ownBusiness[1])(v);
  const [filter, setFilter] = useState<TopicFilter>('all');
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useTopicLayout('rph-mem-layout-demo');
  const [ask, setAsk] = useState<null | boolean>(null);

  const inBusiness = useMemo(() => topics.filter((t) => !business || folderKey(t) === business), [topics, business]);
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? topics.filter((t) => t.title.toLowerCase().includes(q) || t.lines.toLowerCase().includes(q)) : inBusiness;
  }, [topics, inBusiness, query]);
  const counts = useMemo(() => countTopics(searched), [searched]);
  const shown = useMemo(() => searched.filter((t) => passes(t, filter)), [searched, filter]);
  const folder = business ? FOLDERS[business] : undefined;
  const scope = useMemo(() => (business ? inBusiness : topics), [business, inBusiness, topics]);
  const safe = scope.filter((t) => !t.locked);
  // "Turn all on" leaves sensitive topics off, so "all on" means every non-sensitive topic is on.
  const allOn = safe.length > 0 && safe.every((t) => t.on);
  const canBulk = allOn ? scope.some((t) => t.on) : safe.some((t) => !t.on);

  const set = (ids: string[], on: boolean) => setTopics((ts) => ts.map((t) => (ids.includes(t.id) ? { ...t, on } : t)));
  const onToggle = (t: TopicItem, next: boolean) => {
    set([t.id], next);
    toast.undo(`${t.title} is ${next ? 'on' : 'off'} for customers.`, () => set([t.id], !next));
  };
  const targets = ask === null ? [] : ask ? scope.filter((t) => !t.on && !t.locked) : scope.filter((t) => t.on);
  const sensitive = ask ? scope.filter((t) => !t.on && t.locked).length : 0;
  const confirm = () => {
    const ids = targets.map((t) => t.id);
    const next = !!ask;
    set(ids, next);
    setAsk(null);
    toast.undo(`${ids.length} topics turned ${next ? 'on' : 'off'}.`, () => set(ids, !next));
  };

  return (
    <>
      <TopicLibrary
        topics={shown}
        counts={counts}
        filter={filter}
        onFilterChange={setFilter}
        businesses={businessOptions}
        business={business}
        onBusinessChange={setBusiness}
        folderLabel={folder}
        query={query}
        onQueryChange={setQuery}
        layout={layout}
        onLayoutChange={setLayout}
        onToggle={onToggle}
        onToggleAll={canBulk ? (next) => setAsk(next) : undefined}
        allOn={allOn}
        onNew={() => toast.info('New topic opens a blank page.')}
        {...props}
      />
      <ConfirmDialog
        open={ask !== null}
        onOpenChange={(o) => !o && setAsk(null)}
        title={ask ? `Turn on ${targets.length} topics?` : `Turn off ${targets.length} topics?`}
        description={
          ask
            ? `Customers' Leda can use them straight away.${sensitive ? ` ${sensitive} sensitive ${sensitive === 1 ? 'topic stays' : 'topics stay'} off until you turn ${sensitive === 1 ? 'it' : 'them'} on yourself.` : ''}`
            : "Customers' Leda stops using these:"
        }
        confirmLabel={ask ? 'Turn on' : 'Turn off'}
        onConfirm={confirm}
      >
        {!ask ? (
          <ul tabIndex={0} aria-label="Topics that go quiet" className={cn('m-0 max-h-48 list-disc overflow-y-auto rounded-chip pl-5 text-ui text-muted', focusRing)}>
            {targets.map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ul>
        ) : null}
      </ConfirmDialog>
      <Toaster />
    </>
  );
}
