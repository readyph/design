import { useState, type ReactNode } from 'react';
import { Plus, X } from '@phosphor-icons/react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { SegmentedControl } from './SegmentedControl';
import { Select } from './Select';
import { TextField } from './TextField';
import { cn } from '../utils/cn';
import { MoneyField } from './MoneyField';
import { billDiscount, billSubtotal, billTotal, discountWord, fmt, statementOf, type BillCatalogueItem, type BillJob, type BillPart, type BillProduct, type BillService, type StatementHeader, type StatementLine } from './payment/model';
import { PartPicker, type PartSearch, type PartsStatus } from './PartPicker';

const GRID = 'grid grid-cols-[minmax(0,1fr)_56px_112px_120px] items-baseline gap-x-3 max-[640px]:grid-cols-[minmax(0,1fr)_auto]';

function Row({ l, canRemove, onRemove }: { l: StatementLine; canRemove: boolean; onRemove: () => void }) {
  return (
    <li className={cn(GRID, 'border-b border-rule px-4 py-2.5 text-[14px] max-[640px]:px-3')}>
      <span className="min-w-0">
        <span className="block break-words">{l.name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
          {l.sub && <span className="font-mono">{l.sub}</span>}
          {l.billing && <span className="font-semibold text-accent">Added at billing</span>}
          {l.setPrice !== undefined && <span className="text-warn-ink">Custom price (set: {fmt(l.setPrice)})</span>}
          <span className="min-[641px]:hidden tabular-nums">{l.qty} × {fmt(l.unit)}</span>
        </span>
      </span>
      <span className="text-right tabular-nums text-muted max-[640px]:hidden">{l.qty}</span>
      <span className="text-right tabular-nums text-muted max-[640px]:hidden">{fmt(l.unit)}</span>
      <span className="flex items-baseline justify-end gap-1 text-right tabular-nums">
        {fmt(l.total)}
        {canRemove && l.billing && <button type="button" onClick={onRemove} aria-label={`Remove ${l.name}`} className="-my-2 -mr-2 inline-flex size-11 flex-none items-center justify-center rounded-control text-muted hover:bg-raised hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><X size={16} aria-hidden /></button>}
      </span>
    </li>
  );
}

const Group = ({ title, children }: { title: string; children: ReactNode }) => (
  <>
    <li className="border-b border-rule bg-raised px-4 py-1.5 text-[12px] font-medium uppercase tracking-wide text-muted max-[640px]:px-3" aria-hidden>{title}</li>
    {children}
  </>
);

/** Add a last-minute line: a service (catalogue or custom) or a part from Inventory, with qty and price. Marked "Added at billing" once added. */
export interface AddLineProps {
  onAdd: (l: { service?: BillService; part?: BillPart }) => void; onCancel: () => void;
  /** The shop's price list (active services); empty means only custom services. */
  catalogue?: BillCatalogueItem[];
  /** The host's Inventory query for the part picker, and how Inventory is answering. Without `search` the picker shows the sample products. */
  partSearch?: PartSearch; partsStatus?: PartsStatus;
}
export function AddLine({ onAdd, onCancel, catalogue = [], partSearch, partsStatus }: AddLineProps) {
  const [kind, setKind] = useState<'service' | 'part'>('service');
  const [typeId, setTypeId] = useState('custom');
  const [name, setName] = useState('');
  const [product, setProduct] = useState<BillProduct | null>(null);
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [tried, setTried] = useState(false);
  const n = Number(qty); const pr = Number(price);
  const errs = {
    name: kind === 'service' && !name.trim() ? 'Give the line a name.' : null,
    part: kind === 'part' && !product ? 'Pick a part.' : null,
    qty: !Number.isInteger(n) || n < 1 ? 'Whole number, 1 or more.' : null,
    price: price.trim() === '' || !Number.isFinite(pr) || pr < 0 ? 'Enter a price (0 for no charge).' : null,
  };
  const bad = Object.values(errs).some(Boolean);
  const submit = () => {
    setTried(true);
    if (bad) return;
    if (kind === 'service') onAdd({ service: { name: name.trim(), price: pr, qty: n, done: true, billing: true, typeId: typeId === 'custom' ? null : typeId, custom: typeId === 'custom', listPrice: typeId === 'custom' ? undefined : catalogue.find((t) => t.id === typeId)?.price } });
    else onAdd({ part: { productId: product!.id, name: product!.name, sku: product!.sku, unit: product!.unit, qty: n, issued: n, listPrice: product!.price, billing: true, price: pr !== product!.price ? pr : undefined } });
  };
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} aria-label="Add a line at billing" className="border-t border-rule bg-raised px-4 py-4 max-[640px]:px-3">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <SegmentedControl size="md" aria-label="Line type" value={kind} onChange={(v) => { setKind(v as 'service' | 'part'); setTried(false); }} options={[{ value: 'service', label: 'Service' }, { value: 'part', label: 'Part' }]} />
        <p className="text-[13px] text-muted">For work or parts that differ from the quote. The line is marked "Added at billing".</p>
      </div>
      {kind === 'service' ? (
        <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
          <div>
            <span id="al-type" className="mb-1 block text-ui font-medium">From the price list</span>
            <Select
              aria-labelledby="al-type" value={typeId}
              onValueChange={(v) => { setTypeId(v); const t = catalogue.find((x) => x.id === v); if (t) { setName(t.name); setPrice(String(t.price)); } }}
              options={[{ value: 'custom', label: 'Custom service (type a name)' }, ...catalogue.map((t) => ({ value: t.id, label: `${t.name} · ${fmt(t.price)}` }))]}
            />
          </div>
          <TextField size="large" label="Service name" value={name} onChange={(e) => setName(e.target.value)} error={tried ? errs.name ?? undefined : undefined} />
        </div>
      ) : (
        <div>
          {product ? (
            <p className="mb-2 flex flex-wrap items-center gap-x-3 text-[14px]"><span className="font-medium">{product.name}</span><span className="font-mono text-[12px] text-muted">{product.sku}</span><button type="button" onClick={() => { setProduct(null); setPrice(''); }} className="min-h-8 text-[13px] font-semibold text-accent underline">Change</button></p>
          ) : (
            <PartPicker label="Part from Inventory" search={partSearch} status={partsStatus} onPick={(id, p) => { setProduct({ id, name: p.name, sku: p.sku, unit: p.unit, price: p.price }); setPrice(String(p.price)); }} />
          )}
          {tried && errs.part && <p className="text-[13px] text-bad">{errs.part}</p>}
        </div>
      )}
      <div className="mt-3 grid grid-cols-[96px_minmax(0,200px)] gap-3 max-[640px]:grid-cols-2">
        <TextField size="large" label="Qty" type="number" inputMode="numeric" min={1} value={qty} onChange={(e) => setQty(e.target.value)} error={tried ? errs.qty ?? undefined : undefined} />
        <MoneyField size="large" label="Unit price" type="number" inputMode="decimal" min={0} unit="PHP" value={price} onChange={(e) => setPrice(e.target.value)} error={tried ? errs.price ?? undefined : undefined} hint={product && Number(price) !== product.price && price ? `Inventory price ${fmt(product.price)}` : undefined} />
      </div>
      <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" variant="primary">Add to the statement</Button></div>
    </form>
  );
}

export interface PaymentStatementProps {
  /** The job's lines, discount and numbers (structural: an API job whose parts carry the product fits). */
  job: BillJob;
  /** Customer, car and mechanic under the title. */
  header: StatementHeader;
  title: string; editable: boolean;
  /** Add-line form data: the shop's price list and the host's part search (see AddLine). */
  catalogue?: BillCatalogueItem[]; partSearch?: PartSearch; partsStatus?: PartsStatus;
  onAdd: (l: { service?: BillService; part?: BillPart }) => void;
  onRemove: (kind: 'service' | 'part', index: number) => void;
  discountSlot?: ReactNode;
  /** The Discount row's action ("Add discount" / "Change"): omitted for a role that cannot discount. */
  discountAction?: ReactNode;
  addOpen: boolean; onAddOpen: (o: boolean) => void;
}

/**
 * PaymentStatement (data-driven, RDY-649; studio samples come from sms/paymentModel): the statement of account as one card. Header (job, customer, car), a ruled table
 * (Description | Qty | Unit | Amount) with "Add line" directly under the last row in the Description column, then Subtotal, Discount and Total
 * right-aligned in the Amount column. The discount editor opens under the totals. The balance and the payment form are NOT here: they live in the Balance panel.
 */
export function PaymentStatement({ job, header, title, editable, catalogue, partSearch, partsStatus, onAdd, onRemove, discountSlot, discountAction, addOpen, onAddOpen }: PaymentStatementProps) {
  const st = statementOf(job);
  const none = st.services.length + st.parts.length === 0;
  const off = billDiscount(job);
  const labelCls = 'col-span-3 text-right max-[640px]:col-span-1 max-[640px]:text-left';
  return (
    <section aria-label={title} className="rounded-card border border-rule bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 px-4 py-3 max-[640px]:px-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <p className="mt-0.5 text-[13px] text-muted">{header.customer} · {header.car} · <span className="font-mono">{header.plate}</span>{header.mechanicShort ? ` · ${header.mechanicShort}` : ''}</p>
        </div>
        <p className="font-mono text-[13px] text-muted">{job.number}{job.quoteNo ? ` · from ${job.quoteNo}` : ''}</p>
      </header>
      {none ? (
        <div className="border-t border-rule py-6"><EmptyState title="Nothing to bill yet" description="This service has no lines. Add the work that was done, or go back and finish the service first." action={editable ? <Button variant="primary" leftIcon={Plus} onClick={() => onAddOpen(true)}>Add line</Button> : undefined} /></div>
      ) : (
        <>
          <div className={cn(GRID, 'border-y border-control px-4 py-2 text-[12px] text-muted max-[640px]:hidden')} aria-hidden><span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit</span><span className="text-right">Amount</span></div>
          <ul aria-label="Lines">
            {st.services.length > 0 && <Group title="Services, labour price">{st.services.map((l) => <Row key={l.key} l={l} canRemove={editable} onRemove={() => onRemove('service', l.index)} />)}</Group>}
            {st.parts.length > 0 && <Group title="Parts, unit price">{st.parts.map((l) => <Row key={l.key} l={l} canRemove={editable} onRemove={() => onRemove('part', l.index)} />)}</Group>}
          </ul>
          {editable && !addOpen && (
            <div className="border-b border-rule px-4 py-1 max-[640px]:px-3" data-testid="add-line-row"><Button variant="text" leftIcon={Plus} onClick={() => onAddOpen(true)} className="-ml-2">Add line</Button></div>
          )}
        </>
      )}
      {addOpen && <AddLine catalogue={catalogue} partSearch={partSearch} partsStatus={partsStatus} onAdd={(l) => { onAdd(l); onAddOpen(false); }} onCancel={() => onAddOpen(false)} />}
      <dl className="py-1 text-[14px]">
        <div className={cn(GRID, 'px-4 py-1.5 max-[640px]:px-3')}><dt className={cn(labelCls, 'text-muted')}>Subtotal</dt><dd className="text-right tabular-nums">{fmt(billSubtotal(job))}</dd></div>
        {(off > 0 || discountAction) && (
          <div className={cn(GRID, 'px-4 py-1.5 max-[640px]:px-3')}>
            <dt className={cn(labelCls, 'flex flex-wrap items-baseline justify-end gap-x-3 text-muted max-[640px]:justify-start')}>
              <span>Discount{job.discount && <span className="ml-2 text-[13px]">{discountWord(job.discount)}{job.discount.reason ? `, ${job.discount.reason}` : ''}</span>}</span>
              {discountAction}
            </dt>
            <dd className="text-right tabular-nums">{off > 0 ? `−${fmt(off)}` : ''}</dd>
          </div>
        )}
        <div className={cn(GRID, 'mt-1 border-t border-control px-4 py-3 max-[640px]:px-3')}><dt className={cn(labelCls, 'text-[15px] font-semibold')}>Total</dt><dd className="text-right text-[18px] font-semibold tabular-nums" data-testid="statement-total">{fmt(billTotal(job))}</dd></div>
      </dl>
      {discountSlot}
    </section>
  );
}
