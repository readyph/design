import { cn } from '../utils/cn';
import { dayWord } from './sms/floorModel';
import { PAY_WORD, fmt, methodLabel, type ReceiptData } from './sms/paymentModel';

export type ReceiptPaper = 'a4' | 'slip';
type Paper = ReceiptPaper;

/**
 * ReceiptDoc: the printable receipt / statement of account. Shop, customer and car, every line, discount, total, payments and balance.
 * `a4` is the full page (A4 or Letter); `slip` is the narrow 80 mm till slip. Plain ruled paper in the page's tokens.
 */
export function ReceiptDoc({ doc, paper, className }: { doc: ReceiptData; paper: Paper; className?: string }) {
  const slip = paper === 'slip';
  return (
    <article aria-label={`Receipt ${doc.number}`} className={cn('mx-auto rounded-card border border-rule bg-surface text-text', slip ? 'w-[300px] max-w-full p-4 font-mono text-[12px]' : 'p-8 text-[13px] max-[640px]:p-4', className)}>
      <header className={cn('border-b border-control pb-3', slip ? 'text-center' : 'flex flex-wrap items-start justify-between gap-4')}>
        <div>
          <p className={cn('font-semibold', slip ? 'text-[14px]' : 'text-[16px]')}>{doc.shop.business}</p>
          <p className="text-muted">{doc.shop.branch} · {doc.shop.address}</p>
          <p className="tabular-nums text-muted">{doc.shop.phone}</p>
        </div>
        <div className={slip ? 'mt-2' : 'text-right'}>
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted">{doc.state === 'paid' ? 'Receipt' : 'Statement of account'}</p>
          <p className="font-mono text-[16px] font-semibold">{doc.number}</p>
          {doc.quoteNo && <p className="text-muted">From quotation {doc.quoteNo}</p>}
        </div>
      </header>
      <dl className={cn('grid gap-x-6 gap-y-2 py-3', slip ? 'grid-cols-1' : 'grid-cols-2 max-[640px]:grid-cols-1')}>
        <div><dt className="text-muted">Customer</dt><dd className="font-medium">{doc.customer}</dd><dd className="tabular-nums text-muted">{doc.phone}</dd></div>
        <div><dt className="text-muted">Vehicle</dt><dd className="font-medium">{doc.car}</dd><dd className="font-mono text-muted">{doc.plate}</dd></div>
      </dl>
      <table className="w-full border-collapse">
        <caption className="sr-only">Services and parts</caption>
        <thead><tr className="border-y border-control text-left text-[12px] text-muted"><th className="py-1.5 pr-2 font-medium">Item</th><th className="w-10 py-1.5 text-right font-medium">Qty</th>{!slip && <th className="w-24 py-1.5 text-right font-medium">Price</th>}<th className="w-24 py-1.5 text-right font-medium">Amount</th></tr></thead>
        <tbody>
          {doc.lines.map((l, i) => (
            <tr key={`${l.name}-${i}`} className="border-b border-rule align-top">
              <td className="py-1.5 pr-2">{l.name}{l.part && <span className="ml-1.5 text-muted">(part)</span>}{l.billing && <span className="ml-1.5 text-muted">(added)</span>}</td>
              <td className="py-1.5 text-right tabular-nums">{l.qty}</td>{!slip && <td className="py-1.5 text-right tabular-nums">{fmt(l.unit)}</td>}<td className="py-1.5 text-right tabular-nums">{fmt(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-3 ml-auto max-w-[280px] space-y-1">
        <div className="flex justify-between gap-3"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{fmt(doc.subtotal)}</dd></div>
        {doc.discount > 0 && <div className="flex justify-between gap-3"><dt className="text-muted">Discount{doc.discountNote ? ` (${doc.discountNote})` : ''}</dt><dd className="tabular-nums">−{fmt(doc.discount)}</dd></div>}
        <div className="flex justify-between gap-3 border-t border-control pt-1.5 text-[15px] font-semibold"><dt>Total</dt><dd className="tabular-nums">{fmt(doc.total)}</dd></div>
      </dl>
      <section className="mt-4" aria-label="Payments">
        <h3 className="text-[12px] font-medium uppercase tracking-wide text-muted">Payments</h3>
        {doc.payments.length === 0 ? <p className="mt-1 text-muted">No payment yet.</p> : (
          <ul className="mt-1 divide-y divide-rule border-y border-rule">
            {doc.payments.map((p, i) => <li key={i} className="flex justify-between gap-3 py-1.5"><span>{dayWord(p.at)} · {methodLabel(p.method)}{p.ref ? ` · ${p.ref}` : ''}{p.by ? ` · ${p.by}` : ''}{p.remarks && <span className="block text-[12px] text-muted">Remarks: {p.remarks}</span>}</span><span className="tabular-nums">{fmt(p.amount)}</span></li>)}
          </ul>
        )}
        <dl className="mt-2 ml-auto max-w-[280px] space-y-1">
          <div className="flex justify-between gap-3"><dt className="text-muted">Paid</dt><dd className="tabular-nums">{fmt(doc.paid)}</dd></div>
          <div className="flex justify-between gap-3 text-[15px] font-semibold"><dt>Balance</dt><dd className="tabular-nums">{fmt(Math.max(0, doc.balance))}</dd></div>
        </dl>
        <p className="mt-2 text-right font-medium">{PAY_WORD[doc.state]}</p>
      </section>
      <p className="mt-5 border-t border-rule pt-2 text-[12px] text-muted">Amounts are in Philippine pesos. This is an acknowledgement of payment, not an official receipt. Thank you for choosing {doc.shop.business}.</p>
    </article>
  );
}
