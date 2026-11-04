import { toast } from '../toast/toastStore';
import { dayWord } from './floorModel';
import { PAY_WORD, fmt, methodLabel, type ReceiptData } from '../payment/model';

export type DocPaper = 'a4' | 'slip';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** statement-JO-0410-NBC4521.html (A4 / Letter), receipt-JO-0410-NBC4521.html once paid, receipt-80mm-JO-0410-NBC4521.html for the till slip. */
export function docFileName(doc: ReceiptData, paper: DocPaper): string {
  const kind = paper === 'slip' ? 'receipt-80mm' : doc.state === 'paid' ? 'receipt' : 'statement';
  return `${kind}-${doc.number}-${doc.plate.replace(/[^A-Za-z0-9]/g, '')}.html`;
}

/**
 * A self-contained HTML document (inline CSS, no scripts, no network) built from the same ReceiptData the on-screen ReceiptDoc uses.
 * Opens in any browser and prints on A4, Letter or an 80 mm roll (@page). The real product would return a PDF from the API instead.
 * Colours are plain black on white on purpose: this is a printed paper, not the app UI.
 */
export function documentHtml(doc: ReceiptData, paper: DocPaper): string {
  const slip = paper === 'slip';
  const title = doc.state === 'paid' ? 'Receipt' : 'Statement of account';
  const rows = doc.lines.map((l) => `<tr><td>${esc(l.name)}${l.part ? ' <span class="m">(part)</span>' : ''}${l.billing ? ' <span class="m">(added)</span>' : ''}</td><td class="r">${l.qty}</td>${slip ? '' : `<td class="r">${esc(fmt(l.unit))}</td>`}<td class="r">${esc(fmt(l.total))}</td></tr>`).join('');
  const pays = doc.payments.length === 0 ? '<p class="m">No payment yet.</p>' : `<table>${doc.payments.map((p) => `<tr><td>${esc(dayWord(p.at))} · ${esc(methodLabel(p.method))}${p.ref ? ` · ${esc(p.ref)}` : ''}${p.by ? ` · ${esc(p.by)}` : ''}${p.remarks ? `<br><span class="m">Remarks: ${esc(p.remarks)}</span>` : ''}</td><td class="r">${esc(fmt(p.amount))}</td></tr>`).join('')}</table>`;
  const css = `
@page{size:${slip ? '80mm auto' : 'A4'};margin:${slip ? '4mm' : '16mm'}}
*{box-sizing:border-box}
body{margin:0 auto;padding:${slip ? '8px' : '24px'};max-width:${slip ? '80mm' : '190mm'};font:${slip ? '12px/1.4 ui-monospace,Menlo,Consolas,monospace' : '13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif'};color:#111;background:#fff}
h1{margin:0;font-size:${slip ? '14px' : '16px'}}
.m{color:#555}.r{text-align:right;font-variant-numeric:tabular-nums}.k{text-transform:uppercase;letter-spacing:.04em;font-size:11px;color:#555}
header{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;border-bottom:1px solid #111;padding-bottom:10px;${slip ? 'text-align:center;justify-content:center' : ''}}
.no{font:600 16px ui-monospace,Menlo,Consolas,monospace}
.who{display:grid;grid-template-columns:${slip ? '1fr' : '1fr 1fr'};gap:8px 24px;padding:10px 0}
table{width:100%;border-collapse:collapse}th{text-align:left;font-weight:500;font-size:11px;color:#555;border-top:1px solid #111;border-bottom:1px solid #111;padding:5px 0}th.r{text-align:right}
td{padding:5px 0;vertical-align:top;border-bottom:1px solid #ddd}
.tot{margin:10px 0 0 auto;max-width:280px}.tot div{display:flex;justify-content:space-between;gap:12px;padding:2px 0}.tot .b{border-top:1px solid #111;font-weight:600;font-size:15px;margin-top:4px;padding-top:6px}
section{margin-top:16px}footer{margin-top:20px;border-top:1px solid #ddd;padding-top:8px;font-size:11px;color:#555}
`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} ${esc(doc.number)}</title><style>${css}</style></head>
<body>
<header><div><h1>${esc(doc.shop.business)}</h1><div class="m">${esc(doc.shop.branch)} · ${esc(doc.shop.address)}</div><div class="m">${esc(doc.shop.phone)}</div></div>
<div${slip ? '' : ' class="r"'}><div class="k">${esc(title)}</div><div class="no">${esc(doc.number)}</div>${doc.quoteNo ? `<div class="m">From quotation ${esc(doc.quoteNo)}</div>` : ''}</div></header>
<div class="who"><div><div class="m">Customer</div><b>${esc(doc.customer)}</b><div class="m">${esc(doc.phone)}</div></div><div><div class="m">Vehicle</div><b>${esc(doc.car)}</b><div class="m">${esc(doc.plate)}</div></div></div>
<table><thead><tr><th>Item</th><th class="r">Qty</th>${slip ? '' : '<th class="r">Price</th>'}<th class="r">Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot"><div><span class="m">Subtotal</span><span>${esc(fmt(doc.subtotal))}</span></div>${doc.discount > 0 ? `<div><span class="m">Discount${doc.discountNote ? ` (${esc(doc.discountNote)})` : ''}</span><span>−${esc(fmt(doc.discount))}</span></div>` : ''}<div class="b"><span>Total</span><span>${esc(fmt(doc.total))}</span></div></div>
<section><div class="k">Payments</div>${pays}<div class="tot"><div><span class="m">Paid</span><span>${esc(fmt(doc.paid))}</span></div><div class="b"><span>Balance</span><span>${esc(fmt(Math.max(0, doc.balance)))}</span></div></div><p class="r"><b>${esc(PAY_WORD[doc.state])}</b></p></section>
<footer>Amounts are in Philippine pesos. This is an acknowledgement of payment, not an official receipt. Thank you for choosing ${esc(doc.shop.business)}.</footer>
</body></html>`;
}

/** Saves text as a file through a Blob and a temporary anchor (the only way a page can hand the browser a file without a server). */
export function saveFile(name: string, content: string, mime = 'text/html;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Download the statement / receipt as a file, then say so. Returns the file name. */
export function downloadDoc(doc: ReceiptData, paper: DocPaper): string {
  const name = docFileName(doc, paper);
  saveFile(name, documentHtml(doc, paper));
  toast.success(`Downloaded ${name}`);
  return name;
}
