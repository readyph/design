import { useMemo, useState } from 'react';
import { Barcode, CheckCircle, Package } from '@phosphor-icons/react';
import { BarcodeSheet, type BarcodeProduct } from './BarcodeSheet';
import { Button } from './Button';
import { QuantityStepper } from './QuantityStepper';
import { cn } from '../utils/cn';
import { onHandHere, products, productOf, type Job } from './sms/data';
import { plateOf, carOf, requestWord, shortName, stockWord, suggestedParts, type PartRequest } from './sms/mechModel';
import { Combobox, type ComboOption } from './Combobox';
import { CheckMark, MechSection } from './MechFrame';
import { NotifyItem } from './NotifyItem';

const bcProducts: BarcodeProduct[] = products.map((p, i) => ({ id: p.id, name: p.name, sku: p.sku, barcode: `48061${String(1000 + i * 37).padStart(7, '0')}`, unit: p.unit, onHand: onHandHere(p), location: 'Stockroom' }));
const stockShort = (productId: string) => { const w = stockWord(productOf(productId)).word; return w.startsWith('In stock') ? 'in stock' : w.startsWith('Low') ? 'low stock' : w.includes('on order') ? 'on order' : 'out of stock'; };

/** A radio row in the right panel's row look (NotifyItem anatomy: rounded inset row, hover `bg-raised`, selected `bg-raised`), 18px ring marker. */
function Radio({ on, children, onClick, label }: { on: boolean; children: React.ReactNode; onClick: () => void; label?: string }) {
  return (
    <button type="button" role="radio" aria-checked={on} aria-label={label} onClick={onClick} className={cn('flex min-h-11 w-full items-center gap-3 rounded-control px-3 py-2 text-left transition-colors hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent', on && 'bg-raised')}>
      <CheckMark on={on} />
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

/** Need a part, on one screen, three steps: which car (only from the Parts tab), which part (suggested rows, or search / scan), how many. "Send to manager" is the bar's one button. */
export function MechRequestForm({ jobs, jobId, setJobId, askCar, productId, setProductId, qty, setQty, scanOpen, setScanOpen }: {
  jobs: Job[]; jobId: string | null; setJobId: (id: string | null) => void; askCar: boolean; productId: string | null; setProductId: (id: string | null) => void;
  qty: number; setQty: (n: number) => void; scanOpen: boolean; setScanOpen: (o: boolean) => void;
}) {
  const [q, setQ] = useState('');
  const job = jobs.find((j) => j.id === jobId);
  const sugg = suggestedParts(job);
  const rows = productId && !sugg.some((x) => x.productId === productId) ? [{ productId, qty: 1 }, ...sugg] : sugg;
  const choose = (id: string) => { setProductId(id); const sg = sugg.find((x) => x.productId === id); setQty(sg ? Math.max(1, sg.qty) : 1); };
  const options: ComboOption[] = useMemo(() => products.filter((p) => !q.trim() || `${p.name} ${p.sku}`.toLowerCase().includes(q.trim().toLowerCase())).map((p) => ({
    id: p.id, label: `${p.name}, ${stockShort(p.id)}`,
    node: <span className="flex min-w-0 flex-1 items-center gap-3 py-1"><span className="min-w-0 flex-1 truncate">{p.name}</span><span className="flex-none text-[13px] text-muted">{stockShort(p.id)}</span></span>,
  })), [q]);
  let n = 0;
  return (
    <>
      {askCar && (
        <MechSection title={`${++n}. Which car?`}>
          <div role="radiogroup" aria-label="Which car" className="grid gap-1">
            {jobs.map((j) => <Radio key={j.id} on={jobId === j.id} onClick={() => { setJobId(j.id); setProductId(null); }}><span className="block text-[14px]"><span className="font-mono font-semibold">{plateOf(j)}</span> <span className="text-muted">{carOf(j).replace(/ \d{4}$/, '')}</span></span></Radio>)}
            <Radio on={jobId === null} onClick={() => { setJobId(null); setProductId(null); }}><span className="text-[14px]">Not for a car (shop use)</span></Radio>
          </div>
        </MechSection>
      )}
      <MechSection title={`${++n}. Which part?`}>
        <div>
        {rows.length > 0 && (
          <>
            <p className="px-3 text-[13px] text-muted">Usually needed for this service</p>
            <div role="radiogroup" aria-label="Usually needed for this service" className="mt-1 grid gap-1">
              {rows.map((r) => { const pr = productOf(r.productId); return (
                <Radio key={r.productId} on={productId === r.productId} onClick={() => choose(r.productId)} label={pr.name}>
                  <span className="block break-words text-[14px] font-medium leading-5">{shortName(pr)}</span>
                  <span className="block text-[13px] text-muted">{stockShort(r.productId)}</span>
                </Radio>
              ); })}
            </div>
          </>
        )}
        <div className="grid gap-3 px-3 pt-4">
          <Combobox label="Or search for a part" value={q} onValueChange={setQ} options={options} onSelect={(id) => { choose(id); setQ(''); }} placeholder="For example, oil filter" search minChars={0} emptyText="Nothing found. Ask your manager." />
          <Button variant="secondary" leftIcon={Barcode} fullWidth onClick={() => setScanOpen(true)}>Scan barcode</Button>
        </div>
        </div>
      </MechSection>
      <MechSection title={`${++n}. How many?`}>
        <div className="px-3"><QuantityStepper value={qty} onValueChange={setQty} min={1} max={20} productName={productId ? productOf(productId).name : 'part'} /></div>
      </MechSection>
      <BarcodeSheet open={scanOpen} onOpenChange={setScanOpen} title="Scan the part" ctx="ask" products={bcProducts} samples={bcProducts.slice(0, 3)} manager="your manager" onFound={(p) => { choose(p.id); setScanOpen(false); }} unknown={null} />
    </>
  );
}

/** After Send: one clear state, one button. */
export function MechRequestSent({ onDone, onAnother, doneLabel }: { onDone: () => void; onAnother: () => void; doneLabel: string }) {
  return (
    <div className="grid justify-items-center gap-3 pt-10 text-center">
      <CheckCircle size={48} weight="fill" aria-hidden className="text-accent" />
      <h2 className="text-[15px] font-semibold leading-6">Sent</h2>
      <p className="max-w-[20rem] text-[14px] leading-6">Your manager will say when it is ready.</p>
      <Button variant="primary" fullWidth className="mt-4" onClick={onDone}>{doneLabel}</Button>
      <Button variant="secondary" fullWidth onClick={onAnother}>Ask for another part</Button>
    </div>
  );
}

/** One request, its state in words: Asked, Approved, Ready - pick it up at the stockroom. */
export function MechRequestRow({ r, jobs }: { r: PartRequest; jobs: Job[] }) {
  const pr = productOf(r.productId);
  const j = jobs.find((x) => x.id === r.jobId);
  const ready = r.status === 'Ready at stockroom';
  return (
    <NotifyItem
      marker={<Package size={20} />} markerTone={ready ? 'ok' : 'muted'} title={`${shortName(pr)} x${r.qty}`}
      detail={j ? `${plateOf(j)} ${carOf(j).replace(/ \d{4}$/, '')}` : 'Shop use'} tag={requestWord(r.status)} tagTone={ready ? 'ok' : 'neutral'}
    />
  );
}
