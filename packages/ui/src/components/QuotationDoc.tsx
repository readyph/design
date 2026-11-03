import { Fragment } from 'react';
import { Printer } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Button } from './Button';
import { Modal } from './Modal';
import { peso } from './sms/data';
import { longDay } from './sms/scheduleModel';
import type { QuoteDoc } from './sms/wizardModel';

/**
 * QuotationDoc: the printable quotation. Shop, number and dates, customer and car, a ruled price table, total, remarks and a validity line.
 * Plain ruled paper in the page's own tokens (it prints in black on white through the print stylesheet of the real product).
 */
export function QuotationDoc({ doc, className }: { doc: QuoteDoc; className?: string }) {
  return (
    <article aria-label={`Quotation ${doc.number}`} className={cn('rounded-card border border-rule bg-surface p-8 text-text max-[640px]:p-4', className)}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-control pb-4">
        <div>
          <p className="text-[16px] font-semibold">{doc.shop.business}</p>
          <p className="text-[13px] text-muted">{doc.shop.branch} · {doc.shop.address}</p>
          <p className="text-[13px] text-muted tabular-nums">{doc.shop.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted">Quotation</p>
          <p className="font-mono text-[18px] font-semibold">{doc.number}</p>
          <p className="text-[13px] text-muted">Issued {longDay(doc.issued)}</p>
          <p className="text-[13px] font-medium">Valid until {longDay(doc.validUntil)}</p>
        </div>
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 py-4 text-[13px] max-[640px]:grid-cols-1">
        <div><dt className="text-muted">Prepared for</dt><dd className="font-medium">{doc.customer}</dd><dd className="tabular-nums text-muted">{doc.phone}</dd></div>
        <div><dt className="text-muted">Vehicle</dt><dd className="font-medium">{doc.car}</dd><dd className="font-mono text-muted">{doc.plate}</dd></div>
      </dl>
      <table className="w-full border-collapse text-[13px]">
        <caption className="sr-only">Services and prices</caption>
        <thead><tr className="border-y border-control text-left text-[12px] text-muted"><th className="py-2 pr-2 font-medium">Service</th><th className="w-12 py-2 text-right font-medium">Qty</th><th className="w-24 py-2 text-right font-medium">Price</th><th className="w-28 py-2 text-right font-medium">Amount</th></tr></thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <Fragment key={`${l.name}-${i}`}>
            {l.part && !doc.lines[i - 1]?.part && <tr aria-hidden><td colSpan={4} className="pl-4 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted">Parts</td></tr>}
            <tr className="border-b border-rule align-top">
              <td className={cn('py-2 pr-2', l.part && 'pl-4 text-[12px] text-muted')}>{l.name}</td><td className="py-2 text-right tabular-nums">{l.qty}</td><td className="py-2 text-right tabular-nums">{peso(l.price)}<span className="block text-[11px] text-muted">{l.part ? 'Unit price' : 'Labour'}</span></td><td className="py-2 text-right tabular-nums">{peso(l.price * l.qty)}</td>
            </tr>
            </Fragment>
          ))}
        </tbody>
        <tfoot><tr><td colSpan={3} className="pt-3 text-right font-semibold">Total</td><td className="pt-3 text-right text-[16px] font-semibold tabular-nums">{peso(doc.total)}</td></tr></tfoot>
      </table>
      {doc.remarks && <section className="mt-5"><h3 className="text-[12px] font-medium uppercase tracking-wide text-muted">Remarks</h3><p className="mt-1 whitespace-pre-wrap text-[13px]">{doc.remarks}</p></section>}
      <p className="mt-6 border-t border-rule pt-3 text-[12px] text-muted">Prices are in Philippine pesos and include labour. Parts are priced at today&rsquo;s stock price. This quotation holds until {longDay(doc.validUntil)}. Prepared by {doc.shop.preparedBy}.</p>
    </article>
  );
}

export const PrintButton = ({ onPrint }: { onPrint?: () => void }) => (
  <Button variant="secondary" leftIcon={Printer} onClick={onPrint ?? (() => window.print())}>Print</Button>
);

export interface QuotationModalProps {
  doc: QuoteDoc;
  /** Parked quotation: the three actions. A booked job (quotation kept for reference) only gets Print. */
  actions?: { onBook: () => void; onEdit: () => void } | null;
  /** Shown when the quotation was already used. */
  note?: string;
  onClose: () => void;
}

/** Opens a quotation from the Inspector, a list row or a customer's history: the document, then Print, Edit quote and "Customer agreed - Book it". */
export function QuotationModal({ doc, actions, note, onClose }: QuotationModalProps) {
  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="panel" aria-label={`Quotation ${doc.number}`}>
      <Modal.Header description={note ?? (actions ? 'Waiting for the customer. Valid until ' + longDay(doc.validUntil) + '.' : undefined)}>Quotation {doc.number}</Modal.Header>
      <Modal.Body className="bg-raised"><QuotationDoc doc={doc} /></Modal.Body>
      <Modal.Footer>
        <PrintButton />
        {actions && <Button variant="secondary" onClick={actions.onEdit}>Edit quote</Button>}
        {actions && <Button variant="primary" onClick={actions.onBook}>Customer agreed - Book it</Button>}
        {!actions && <Button variant="secondary" onClick={onClose}>Close</Button>}
      </Modal.Footer>
    </Modal>
  );
}
