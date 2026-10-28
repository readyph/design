import { afterEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PaperDocument, type PaperDocumentProps } from './PaperDocument';

afterEach(cleanup);

const props: PaperDocumentProps = {
  label: 'Order list for Autopro',
  company: 'Berto Autoworks Inc.',
  companyLine: 'Autoworks · Quezon City',
  title: 'Purchase order',
  number: 'PO-0223',
  meta: [{ label: 'Date', value: '20 Oct 2026' }, { label: 'Status', value: 'Draft', only: 'screen' }],
  parties: [{ heading: 'Supplier', name: 'Autopro', lines: ['Attn: Marissa'] }],
  lines: [{ id: 'a', code: 'OF-1', product: 'Oil filter', quantity: 4, unit: 'pc', cost: '₱1.00', amount: '₱4.00' }],
  totals: { products: 1, quantity: '4 pc', total: '₱4.00' },
  signatures: ['Prepared by', 'Approved by'],
  footer: 'Berto · PO-0223 · printed',
  empty: 'This list is empty.',
};

describe('PaperDocument', () => {
  it('is a labelled article with the table, totals and footer', () => {
    render(<PaperDocument {...props} showPrices />);
    expect(screen.getByRole('article', { name: 'Order list for Autopro' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Unit cost' })).toBeTruthy();
    expect(screen.getByText('4 pc')).toBeTruthy();
    expect(screen.getByText('Berto · PO-0223 · printed')).toBeTruthy();
  });
  it('clerk copy has no price columns', () => {
    render(<PaperDocument {...props} totals={{ products: 1, quantity: '4 pc' }} />);
    expect(screen.queryByRole('columnheader', { name: 'Unit cost' })).toBeNull();
    expect(screen.queryByText('Total')).toBeNull();
  });
  it('Remove calls back with the line', () => {
    const onRemove = vi.fn();
    render(<PaperDocument {...props} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Oil filter from the list' }));
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });
  it('shows the empty message instead of the table', () => {
    render(<PaperDocument {...props} lines={[]} />);
    expect(screen.getByText('This list is empty.')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });
  it('transfer has the counted column and blank', () => {
    render(<PaperDocument {...props} kind="transfer" lines={[{ ...props.lines[0], cost: undefined }]} />);
    expect(screen.getByRole('columnheader', { name: 'Counted on arrival' })).toBeTruthy();
  });
  it('note textarea is labelled and editable', () => {
    const onChange = vi.fn();
    render(<PaperDocument {...props} note={{ label: 'Notes to the supplier', text: '', onChange }} />);
    fireEvent.change(screen.getByLabelText('Notes to the supplier'), { target: { value: 'Back door' } });
    expect(onChange).toHaveBeenCalledWith('Back door');
  });
  it('has no axe violations in the empty, part-received and transfer variants', async () => {
    const variants: PaperDocumentProps[] = [
      { ...props, lines: [] },
      { ...props, showReceived: true, showPrices: true, quantityLabel: 'Ordered' },
      { ...props, kind: 'transfer', quantityLabel: 'Sent', lines: [{ ...props.lines[0], cost: undefined }, { id: 'b', code: 'B', product: 'Pad', quantity: 2, unit: 'set', counted: 2 }], signatures: ['Prepared by', 'Carried by', 'Received by'] },
    ];
    for (const v of variants) {
      const { container, unmount } = render(<PaperDocument {...v} />);
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
      expect(r.violations).toEqual([]);
      unmount();
    }
  });
  it('has no axe violations', async () => {
    const { container } = render(<PaperDocument {...props} showPrices onRemove={() => {}} note={{ label: 'Note', text: 'x' }} />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
