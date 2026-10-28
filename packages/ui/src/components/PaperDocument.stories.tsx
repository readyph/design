import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import { PaperDocument, type PaperLine } from './PaperDocument';
import { PlatformLogo } from './PlatformLogo';
import { QuantityStepper } from './QuantityStepper';

const meta: Meta<typeof PaperDocument> = {
  title: 'Components/Data/PaperDocument',
  component: PaperDocument,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Paper document (I9): the one framed object that is printed. Order list (editable draft), purchase order (read-only) and stock transfer. Print: `@page` margin 15mm 16mm 18mm, 10.5pt/1.4, black on white, one page on A4 and Letter. The page hides its own rail, header, steps and search when printing.',
          '',
          '```tsx',
          "import { PaperDocument } from '@readyph/ui';",
          '',
          '<PaperDocument label="Order list for Autopro" title="Purchase order" number="Not a PO yet" meta={meta} parties={parties}',
          '  lines={lines} totals={totals} note={note} signatures={["Prepared by", "Approved by"]} footer="..." onRemove={remove} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof PaperDocument>;

const logo = <PlatformLogo name="Autoworks" size={28} decorative />;
const base = { logo, company: 'Berto Autoworks Inc.', companyLine: 'Autoworks · Quezon City' };

const lines: PaperLine[] = [
  { id: 'a', code: 'OF-1042', product: 'Oil filter, Toyota Vios', sub: 'Suggested by Leda · 3 left · Low', quantity: 40, unit: 'pc', cost: '₱185.00', amount: '₱7,400.00' },
  { id: 'b', code: 'BP-2210', product: 'Brake pad set, front', sub: '2 left · Low', quantity: 8, unit: 'set', cost: '₱1,420.00', amount: '₱11,360.00' },
  { id: 'c', code: 'EO-5W30', product: 'Engine oil 5W-30, 1 L', sub: '6 left · Running out', quantity: 35, unit: 'bottle', cost: '₱365.00', amount: '₱12,775.00' },
];
const parties = [
  { heading: 'Supplier', name: 'Autopro Trading', lines: ['Attn: Marissa Dela Cruz', '+63 917 555 0142', 'orders@autopro.example', '12 Quirino Ave, Quezon City'] },
  { heading: 'Deliver to', name: 'Autoworks', lines: ['Berto Autoworks Inc.', 'Quezon City', 'Receiving Mon to Sat, 8:00 AM to 5:00 PM'], terms: 'Terms: Delivery in 2 days.' },
];
const totals = { products: 3, quantity: '40 pc · 8 sets · 35 bottles', total: '₱31,535.00' };
const footer = 'Berto Autoworks Inc. · Not a PO yet · printed 22 Oct, 9:12 AM';

const meta1 = (extra: Array<{ label: string; value: string; only?: 'screen' | 'print' }> = []) => [
  { label: 'Date', value: '22 Oct 2026' },
  { label: 'Status', value: <Badge tone="neutral">Draft · not sent</Badge>, only: 'screen' as const },
  { label: 'Prepared by', value: <><span className="whitespace-nowrap">Leda, 9:02 AM</span> · <span className="whitespace-nowrap">edited by Berto</span></> },
  { label: 'Expected', value: 'Mon 26 Oct' },
  ...extra,
];

function Editable({ prices }: { prices: boolean }) {
  const [rows, setRows] = useState(lines);
  const [text, setText] = useState('');
  return (
    <PaperDocument
      {...base}
      label="Order list for Autopro"
      title="Purchase order"
      number="Not a PO yet"
      meta={meta1()}
      parties={parties}
      lines={rows.map((r) => ({
        ...r,
        editor: <QuantityStepper value={r.quantity} productName={r.product} onValueChange={(q) => setRows((x) => x.map((y) => (y.id === r.id ? { ...y, quantity: q } : y)))} />,
      }))}
      onRemove={(l) => setRows((x) => x.filter((y) => y.id !== l.id))}
      showPrices={prices}
      totals={{ ...totals, total: prices ? totals.total : undefined }}
      note={{ label: 'Notes to the supplier', text, onChange: setText, placeholder: 'For example: deliver to the back door, call before arriving.' }}
      signatures={['Prepared by', 'Approved by']}
      footer={footer}
      empty="This list is empty. Add a product below."
    />
  );
}

/** Editable draft, manager view: unit cost and amount, quantity stepper, Remove, notes. */
export const OrderListManager: Story = { render: () => <Editable prices /> };

/** Clerk copy: no prices, no total. */
export const OrderListClerk: Story = { render: () => <Editable prices={false} /> };

/** Sent purchase order, read-only. */
export const PurchaseOrderSent: Story = {
  args: {
    ...base,
    label: 'Purchase order for Autopro',
    title: 'Purchase order',
    number: 'PO-0223',
    meta: [
      { label: 'Date', value: '20 Oct 2026' },
      { label: 'Status', value: <Badge tone="accent">Sent</Badge>, only: 'screen' },
      { label: 'Prepared by', value: 'Leda, 9:02 AM · edited by Berto', only: 'print' },
      { label: 'Sent', value: '20 Oct 9:30 AM by Berto', only: 'screen' },
      { label: 'Expected', value: 'Thu 22 Oct' },
    ],
    parties,
    lines,
    quantityLabel: 'Ordered',
    showPrices: true,
    totals,
    note: { label: 'Notes to the supplier', text: 'Deliver to the back door.' },
    signatures: ['Prepared by', 'Approved by'],
    footer: 'Berto Autoworks Inc. · PO-0223 · printed 22 Oct, 9:12 AM',
  },
};

/** Part-received PO: the "In" column. */
export const PurchaseOrderPartIn: Story = {
  args: {
    ...PurchaseOrderSent.args,
    number: 'PO-0222',
    meta: [
      { label: 'Date', value: '18 Oct 2026' },
      { label: 'Status', value: <Badge tone="warn">Part in · 30 of 83</Badge>, only: 'screen' },
      { label: 'Expected', value: 'Thu 22 Oct' },
    ],
    lines: lines.map((l, i) => ({ ...l, received: i === 0 ? 30 : 0 })),
    showReceived: true,
    note: undefined,
  },
};

/** No lines. */
export const Empty: Story = {
  args: { ...base, label: 'Order list for Petron', title: 'Purchase order', number: 'Not a PO yet', meta: meta1(), parties, lines: [], signatures: ['Prepared by', 'Approved by'], footer, empty: 'This list is empty. Add a product below.' },
};

/** Stock transfer: Sent and Counted on arrival (blank to fill in), three signature lines. */
export const Transfer: Story = {
  args: {
    ...base,
    kind: 'transfer',
    label: 'Stock transfer TR-0031',
    title: 'Stock transfer',
    number: 'TR-0031',
    meta: [
      { label: 'Date', value: '21 Oct' },
      { label: 'Status', value: <Badge tone="accent">Sent</Badge>, only: 'screen' },
      { label: 'Prepared by', value: 'Berto Reyes' },
      { label: 'For job', value: 'JO-0417' },
      { label: 'Items', value: '40 pc · 8 sets', only: 'print' },
    ],
    parties: [
      { heading: 'From', name: 'Main stockroom', lines: ['Quezon City'] },
      { heading: 'To', name: 'Branch 2 workshop', lines: ['Pasig City'] },
    ],
    lines: lines.map((l) => ({ ...l, cost: undefined, amount: undefined, sub: undefined })),
    quantityLabel: 'Sent',
    note: { label: 'Note', text: 'Carry in the blue crate.' },
    signatures: ['Prepared by (name, signature)', 'Carried by (name, signature)', 'Received by (name, signature, date)'],
    footer: 'Berto Autoworks Inc. · TR-0031 · printed 22 Oct, 9:12 AM',
  },
};

/** Received transfer: the counted quantity replaces the blank. */
export const TransferReceived: Story = {
  args: { ...Transfer.args, lines: (Transfer.args!.lines as PaperLine[]).map((l, i) => ({ ...l, counted: i === 1 ? 7 : l.quantity })) },
};
