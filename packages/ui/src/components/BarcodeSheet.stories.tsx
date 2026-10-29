import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BarcodeSheet, type BarcodeProduct, type BarcodeSheetProps } from './BarcodeSheet';

/* Sample data: three products with barcodes (the prototype's sample scans) plus name-search extras. Replace with real data. */
const products: BarcodeProduct[] = [
  { id: 'p07', name: 'Oil filter, small', sku: 'OF-0107', barcode: '4805550000017', unit: 'pc', onHand: 12, location: 'Shelf A2' },
  { id: 'p16', name: 'Brake pad set', sku: 'BP-0216', barcode: '4805550000161', unit: 'box', onHand: 1, location: 'Shelf B1' },
  { id: 'p17', name: 'Engine oil 1L', sku: 'EO-0317', barcode: '4805550000178', unit: 'bottle', onHand: 30, location: 'Shelf C3' },
];

const meta: Meta<typeof BarcodeSheet> = {
  title: 'Components/Overlays/BarcodeSheet',
  component: BarcodeSheet,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Barcode sheet (RDY-390, I16): bottom sheet below 700px, centred dialog from 700px. Product mode sends a known barcode or picked product to onFound; capture mode sends any code to onCode. Source: inventory-home FINAL/barcode.css, barcode.js.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof BarcodeSheet>;

function Host(p: Partial<BarcodeSheetProps> & { label?: string }) {
  const [open, setOpen] = useState(true);
  const [last, setLast] = useState('');
  return (
    <div className="p-6 text-body text-text">
      <button type="button" className="rounded-control border border-control px-3 py-2" onClick={() => setOpen(true)}>
        Open barcode sheet
      </button>
      <p className="mt-3 text-muted" aria-live="polite">{last}</p>
      <BarcodeSheet
        products={products}
        samples={products}
        {...p}
        open={open}
        onOpenChange={setOpen}
        onFound={(x, c) => setLast(`Found ${x.name} (${c})`)}
        onCode={(c, x) => setLast(`Code ${c}${x ? ` (${x.name})` : ''}`)}
      />
    </div>
  );
}

export const Find: Story = { render: () => <Host ctx="find" unknown={{ label: 'Tell your manager', href: '#' }} /> };
export const StockOut: Story = { render: () => <Host ctx="out" title="Scan the product going out" unknown={{ label: 'Tell your manager', href: '#' }} /> };
export const StockIn: Story = { render: () => <Host ctx="in" title="Scan the product coming in" unknown={{ label: 'Tell your manager', href: '#' }} /> };
/** Production: no samples, so no "Pretend you scanned one" section and no fake unknown product (RDY-479). */
export const Production: Story = { render: () => <Host ctx="in" title="Scan the product coming in" samples={[]} unknown={{ label: 'Tell your manager', href: '#' }} /> };
export const AlreadyRequested: Story = {
  render: () => <Host ctx="ask" alreadyRequested={() => true} unknown={{ label: 'Tell your manager', href: '#' }} value="4805550314158" />,
};
export const NewProductCapture: Story = { render: () => <Host ctx="np" mode="capture" title="Scan the new product" warnKnown /> };
export const SearchCapture: Story = { render: () => <Host ctx="search" mode="capture" names={false} title="Scan to search" /> };
