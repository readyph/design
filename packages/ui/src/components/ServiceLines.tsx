import { useState } from 'react';
import { ArrowCounterClockwise, Plus, Warning, X } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { onHandElsewhere, peso } from './sms/data';
import { forVehicle } from './sms/catalogue';
import { productIn, useWizardData } from './sms/wizardData';
import { durLabel } from './sms/scheduleModel';
import { customLine, insertPart, isCustomPrice, lineTotal, linesFromType, partLine, partNeed, removeLine, subtotal, type WizardLine } from './sms/wizardModel';
import { Combobox, type ComboOption } from './Combobox';
import { PartPicker, PartStock } from './PartPicker';

type Kind = 'car' | 'van' | 'pickup' | 'motorcycle' | null;
const digits = (s: string) => Number(s.replace(/\D/g, '')) || 0;
const ctl = 'h-10 rounded-control border border-control bg-surface px-2 text-right text-[14px] tabular-nums text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:h-11';
const link = 'inline-flex items-center gap-0.5 text-[12px] font-semibold text-accent underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:min-h-11';

/**
 * Studio-only ServiceAdder (NEW, replaces the catalogue list + the custom-line form): ONE search over the catalogue.
 * Pick a service (its usual parts come with it) or, when the typed name is not in the catalogue, "Add '<typed>' as a custom service".
 * Used by wizard step 1 and by the summary's inline lines editor.
 */
export function ServiceAdder({ lines, kind, onChange, onFocusLine, autoFocus }: { lines: WizardLine[]; kind: Kind; onChange: (next: WizardLine[]) => void; /** The line to move focus to (a new custom service: its price). */ onFocusLine?: (key: string) => void; autoFocus?: boolean }) {
  const data = useWizardData();
  const catalogue = data.catalogue;
  const [q, setQ] = useState('');
  const t = q.trim().toLowerCase();
  const added = new Set(lines.map((l) => l.typeId));
  const rows = catalogue.filter((s) => s.active && forVehicle(s, kind) && !added.has(s.id) && `${s.name} ${s.category}`.toLowerCase().includes(t)).slice(0, 40);
  const exists = catalogue.some((s) => s.active && s.name.toLowerCase() === t) || lines.some((l) => l.kind === 'service' && l.name.toLowerCase() === t);
  const options: ComboOption[] = rows.map((s) => ({
    id: s.id,
    label: `${s.name}, ${s.category}, ${peso(s.price)}`,
    node: (
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span className="min-w-0 flex-1"><span className="block truncate text-text">{s.name}</span><span className="block truncate text-[12px] text-muted">{s.category} · about {durLabel(s.mins)}{s.parts?.length ? ` · with ${s.parts.length} ${s.parts.length === 1 ? 'part' : 'parts'}` : ''}</span></span>
        <span className="flex-none text-[13px] tabular-nums text-text">{peso(s.price)}</span>
      </span>
    ),
  }));
  const typed = q.trim();
  const addCustom = () => { const c = customLine(typed, 0); onChange([...lines, c]); onFocusLine?.(c.key); setQ(''); };
  return (
    <div className="flex items-start gap-4">
    <Combobox
      className="min-w-0 flex-1"
      label="Add a service" value={q} onValueChange={setQ} options={options} autoFocus={autoFocus} search
      placeholder="Search your services, e.g. brake" emptyText={typed ? 'Not in your catalogue.' : 'Every service is already on the job.'}
      hint="Not in the list? Use Add custom service, pinned under the matches."
      onSelect={(id) => { onChange([...lines, ...linesFromType(id, data)]); setQ(''); }}
      action={typed && exists ? null : {
        id: 'custom', label: typed ? `Add ${typed} as a custom service` : 'Add a custom service, not in catalogue',
        node: <><Plus size={16} weight="bold" aria-hidden className="flex-none" /><span className="min-w-0 truncate">{typed ? <>Add &ldquo;{typed}&rdquo; as a custom service</> : 'Add a custom service (not in catalogue)'}</span></>,
        onSelect: addCustom,
      }}
    />
    <button type="button" className={cn(link, 'h-[var(--ctl-dropdown)] flex-none')} onClick={addCustom}><Plus size={12} weight="bold" aria-hidden />Add custom service</button>
    </div>
  );
}

/** Stock of a part line: this branch's stock; a warning when the whole job needs more than is here; where else to find it. */
function PartNote({ line, lines }: { line: WizardLine; lines: WizardLine[] }) {
  const data = useWizardData();
  const pr = productIn(data, line.productId!);
  if (!pr) return null;
  const { need, have, short } = partNeed(lines, pr.id, data);
  const away = onHandElsewhere(pr)[0];
  if (short === 0) return <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted"><span className="tabular-nums">{have} {pr.unit} here</span><PartStock product={pr} /></p>;
  return (
    <p role="status" className="mt-0.5 flex items-start gap-1.5 text-[12px] font-medium text-warn-ink">
      <Warning size={14} weight="fill" aria-hidden className="mt-px flex-none" />
      <span>{have === 0 ? 'None here' : `Only ${have} ${pr.unit} here`}, this job needs {need}. Short by {short}.{away ? ` ${away.qty} at ${away.name.split(', ').pop()}.` : pr.onOrder ? ` On order, ${pr.onOrder.po}.` : ' None at other branches.'} You can still book; ask Inventory for the rest.</span>
    </p>
  );
}

/**
 * Studio-only LinesTable (NEW): the services-and-price table of the wizard, ONE column template for the header, every row (parts indented in the first column) and the totals,
 * so quantity, price and total line up. `readOnly` shows the same grid as plain text (summary); editable adds qty / price inputs, Reset, Add a part and Remove.
 */
export function LinesTable({ lines, onChange, readOnly = false, totalLabel = 'Total', focusKey, empty = 'No service yet.' }: { lines: WizardLine[]; onChange?: (next: WizardLine[]) => void; readOnly?: boolean; /** Step 1 says Subtotal, the review says Total. */ totalLabel?: 'Total' | 'Subtotal'; focusKey?: string | null; empty?: string }) {
  const data = useWizardData();
  const [partFor, setPartFor] = useState<string | null>(null);
  const set = (next: WizardLine[]) => onChange?.(next);
  const patch = (key: string, p: Partial<WizardLine>) => set(lines.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const cols = readOnly
    ? 'grid grid-cols-[minmax(0,1fr)_64px_112px_120px] gap-x-4 max-[640px]:grid-cols-[minmax(0,1fr)_auto]'
    : 'grid grid-cols-[minmax(0,1fr)_64px_112px_120px_32px] gap-x-3 max-[640px]:grid-cols-[64px_minmax(0,1fr)_auto_32px] max-[640px]:gap-y-2';
  const total = subtotal(lines);
  const parts = lines.filter((l) => l.kind === 'part').reduce((a, l) => a + lineTotal(l), 0);
  const nameSpan = readOnly ? '' : 'max-[640px]:col-span-4';
  const num = readOnly ? 'text-right text-[14px] tabular-nums' : '';
  const phoneHide = readOnly ? 'max-[640px]:hidden' : '';

  if (lines.length === 0) return <p className="border-y border-rule py-6 text-center text-[13px] text-muted">{empty}</p>;
  return (
    <div>
      <div aria-hidden className={cn(cols, 'border-b border-control pb-2 text-[12px] font-medium text-muted max-[640px]:hidden')}>
        <span>Service</span><span className="text-right">Qty</span><span className="text-right">Price</span><span className="text-right">Total</span>{!readOnly && <span />}
      </div>
      <ul aria-label="Services on this job" className="divide-y divide-rule border-b border-rule [&>li[data-group]+li]:!border-t-0">
        {lines.flatMap((l, i) => {
          const changed = isCustomPrice(l);
          const part = l.kind === 'part';
          const firstPart = part && lines[i - 1]?.kind !== 'part';
          const out = [];
          if (firstPart) out.push(<li key={`${l.key}-grp`} aria-hidden className="pb-0 pl-6 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted" data-group="parts">Parts</li>);
          out.push(
            <li key={l.key} className={cn(cols, 'items-start py-3', part && 'pt-1', i > 0 && part && lines[i - 1]?.kind === 'part' && 'pt-3')}>
              <div className={cn('min-w-0', part && 'pl-6', nameSpan)}>
                {!readOnly && l.custom
                  ? <input aria-label="Service title" autoFocus={l.key === focusKey && !l.name} value={l.name} onChange={(e) => patch(l.key, { name: e.target.value })} placeholder="Service title" className={cn(ctl, 'w-full text-left')} />
                  : <p className={cn('break-words text-[14px] leading-5', !readOnly && 'flex min-h-10 items-center', part ? 'text-muted' : 'text-text')}>{l.name}</p>}
                {part && <p className="text-[12px] text-muted">{l.auto ? 'Part, comes with the service' : 'Part from Inventory'}</p>}
                {l.custom && readOnly && <p className="text-[12px] text-muted">Custom service</p>}
                {part && !readOnly && <PartNote line={l} lines={lines} />}
                {changed && (readOnly
                  ? <p className="text-[12px] font-medium text-warn-ink">Custom price (set: {peso(l.listPrice!)})</p>
                  : <p className="text-[12px] font-medium text-warn-ink">Custom price (set: {peso(l.listPrice!)}) <button type="button" className={cn(link, 'ml-1')} onClick={() => patch(l.key, { price: l.listPrice! })}><ArrowCounterClockwise size={12} aria-hidden />Reset</button></p>)}
                {readOnly && <p className="text-[12px] text-muted min-[641px]:hidden">{part ? `${l.qty} x ${peso(l.price)} unit price` : `Labour ${peso(l.price)}${l.qty > 1 ? ` x ${l.qty}` : ''}`}</p>}
                {!readOnly && l.kind === 'service' && (partFor === l.key
                  ? <div className="mt-2 max-w-md"><PartPicker label={`Add a part to ${l.name}`} exclude={lines.filter((x) => x.parentKey === l.key).map((x) => x.productId!)} autoFocus onPick={(id) => { set(insertPart(lines, partLine(id, l.key, false, data))); setPartFor(null); }} /></div>
                  : <button type="button" className={cn(link, 'mt-0.5')} onClick={() => setPartFor(l.key)} aria-label={`Add a part to ${l.name}`}><Plus size={12} aria-hidden />Add a part</button>)}
              </div>
              {readOnly ? <span className={cn(num, 'leading-5', phoneHide)}>{l.qty}</span>
                : <input inputMode="numeric" aria-label={`Quantity of ${l.name}`} value={l.qty} onChange={(e) => patch(l.key, { qty: Math.max(1, Math.min(99, digits(e.target.value))) })} className={cn(ctl, 'w-full')} />}
              {readOnly ? <span className={cn(num, 'leading-5', phoneHide)}>{peso(l.price)}<span className="block text-[12px] font-normal text-muted">{part ? 'Unit price' : 'Labour'}</span></span>
                : part ? <span className="flex flex-col items-end justify-center text-[14px] tabular-nums text-text"><span className="flex h-10 items-center max-[640px]:h-11">{peso(l.price)}</span><span className="text-[12px] text-muted">Unit price</span></span>
                : <span><span className="relative block"><span aria-hidden className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[13px] text-muted">₱</span><input inputMode="numeric" autoFocus={l.key === focusKey && !!l.name} aria-label={`Price of ${l.name || 'service'}`} value={l.price || ''} placeholder="0" onChange={(e) => patch(l.key, { price: digits(e.target.value) })} className={cn(ctl, 'w-full pl-6', changed && 'border-warn-ink font-medium')} /></span><span className="block text-right text-[12px] text-muted">Labour</span></span>}
              <span aria-label={`Line total ${peso(lineTotal(l))}`} className={cn('text-right text-[14px] font-medium tabular-nums', readOnly ? 'leading-5' : 'flex h-10 items-center justify-end max-[640px]:h-11')}>{peso(lineTotal(l))}</span>
              {!readOnly && <button type="button" aria-label={`Remove ${l.name}`} onClick={() => set(removeLine(lines, l.key))} className="inline-flex size-10 -ml-1 items-center justify-center rounded-control text-muted hover:bg-raised hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent max-[640px]:size-11"><X size={16} aria-hidden /></button>}
            </li>,
          );
          return out;
        })}
      </ul>
      <div className={cn(cols, 'items-baseline pt-3 max-[640px]:flex max-[640px]:justify-between')} data-row="total">
        <span className="col-span-2 text-[12px] text-muted">{parts > 0 ? `Labour ${peso(total - parts)} + parts ${peso(parts)}` : ''}</span>
        <span className="text-right text-[13px] text-muted max-[640px]:ml-auto max-[640px]:mr-3">{totalLabel}</span>
        <span className="text-right text-[16px] font-semibold tabular-nums" aria-label={`${totalLabel} ${peso(total)}`}>{peso(total)}</span>
        {!readOnly && <span aria-hidden className="max-[640px]:hidden" />}
      </div>
    </div>
  );
}
