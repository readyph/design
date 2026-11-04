import { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from './Button';
import { Textarea, TextField } from './TextField';
import { cn } from '../utils/cn';
import { peso, type Product } from './sms/data';
import type { QuoteState } from './sms/mechModel';
import { DECLINE_REASONS, pesos } from './sms/requestsModel';
import { Modal } from './Modal';
import { shortName } from './today/model';
import { PartPicker, type PartSearch, type PartsStatus } from './PartPicker';

/** Decline a part request: a reason is required (one of five, Other needs words), the note is optional. */
export function DeclineModal({ open, partName, onClose, onConfirm }: { open: boolean; partName: string; onClose: () => void; onConfirm: (reason: string, note: string) => void }) {
  const [reason, setReason] = useState(''); const [note, setNote] = useState('');
  const ok = !!reason && (reason !== 'Other' || !!note.trim());
  return (
    <Modal
      open={open} onOpenChange={(o) => { if (!o) onClose(); }} size="md" title="Decline part request" description={`${partName}. The mechanic sees your reason.`}
      footer={<><Button variant="secondary" onClick={onClose}>Keep request</Button><Button variant="danger" disabled={!ok} onClick={() => onConfirm(reason, note)}>Decline request</Button></>}
    >
      <fieldset className="mb-4 min-w-0">
        <legend className="mb-2 text-[13px] font-semibold">Reason (required)</legend>
        <div className="flex flex-col gap-1">
          {DECLINE_REASONS.map((r) => (
            <label key={r} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-2 text-[14px] hover:bg-raised">
              <input type="radio" name="decline-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="size-4 accent-accent" />{r}
            </label>
          ))}
        </div>
      </fieldset>
      <Textarea label={reason === 'Other' ? 'Note (required for Other)' : 'Note (optional)'} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="For example, use the one on the shelf for JO-0408." />
    </Modal>
  );
}

/** Dismiss a found problem: the reason is optional. */
export function DismissModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <Modal
      open={open} onOpenChange={(o) => { if (!o) onClose(); }} size="md" title="Dismiss this problem" description="No extra work is quoted. The mechanic is told."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => onConfirm(reason)}>Dismiss problem</Button></>}
    >
      <Textarea label="Reason (optional)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example, the customer already knows." />
    </Modal>
  );
}

/** Quote extra work found by a mechanic: what, how much, optional Inventory parts. Sending puts it to the customer for approval. */
/** Parts come from the host's Inventory: pass `search` / `status` (see PartPicker); without them the picker uses the WizardDataProvider products. Prices come from the picked product. */
export function QuoteModal({ open, problem, customerAfter, onClose, onSend, search, status }: { open: boolean; problem: string; customerAfter: QuoteState['customer']; onClose: () => void; onSend: (q: QuoteState) => void; search?: PartSearch; status?: PartsStatus }) {
  const [text, setText] = useState(problem); const [labour, setLabour] = useState(''); const [parts, setParts] = useState<{ product: Product; qty: number }[]>([]);
  const partsTotal = parts.reduce((a, p) => a + p.product.price * p.qty, 0);
  const total = (Number(labour) || 0) + partsTotal;
  const ok = total > 0 && !!text.trim();
  return (
    <Modal
      open={open} onOpenChange={(o) => { if (!o) onClose(); }} size="lg" title="Quote extra work" description="Goes to the customer for approval. The mechanic sees the status, never the price."
      footer={<><span className="mr-auto text-[14px] tabular-nums">Quote total <strong className="font-semibold">{peso(total)}</strong></span><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={!ok} onClick={() => onSend({ amount: total, note: text.trim(), customer: customerAfter, parts: parts.map((p) => ({ productId: p.product.id, qty: p.qty })) })}>Send to customer</Button></>}
    >
      <div className="flex flex-col gap-4">
        <Textarea label="What the customer is asked to approve" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <TextField label="Labour" type="number" min={0} inputMode="numeric" unit="₱" value={labour} onChange={(e) => setLabour(e.target.value)} hint="Leave empty if the parts are the whole quote." />
        <div>
          <PartPicker label="Parts from Inventory (optional)" exclude={parts.map((p) => p.product.id)} search={search} status={status} onPick={(_id, product) => setParts((x) => [...x, { product, qty: 1 }])} />
          {parts.length > 0 && (
            <ul aria-label="Parts in this quote" className="mt-1 border-t border-rule">
              {parts.map((p) => (
                <li key={p.product.id} className="flex items-center gap-3 border-b border-rule py-2 text-[14px]">
                  <span className="min-w-0 flex-1 truncate">{shortName(p.product)}</span>
                  <input type="number" min={1} aria-label={`Quantity of ${shortName(p.product)}`} value={p.qty} onChange={(e) => setParts((x) => x.map((y) => (y.product.id === p.product.id ? { ...y, qty: Math.max(1, Number(e.target.value) || 1) } : y)))} className={cn('h-8 w-14 rounded-control border border-control bg-surface px-2 text-right tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent')} />
                  <span className="w-20 text-right tabular-nums">{peso(p.product.price * p.qty)}</span>
                  <button type="button" aria-label={`Remove ${shortName(p.product)}`} onClick={() => setParts((x) => x.filter((y) => y.product.id !== p.product.id))} className="grid size-8 place-items-center rounded-control text-muted hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><X size={16} aria-hidden /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
export { pesos };
