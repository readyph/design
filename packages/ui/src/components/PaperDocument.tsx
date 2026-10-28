import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { cn, focusForced } from '../utils/cn';

/*
 * RDY-393 I9. Transcribed from inventory-home round-1/final: order-list.css 29-51 (.paper .pp-top .pp-co .pp-ti .pp-meta .pp-parties .pp-p .pp-empty),
 * 54-73 (.pp-lines), 76-103 (.qedit .qfixed .qunit .rmb), 93-106 (.pp-tot .pp-notes .ppnote), 85 (.pp-sign .pp-foot hidden on screen),
 * 153-170 (container sheet 1100 / 900), 175-199 (phone), 226-268 (@media print); order-list.js 99-119 (paperHTML, lineRow, totalsHTML);
 * movements.css 106-118 (.tpaper .c-got .blank .tr-sign), 244-245, 262-273 (phone transfer block), 277-287 (print); movements.js 297-307.
 * The @page rule (order-list.css 228) is in the generated globals.css.
 */

export type PaperKind = 'order' | 'transfer';

export interface PaperMeta {
  label: string;
  value: ReactNode;
  /** `screen`: not printed (Status). `print`: only on the printed paper (Items on a transfer, Prepared by on a sent PO). */
  only?: 'screen' | 'print';
}

export interface PaperParty {
  /** "Supplier", "Deliver to", "From", "To". */
  heading: string;
  /** Bold first line. */
  name: string;
  /** Lines under the name (contact, phone, email, address, receiving hours). */
  lines?: string[];
  /** "Terms: ..." line, with a 4px gap above. */
  terms?: string;
}

export interface PaperLine {
  id: string;
  /** Product code (monospace). */
  code: string;
  product: string;
  /** Small grey line under the product (on-hand and status). Editable order lists only. */
  sub?: ReactNode;
  quantity: number;
  /** Unit under the quantity on screen, and in its own column on paper: "pc", "set", "bottles". */
  unit: string;
  /** Editable quantity (QuantityStepper). The plain number is printed instead. Omit for read-only. */
  editor?: ReactNode;
  /** Received so far (`rec`); shown when `PaperDocumentProps.showReceived`. */
  received?: number;
  /** Manager only: already formatted ("₱1,200.00"). */
  cost?: string;
  amount?: string;
  /** Transfer paper: the counted quantity after arrival. Omit for the blank line. */
  counted?: number;
}

export interface PaperTotals {
  /** Number of products. */
  products: number;
  /** "121 pc · 8 sets · 35 bottles". */
  quantity: string;
  /** Manager only: already formatted. */
  total?: string;
}

export interface PaperNote {
  /** "Notes to the supplier" or "Note". */
  label: string;
  text: string;
  /** When given the note is a textarea on screen (printed as text). Omit for read-only. */
  onChange?: (text: string) => void;
  placeholder?: string;
}

export interface PaperDocumentProps {
  /** `order`: order list or purchase order. `transfer`: stock transfer. */
  kind?: PaperKind;
  /** Accessible name of the article: "Order list for Autopro". */
  label: string;
  /** Platform logo, 28px (PlatformLogo). */
  logo?: ReactNode;
  company: string;
  /** "Autoworks · Quezon City" second line under the company. */
  companyLine: string;
  /** "Purchase order", "Stock transfer". */
  title: string;
  /** PO or transfer number. */
  number: string;
  meta: PaperMeta[];
  parties: PaperParty[];
  lines: PaperLine[];
  /** Heading of the quantity column: "Quantity", "Ordered", "Sent". */
  quantityLabel?: string;
  /** Editable list: adds the Remove column. */
  onRemove?: (line: PaperLine) => void;
  /** Column "In" (units received) on a part-received PO. */
  showReceived?: boolean;
  /** Manager only: Unit cost and Amount columns. */
  showPrices?: boolean;
  /** Transfer: the "Counted on arrival" column. */
  countedLabel?: string;
  totals?: PaperTotals;
  note?: PaperNote;
  /** Signature lines on the printed paper. */
  signatures: string[];
  /** Last line on the printed paper: "Autoworks · PO-0224 · printed 22 Oct, 9:12 AM". */
  footer: string;
  /** Shown instead of the table when there are no lines. */
  empty?: string;
  /** On screen only: the add-product search under the paper (not printed). */
  children?: ReactNode;
  className?: string;
}

const noteField =
  'min-h-[64px] w-full resize-y rounded-control border border-control bg-surface px-[10px] py-2 text-[14px] leading-5 text-text placeholder:text-muted placeholder:opacity-100 hover:border-muted ' +
  'focus-visible:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[1px] focus-visible:outline-accent ' +
  focusForced;

/** Print label: 8.5pt, uppercase, .04em, #333 (order-list.css 241, 258, 262). */
const printLabel = 'print:text-[8.5pt] print:uppercase print:tracking-[.04em] print:text-[#333]';

export function PaperDocument({
  kind = 'order',
  label,
  logo,
  company,
  companyLine,
  title,
  number,
  meta,
  parties,
  lines,
  quantityLabel = 'Quantity',
  onRemove,
  showReceived,
  showPrices,
  countedLabel,
  totals,
  note,
  signatures,
  footer,
  empty,
  children,
  className,
}: PaperDocumentProps) {
  const transfer = kind === 'transfer';
  const editable = !!onRemove;

  /* Column classes. th and td share width and alignment (order-list.css 59-69, movements.css 106-116). */
  const col = {
    code: 'w-[88px] whitespace-nowrap @max-[900px]/sheet:w-24 max-[640px]:!w-auto',
    qty: cn(
      transfer ? 'w-[88px] text-right' : 'w-[112px] @max-[900px]/sheet:w-[104px]',
      'print:w-[60pt] print:text-right',
    ),
    unit: 'hidden w-[52px] text-muted print:table-cell print:w-[44pt] print:text-[#111] max-[640px]:!hidden',
    rec: 'w-12 text-right',
    cost: 'w-[84px] text-right',
    amt: 'w-24 text-right font-medium',
    rm: 'w-11 text-right print:hidden',
    got: 'w-[148px] text-right print:w-[120pt]',
  };
  const th =
    'border-0 border-b border-border px-2 pb-2 pt-3 text-left align-baseline text-[12px] font-medium whitespace-nowrap text-muted first:pl-0 last:pr-0 ' +
    'print:border-b-[1pt] print:border-[#111] print:px-[6pt] print:pb-[5pt] print:pt-[6pt] print:text-[8.5pt] print:uppercase print:tracking-[.03em] print:text-[#333]';
  const td =
    'border-0 border-t border-rule px-2 py-3 align-top first:pl-0 last:pr-0 ' +
    'print:border-t-[0.5pt] print:px-[6pt] print:py-[7pt] ' +
    'max-[640px]:block max-[640px]:max-w-none max-[640px]:!w-auto max-[640px]:border-0 max-[640px]:p-0';

  return (
    <article
      aria-label={label}
      data-surface="surface"
      className={cn(
        'relative min-w-0 border border-border bg-surface px-9 pb-7 pt-8 text-[14px] leading-5 text-text',
        transfer ? 'max-w-[880px]' : 'max-w-[860px] @max-[1100px]/sheet:max-w-none',
        '@max-[900px]/sheet:px-7 max-[640px]:px-4 max-[640px]:pb-5 max-[640px]:pt-5',
        /* order-list.css 230: print token overrides. */
        'print:max-w-none print:border-0 print:p-0 print:text-[10.5pt] print:leading-[1.4] print:text-[#111] print:[--border:#999] print:[--control:#777] print:[--frame:#fff] print:[--muted:#4a4f57] print:[--raised:#fff] print:[--rule:#bbb] print:[--skeleton:#ddd] print:[--surface:#fff] print:[--text:#111]',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-6 border-b-2 border-text pb-5 max-[640px]:flex-col max-[640px]:gap-3 print:border-b-[1.5pt] print:pb-[10pt]">
        <div className="flex min-w-0 items-center gap-3">
          {logo}
          <div>
            <b className="block text-[16px] font-semibold leading-[22px] print:text-[13pt]">{company}</b>
            <span className="block text-[12px] text-muted print:text-[9pt] print:text-[#333]">{companyLine}</span>
          </div>
        </div>
        <div className="flex-none text-right max-[640px]:text-left">
          <h2 className="m-0 text-[20px] font-semibold leading-[26px] tracking-[-0.01em] print:text-[17pt] print:uppercase print:tracking-[.04em]">{title}</h2>
          <span className="mt-[2px] block font-mono text-[14px] font-medium tracking-normal print:text-[12pt]">{number}</span>
        </div>
      </header>

      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-6 gap-y-3 border-b border-rule py-4 max-[640px]:grid-cols-[repeat(2,minmax(0,1fr))] print:grid-cols-[repeat(4,minmax(0,1fr))] print:py-[10pt]">
        {meta.map((m) => (
          <div key={m.label} className={cn('min-w-0', m.only === 'screen' && 'print:hidden', m.only === 'print' && 'hidden print:block')}>
            <dt className="text-[12px] text-muted print:text-[8.5pt] print:uppercase print:tracking-[.04em] print:text-[#444]">{m.label}</dt>
            <dd className="m-0 mt-[2px] text-[14px] font-medium print:text-[10.5pt] [&>span]:!h-auto [&>span]:!font-medium">{m.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-10 gap-y-6 border-b border-rule py-5 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-[20px] print:gap-x-[30pt] print:gap-y-[20pt] print:py-[12pt]">
        {parties.map((p) => (
          <div key={p.heading} className="flex min-w-0 flex-col gap-[2px] text-[13px] leading-[19px] text-muted print:text-[10pt] print:text-[#222]">
            <h3 className="m-0 mb-1 text-[12px] font-medium text-muted print:text-[8.5pt] print:uppercase print:tracking-[.04em] print:text-[#444]">{p.heading}</h3>
            <b className="text-[15px] font-semibold text-text print:text-[11.5pt]">{p.name}</b>
            {p.lines?.map((l) => (
              <span key={l} className="[overflow-wrap:anywhere]">
                {l}
              </span>
            ))}
            {p.terms ? <span className="mt-1 [overflow-wrap:anywhere]">{p.terms}</span> : null}
          </div>
        ))}
      </div>

      {lines.length === 0 ? (
        <p className="m-0 py-[32px] text-[14px] text-muted">{empty}</p>
      ) : (
        <>
          <table
            className="mt-2 w-full border-collapse tabular-nums max-[640px]:block [&_tbody>tr:first-child>td]:border-t-0"
          >
            <thead className="max-[640px]:hidden print:table-header-group">
              <tr>
                <th className={cn(th, col.code, 'print:text-[#333]')}>Code</th>
                <th className={cn(th)}>Product</th>
                <th className={cn(th, col.qty, !editable && 'text-right')}>{quantityLabel}</th>
                <th className={cn(th, col.unit)}>Unit</th>
                {showReceived ? <th className={cn(th, col.rec)}>In</th> : null}
                {showPrices ? (
                  <>
                    <th className={cn(th, col.cost)}>Unit cost</th>
                    <th className={cn(th, col.amt, 'font-medium')}>Amount</th>
                  </>
                ) : null}
                {transfer ? <th className={cn(th, col.got)}>{countedLabel ?? 'Counted on arrival'}</th> : null}
                {editable ? (
                  <th className={cn(th, col.rm)}>
                    <span className="absolute h-px w-px overflow-hidden whitespace-nowrap [clip:rect(0_0_0_0)]">Remove</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="max-[640px]:block">
              {lines.map((x) => (
                <tr
                  key={x.id}
                  className={cn(
                    'print:break-inside-avoid max-[640px]:grid max-[640px]:grid-cols-[minmax(0,1fr)_auto] max-[640px]:gap-x-3 max-[640px]:border-t max-[640px]:border-rule max-[640px]:py-[14px] max-[640px]:first:border-t-0 max-[640px]:first:pt-1',
                    transfer
                      ? 'max-[640px]:gap-y-1 max-[640px]:py-3'
                      : 'max-[640px]:gap-y-[6px] max-[640px]:[grid-template-areas:"prod_rm""code_code""qty_amt"]',
                  )}
                >
                  <td className={cn(td, col.code, transfer ? 'max-[640px]:col-start-1 max-[640px]:row-start-2 max-[640px]:text-muted' : 'max-[640px]:[grid-area:code]')}>
                    <span className="font-mono text-[12px] tracking-normal @max-[900px]/sheet:text-[11px] print:text-[9pt]">{x.code}</span>
                  </td>
                  <td
                    className={cn(
                      td,
                      'max-w-0 max-[640px]:max-w-none',
                      transfer ? 'max-[640px]:col-span-full max-[640px]:row-start-1 max-[640px]:text-[15px] max-[640px]:leading-[21px]' : 'max-[640px]:[grid-area:prod]',
                      'print:max-w-none',
                    )}
                  >
                    <span className="block font-medium [overflow-wrap:anywhere]">{x.product}</span>
                    {x.sub ? (
                      <span className="mt-[2px] block overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-[17px] text-muted print:hidden">{x.sub}</span>
                    ) : null}
                  </td>
                  <td
                    className={cn(
                      td,
                      col.qty,
                      transfer
                        ? 'max-[640px]:col-start-2 max-[640px]:row-start-2 max-[640px]:whitespace-nowrap max-[640px]:text-right'
                        : 'max-[640px]:flex max-[640px]:items-center max-[640px]:gap-2 max-[640px]:[grid-area:qty]',
                      !transfer && !editable && 'text-right',
                    )}
                  >
                    {x.editor ? (
                      <>
                        <span className="inline-flex items-center print:hidden">{x.editor}</span>
                        <span className="hidden font-semibold print:inline">{x.quantity}</span>
                      </>
                    ) : (
                      <span className="text-[14px] font-semibold print:text-[10.5pt]">{x.quantity}</span>
                    )}
                    <span className={cn('mt-1 block text-[12px] text-muted print:hidden', transfer && 'max-[640px]:ml-1 max-[640px]:mt-0 max-[640px]:inline')}>{x.unit}</span>
                  </td>
                  <td className={cn(td, col.unit)}>{x.unit}</td>
                  {showReceived ? <td className={cn(td, col.rec, 'max-[640px]:!hidden')}>{x.received ?? 0}</td> : null}
                  {showPrices ? (
                    <>
                      <td className={cn(td, col.cost, 'max-[640px]:!hidden')}>{x.cost}</td>
                      <td className={cn(td, col.amt, 'max-[640px]:self-center max-[640px]:text-right max-[640px]:[grid-area:amt]')}>{x.amount}</td>
                    </>
                  ) : null}
                  {transfer ? (
                    <td
                      className={cn(
                        td,
                        col.got,
                        'max-[640px]:col-span-full max-[640px]:row-start-3 max-[640px]:mt-[6px] max-[640px]:flex max-[640px]:items-baseline max-[640px]:gap-[10px] max-[640px]:text-left',
                        "max-[640px]:before:whitespace-nowrap max-[640px]:before:text-[12px] max-[640px]:before:text-muted max-[640px]:before:content-['Counted_on_arrival']",
                      )}
                    >
                      {x.counted != null ? (
                        <b className="font-semibold">{x.counted}</b>
                      ) : (
                        <span
                          aria-hidden
                          className="inline-block h-[18px] w-24 border-b border-text max-[640px]:w-auto max-[640px]:max-w-[180px] max-[640px]:flex-[1_1_auto] print:w-[90pt] print:border-b-[0.75pt] print:border-[#111]"
                        />
                      )}
                    </td>
                  ) : null}
                  {editable ? (
                    <td className={cn(td, col.rm, 'max-[640px]:[grid-area:rm]')}>
                      <button
                        type="button"
                        aria-label={`Remove ${x.product} from the list`}
                        title="Remove from the list"
                        onClick={() => onRemove?.(x)}
                        className={cn(
                          'inline-grid h-7 w-7 cursor-pointer place-items-center rounded-control border border-control bg-transparent text-[13px] text-muted hover:border-text hover:bg-raised hover:text-text max-[640px]:h-11 max-[640px]:w-11',
                          'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[1px] focus-visible:outline-accent',
                          focusForced,
                        )}
                      >
                        <X aria-hidden size={13} />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
          {totals ? (
            <div className="mt-1 flex justify-end gap-8 border-t border-text pt-[14px] tabular-nums max-[640px]:gap-6 print:break-inside-avoid print:border-t-[1.5pt]">
              <div className="flex flex-col items-end gap-[2px]">
                <span className={cn('text-[12px] text-muted', printLabel)}>Products</span>
                <b className="text-[15px] font-semibold">{totals.products}</b>
              </div>
              <div className="flex flex-col items-end gap-[2px]">
                <span className={cn('text-[12px] text-muted', printLabel)}>Quantity</span>
                <b className="text-right text-[14px] font-medium">{totals.quantity}</b>
              </div>
              {totals.total ? (
                <div className="flex flex-col items-end gap-[2px]">
                  <span className={cn('text-[12px] text-muted', printLabel)}>Total</span>
                  <b className="text-[20px] font-semibold leading-6 tracking-[-0.01em] print:text-[14pt]">{totals.total}</b>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {note ? (
        <div className="pb-1 pt-6 print:break-inside-avoid print:pt-[14pt]">
          {note.onChange ? (
            <label htmlFor="paper-note" className={cn('mb-[6px] block text-[12px] text-muted', printLabel)}>
              {note.label}
            </label>
          ) : (
            <span className={cn('mb-[6px] block text-[12px] text-muted', printLabel)}>{note.label}</span>
          )}
          {note.onChange ? (
            <textarea
              id="paper-note"
              rows={2}
              value={note.text}
              placeholder={note.placeholder}
              onChange={(e) => note.onChange?.(e.target.value)}
              className={cn(noteField, 'print:hidden')}
            />
          ) : null}
          <div className={cn('whitespace-pre-wrap', note.onChange ? 'hidden print:block' : 'block', !note.text && 'print:hidden', 'print:text-[10.5pt]')}>{note.text}</div>
        </div>
      ) : null}

      <div
        aria-hidden={transfer ? undefined : true}
        className={
          transfer
            ? 'mt-11 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-8 text-[12px] leading-[17px] text-muted max-[640px]:mt-8 max-[640px]:grid-cols-[minmax(0,1fr)] max-[640px]:gap-5 print:mt-[40pt] print:grid-cols-[repeat(3,minmax(0,1fr))] print:gap-[24pt] print:break-inside-avoid print:text-[8.5pt] print:uppercase print:tracking-[.04em] print:text-[#333]'
            : 'hidden print:mt-[44pt] print:grid print:grid-cols-[1fr_1fr] print:gap-[40pt] print:break-inside-avoid print:text-[8.5pt] print:uppercase print:tracking-[.04em] print:text-[#333]'
        }
      >
        {signatures.map((s) => (
          <div key={s}>
            <span
              className={
                transfer
                  ? 'mb-[6px] block h-[30px] border-b border-text print:mb-[4pt] print:h-[28pt] print:border-b-[0.75pt] print:border-[#111]'
                  : 'print:mb-[4pt] print:block print:h-[22pt] print:border-b-[0.75pt] print:border-[#111]'
              }
            />
            {s}
          </div>
        ))}
      </div>

      <p className="m-0 hidden print:mt-[22pt] print:block print:border-t-[0.5pt] print:border-[#bbb] print:pt-[6pt] print:text-[8pt] print:text-[#555]">{footer}</p>
      {children ? <div className="print:hidden">{children}</div> : null}
    </article>
  );
}
