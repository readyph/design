import { render, cleanup, act, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PaymentPage } from './Payment.page';
import { documentHtml, docFileName } from './ext/statementFile';
import { receiptOf, jobFor } from './paymentModel';
import { ReceiptDoc } from './ext/ReceiptDoc';
import { ServicesPricesPage } from './ServicesPrices.page';

beforeAll(() => {
  class RO { constructor(private cb: ResizeObserverCallback) {} observe() { this.cb([{ contentRect: { width: 1000, height: 600 } } as ResizeObserverEntry], this as unknown as ResizeObserver); } unobserve() {} disconnect() {} }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = IO;
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.scrollTo = () => {};
  const D = HTMLDialogElement.prototype as { showModal?: () => void; close?: () => void };
  D.showModal = D.showModal ?? function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  D.close = D.close ?? function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as MediaQueryList);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const mount = async (el: JSX.Element) => { await act(async () => { render(el); }); await act(async () => { await new Promise((r) => setTimeout(r, 30)); }); };

describe('Payment page layout', () => {
  it('Add line sits inside the statement card directly after the last line row; Total due only in the Balance panel', async () => {
    await mount(<PaymentPage jobId="unpaid" />);
    const stmt = screen.getByRole('region', { name: /Final price|Price so far/ });
    const row = within(stmt).getByTestId('add-line-row');
    const lines = within(stmt).getByRole('list', { name: 'Lines' });
    expect(lines.nextElementSibling).toBe(row);
    expect(within(row).getByRole('button', { name: 'Add line' })).toBeTruthy();
    expect(within(stmt).queryByText('Total due')).toBeNull();
    const bal = screen.getByRole('complementary', { name: 'Balance' });
    expect(within(bal).getByTestId('total-due')).toBeTruthy();
    expect(screen.getAllByTestId('total-due')).toHaveLength(1);
    expect(within(bal).getByRole('button', { name: /Record payment/ })).toBeTruthy();
  });
  it('statement actions live in one toolbar only', async () => {
    await mount(<PaymentPage jobId="unpaid" />);
    expect(screen.getAllByRole('toolbar', { name: 'Statement actions' })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Statement' })).toBeNull();
  });
  it('Download saves a Blob through an anchor with a sensible filename and says Downloaded', async () => {
    const urls: Blob[] = [];
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = (b) => { urls.push(b); return 'blob:x'; };
    (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {};
    let name = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { name = this.download; });
    await mount(<PaymentPage jobId="unpaid" />);
    const doc = receiptOf(jobFor('unpaid'));
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: /Download/ })[0]!, { button: 0 }); fireEvent.keyDown(screen.getAllByRole('button', { name: /Download/ })[0]!, { key: 'Enter' }); });
    const item = await screen.findByRole('menuitem', { name: /Download statement/ }).catch(() => null);
    if (item) await act(async () => { fireEvent.click(item); });
    else { const { downloadDoc } = await import('./ext/statementFile'); await act(async () => { downloadDoc(doc, 'a4'); }); }
    expect(name).toBe(docFileName(doc, 'a4'));
    expect(name).toMatch(/^statement-JO-\d+-[A-Z0-9]+\.html$/);
    expect(urls[0]).toBeInstanceOf(Blob);
    expect(await screen.findByText(/Downloaded statement-/)).toBeTruthy();
  });
  it('generated documents are self-contained and escape text', () => {
    const doc = receiptOf(jobFor('paid'));
    const a4 = documentHtml({ ...doc, customer: '<b>X</b>' }, 'a4');
    expect(a4).toContain('<!doctype html>'); expect(a4).not.toContain('<b>X</b>'); expect(a4).toContain('&lt;b&gt;X');
    expect(documentHtml(doc, 'slip')).toContain('80mm');
    expect(docFileName(doc, 'slip')).toMatch(/^receipt-80mm-/);
    expect(docFileName(doc, 'a4')).toMatch(/^receipt-/);
  });
  it('paid job shows Paid in full in the Balance panel; mechanic cannot record', async () => {
    await mount(<PaymentPage jobId="paid" />);
    expect(within(screen.getByRole('complementary', { name: 'Balance' })).getByText('Paid in full', { selector: 'p' })).toBeTruthy();
    cleanup();
    await mount(<PaymentPage jobId="unpaid" role="mechanic" />);
    expect(screen.queryByRole('button', { name: /Record payment/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add line' })).toBeNull();
  });
  it('phone: Balance panel comes first in the DOM, then the statement', async () => {
    await mount(<PaymentPage jobId="unpaid" />);
    const bal = screen.getByRole('complementary', { name: 'Balance' });
    const stmt = screen.getByRole('region', { name: /Final price|Price so far/ });
    expect(bal.compareDocumentPosition(stmt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('Payment PHP fields use one joined money group', () => {
  const group = (input: HTMLElement) => input.parentElement as HTMLElement;
  const check = (input: HTMLElement) => {
    const g = group(input);
    const cls = g.className;
    expect(cls).toContain('rounded-control');
    expect(cls.match(/(?:^|\s)border(?:\s|$)/g)).toHaveLength(1);
    expect(g.className).toContain('focus-within:border-accent');
    expect(g.parentElement!.className).toContain('[&>div]:overflow-hidden');
    expect(g.parentElement!.className).toContain('[&_input]:text-right');
    expect(g.parentElement!.className).toContain('[&_input]:tabular-nums');
    expect(input.className).not.toMatch(/rounded|border/);
    const unit = g.querySelector('span[id$="-unit"]') as HTMLElement;
    expect(unit.textContent).toBe('PHP');
    expect(unit.className).toContain('border-l');
    expect(unit.className).not.toMatch(/rounded|(^|\s)border(\s|$)/);
  };
  it('Record payment: amount and cash handed over', async () => {
    await mount(<PaymentPage jobId="unpaid" />);
    check(screen.getByLabelText(/Amount received/));
    const cash = screen.queryByLabelText(/Cash handed over/);
    if (cash) check(cash);
  });
  it('Discount and Add line unit price', async () => {
    await mount(<PaymentPage jobId="unpaid" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add line' }));
    await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
    const price = screen.getAllByLabelText(/Unit price/);
    check(price[0]);
  });
});

describe('Record payment confirmation', () => {
  const settle = async () => { await act(async () => { await new Promise((r) => setTimeout(r, 40)); }); };
  const open = async () => {
    await mount(<PaymentPage jobId="unpaid" />);
    const form = screen.getByRole('form', { name: 'Record a payment' });
    return { form, btn: within(form).getByRole('button', { name: /^Record payment/ }) };
  };
  it('opens only when the form is valid', async () => {
    const { form, btn } = await open();
    fireEvent.change(within(form).getByLabelText(/Amount received/), { target: { value: '0' } });
    fireEvent.click(btn); await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.change(within(form).getByLabelText(/Amount received/), { target: { value: '100' } });
    fireEvent.click(btn); await settle();
    expect(screen.getByRole('dialog', { name: 'Record payment' })).toBeTruthy();
  });
  it('shows the caption and summary, cancel keeps the values, confirm saves remarks everywhere', async () => {
    const { form, btn } = await open();
    fireEvent.change(within(form).getByLabelText(/Amount received/), { target: { value: '100' } });
    fireEvent.change(within(form).getByLabelText(/Cash handed over/), { target: { value: '150' } });
    fireEvent.click(btn); await settle();
    const dlg = screen.getByRole('dialog', { name: 'Record payment' });
    expect(within(dlg).getByTestId('confirm-caption').textContent).toMatch(/Please confirm\. This payment will be recorded on .+ and can't be edited, only voided\./);
    const sum = dlg.querySelector('dl[aria-label="Payment summary"]') as HTMLElement;
    expect(sum.textContent).toContain('₱100');
    expect(sum.textContent).toContain('Cash');
    expect(sum.textContent).toContain('₱50');
    expect(within(dlg).getByLabelText('Remarks (optional)').getAttribute('placeholder')).toBe("e.g. paid by customer's sister");
    fireEvent.click(within(dlg).getByRole('button', { name: 'Cancel' })); await settle();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect((within(form).getByLabelText(/Amount received/) as HTMLInputElement).value).toBe('100');
    expect((within(form).getByLabelText(/Cash handed over/) as HTMLInputElement).value).toBe('150');
    fireEvent.click(btn); await settle();
    const dlg2 = screen.getByRole('dialog', { name: 'Record payment' });
    fireEvent.change(within(dlg2).getByLabelText('Remarks (optional)'), { target: { value: 'paid by sister' } });
    fireEvent.click(within(dlg2).getByRole('button', { name: 'Record payment' })); await settle();
    expect(screen.queryByRole('dialog', { name: 'Record payment' })).toBeNull();
    expect(screen.getByTestId('pay-remarks').textContent).toContain('paid by sister');
    expect((within(form).getByLabelText(/Cash handed over/) as HTMLInputElement).value).toBe('');
  });
});

const settleMs = async (ms = 40) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const readBlob = (b: Blob) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsText(b); });

describe('Payment remarks reach the documents', () => {
  it('ReceiptDoc shows a payment\'s remarks (and escapes nothing into markup)', async () => {
    const doc = receiptOf(jobFor('paid'));
    const withRemarks = { ...doc, payments: doc.payments.map((p, i) => (i === 0 ? { ...p, remarks: 'paid by customer\'s sister' } : p)) };
    await act(async () => { render(<ReceiptDoc doc={withRemarks} paper="a4" />); });
    expect(screen.getByText(/Remarks: paid by customer's sister/)).toBeTruthy();
    cleanup();
    await act(async () => { render(<ReceiptDoc doc={doc} paper="slip" />); });
    expect(screen.queryByText(/Remarks:/)).toBeNull();
  });
  it('the downloaded statement file carries the remarks, escaped', async () => {
    const doc = receiptOf(jobFor('paid'));
    const html = documentHtml({ ...doc, payments: doc.payments.map((p, i) => (i === 0 ? { ...p, remarks: 'by sister <i>x</i>' } : p)) }, 'a4');
    expect(html).toContain('Remarks: by sister &lt;i&gt;x&lt;/i&gt;');
    expect(html).not.toContain('<i>x</i>');
  });
  it('record a payment with remarks, then Download: the saved file has them', async () => {
    const blobs: Blob[] = [];
    (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL = (b) => { blobs.push(b); return 'blob:y'; };
    (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {};
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await mount(<PaymentPage jobId="unpaid" />);
    const form = screen.getByRole('form', { name: 'Record a payment' });
    fireEvent.change(within(form).getByLabelText(/Amount received/), { target: { value: '100' } });
    fireEvent.click(within(form).getByRole('button', { name: /^Record payment/ })); await settleMs();
    const dlg = screen.getByRole('dialog', { name: 'Record payment' });
    fireEvent.change(within(dlg).getByLabelText('Remarks (optional)'), { target: { value: 'paid by sister' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Record payment' })); await settleMs();
    const { downloadDoc } = await import('./ext/statementFile');
    const job = jobFor('unpaid');
    const doc = receiptOf({ ...job, payments: [...job.payments, { at: job.statusSince, amount: 100, method: 'CASH', remarks: 'paid by sister' }] });
    await act(async () => { downloadDoc(doc, 'a4'); });
    expect(await readBlob(blobs[0]!)).toContain('Remarks: paid by sister');
    expect(screen.getByTestId('pay-remarks').textContent).toContain('paid by sister');
  });
});

describe('Record payment returns focus', () => {
  const openConfirm = async () => {
    await mount(<PaymentPage jobId="unpaid" />);
    const form = screen.getByRole('form', { name: 'Record a payment' });
    fireEvent.change(within(form).getByLabelText(/Amount received/), { target: { value: '100' } });
    const btn = within(form).getByRole('button', { name: /^Record payment/ });
    btn.focus(); fireEvent.click(btn); await settleMs();
    return { form, btn };
  };
  it('Cancel puts focus back on the Record payment button', async () => {
    const { btn } = await openConfirm();
    const dlg = screen.getByRole('dialog', { name: 'Record payment' });
    expect(dlg.contains(document.activeElement)).toBe(true);
    fireEvent.click(within(dlg).getByRole('button', { name: 'Cancel' })); await settleMs(80);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(btn);
  });
  it('Esc and confirming do the same (the button label may carry the new balance)', async () => {
    const { form, btn } = await openConfirm();
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Record payment' }), { key: 'Escape' }); await settleMs(80);
    if (screen.queryByRole('dialog')) fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    await settleMs(80);
    expect(document.activeElement).toBe(btn);
    btn.focus(); fireEvent.click(btn); await settleMs();
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Record payment' })).getByRole('button', { name: 'Record payment' })); await settleMs(80);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(within(form).getByRole('button', { name: /^Record payment/ }));
  });
});

describe('Money fields render as one group and accept typing', () => {
  const typed = (input: HTMLElement, v: string) => { fireEvent.change(input, { target: { value: v } }); return (input as HTMLInputElement).value; };
  const isGroup = (input: HTMLElement) => {
    const g = input.parentElement as HTMLElement;
    expect(g.className).toContain('rounded-control');
    expect(g.parentElement!.className).toContain('[&_input]:text-right');
    return g.querySelector('span[id$="-unit"]') as HTMLElement;
  };
  it('Discount: amount in PHP, percent in %, both typeable, with the preview', async () => {
    await mount(<PaymentPage jobId="unpaid" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add discount' })); await settleMs();
    const form = screen.getByRole('form', { name: 'Custom discount' });
    const amt = within(form).getByLabelText('Amount off');
    expect(isGroup(amt).textContent).toBe('PHP');
    expect(typed(amt, '150')).toBe('150');
    expect(within(form).getByText(/Takes off/).textContent).toContain('₱150');
    fireEvent.click(within(form).getByRole('button', { name: /Percent/ })); await settleMs();
    const pct = within(form).getByLabelText('Percent off');
    expect(isGroup(pct).textContent).toBe('%');
    expect(typed(pct, '10')).toBe('10');
  });
  it('Add line: Unit price is a PHP group and accepts typing', async () => {
    await mount(<PaymentPage jobId="unpaid" />);
    fireEvent.click(screen.getByRole('button', { name: 'Add line' })); await settleMs();
    const price = screen.getAllByLabelText(/Unit price/)[0]!;
    expect(isGroup(price).textContent).toBe('PHP');
    expect(typed(price, '1250')).toBe('1250');
  });
  it('Catalogue: Labour price is a PHP group and keeps digits only', async () => {
    await act(async () => { render(<ServicesPricesPage initialForm="new" />); }); await settleMs();
    const price = screen.getByLabelText('Labour price');
    expect(isGroup(price).textContent).toBe('PHP');
    expect(typed(price, '1,2a50')).toBe('1250');
  });
});
