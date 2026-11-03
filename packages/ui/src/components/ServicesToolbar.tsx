import { DownloadSimple } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { FactsLine, Fact } from './FactsLine';
import { Menu } from './Menu';
import { SegmentedControl } from './SegmentedControl';
import { Select } from './Select';
import type { Job } from './sms/data';
import { seedServicesApi, useServicesApi, type ServicesPerson } from './sms/servicesSource';
import { RANGES, SORTS, VIEWS, describe, isFiltered, type Filters, type RangeId, type SortId, type ViewId } from './sms/servicesModel';
import { SearchBox, ToggleChip } from './ServicesControls';

export const mechanicOptions = (people: ServicesPerson[] = seedServicesApi.src.mechanics) => [{ value: 'any', label: 'Any mechanic' }, { value: 'none', label: 'Not assigned' }, ...people.map((m) => ({ value: m.id, label: m.short }))];

export interface ToolbarProps {
  f: Filters;
  onChange: (p: Partial<Filters>) => void;
  sort: SortId;
  onSort: (s: SortId) => void;
  counts: Record<ViewId, number>;
  results: number;
  unpaidTotal: string | null;
  onClear: () => void;
  onExport: () => void;
  disabled?: boolean;
  /** Mechanic options of the filter; defaults to the data provider's mechanics. */
  mechanics?: ServicesPerson[];
}

/** Desktop filter area: saved views with counts, search, the four filters, then a result line with sort. */
export function ServicesToolbar({ f, onChange, sort, onSort, counts, results, unpaidTotal, onClear, onExport, disabled, mechanics }: ToolbarProps) {
  const api = useServicesApi();
  const words = describe(f, api);
  return (
    <div className="flex-none">
      <div className="flex items-center gap-4 px-6 pt-3">
        <SegmentedControl size="md" aria-label="Saved views" value={f.view} onChange={(v) => onChange({ view: v as ViewId })}
          options={VIEWS.map((v) => ({ value: v.id, label: v.label, count: counts[v.id] }))} />
      </div>
      <div className="flex flex-wrap items-center gap-2 px-6 py-3" role="group" aria-label="Filters">
        <SearchBox value={f.q} onChange={(q) => onChange({ q })} className="w-[360px] max-w-full" />
        <Select size="sm" aria-label="Mechanic" className="w-[148px]" value={f.mechanic} onValueChange={(mechanic) => onChange({ mechanic })} options={mechanicOptions(mechanics ?? api.src.mechanics)} />
        <Select size="sm" aria-label="Updated" className="w-[148px]" value={f.range} onValueChange={(range) => onChange({ range: range as RangeId })} options={RANGES.map((r) => ({ value: r.id, label: r.id === 'any' ? 'Updated: any time' : r.label }))} />
        <ToggleChip pressed={f.unpaid} onChange={(unpaid) => onChange({ unpaid })}>Unpaid</ToggleChip>
        <ToggleChip pressed={f.parts} onChange={(parts) => onChange({ parts })}>Waiting on parts</ToggleChip>
        <span className="flex-1" />
        <Button variant="secondary" leftIcon={DownloadSimple} onClick={onExport} disabled={disabled || results === 0}>Export {results}</Button>
      </div>
      <div className="flex items-center gap-4 border-b border-rule px-6 pb-2">
        <FactsLine className="min-w-0 flex-1" aria-label="Results">
          <Fact value={results}>{results === 1 ? 'service' : 'services'}</Fact>
          {unpaidTotal && <Fact tone="warn" value={unpaidTotal}>unpaid</Fact>}
          {isFiltered(f) && words.length > 0 && <Fact><span className="text-muted">{words.join(' · ')}</span> <button type="button" onClick={onClear} className="ml-1 text-[13px] font-semibold text-accent underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">Clear</button></Fact>}
        </FactsLine>
        <label className="flex flex-none items-center gap-2 text-[13px] text-muted">Sort<Select size="sm" aria-label="Sort by" className="w-[188px]" value={sort} onValueChange={(s) => onSort(s as SortId)} options={SORTS.map((s) => ({ value: s.id, label: s.label }))} /></label>
      </div>
    </div>
  );
}

export interface BulkBarProps {
  selected: Job[];
  onClear: () => void;
  onRemind: () => void;
  onAssign: (mechanicId: string) => void;
  onExport: () => void;
  className?: string;
  /** Who the selection can be assigned to; defaults to the data provider's mechanics. */
  mechanics?: ServicesPerson[];
}

/** The bar that replaces the result line while rows are selected. Reminders only count the selected quotes that are awaiting approval. */
export function BulkBar({ selected, onClear, onRemind, onAssign, onExport, className, mechanics }: BulkBarProps) {
  const api = useServicesApi();
  const people = mechanics ?? api.src.mechanics;
  const quotes = selected.filter((j) => j.status === 'FOR_APPROVAL').length;
  const open = selected.filter((j) => j.status !== 'COMPLETED').length;
  return (
    <div role="region" aria-label="Bulk actions" className={cn('flex flex-wrap items-center gap-2 border-b border-control bg-raised px-6 py-2 max-[640px]:px-4', className)}>
      <p className="mr-2 text-[13px] font-semibold" aria-live="polite"><span className="tabular-nums">{selected.length}</span> selected</p>
      <Button variant="secondary" onClick={onRemind} disabled={quotes === 0}>Send quote reminders{quotes ? ` (${quotes})` : ''}</Button>
      <Menu align="start" trigger={<Button variant="secondary" disabled={open === 0}>Assign to...</Button>} items={people.map((m) => ({ label: m.short, meta: m.bay, onSelect: () => onAssign(m.id) }))} />
      <Button variant="secondary" leftIcon={DownloadSimple} onClick={onExport}>Export</Button>
      <span className="flex-1" />
      {quotes === 0 && <span className="text-[12px] text-muted">Reminders need a quote awaiting OK.</span>}
      <Button variant="text" onClick={onClear}>Clear selection</Button>
    </div>
  );
}


