import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NewProductBar, NewProductForm, NewProductRequests, EMPTY_NEW_PRODUCT, type NewProductDraft, type NewProductRequest } from './NewProductRequest';
import { StockerFrame } from './StockerFrame';
import { UNKNOWN_BARCODE } from './BarcodeSheet';

/* Sample data: replace with real data. Places follow the prototype's DATA.locations. */
const places = ['Shelf A2', 'Shelf B1', 'Shelf C3', 'Bench'];
const requests: NewProductRequest[] = [
  { id: 'np1', barcode: UNKNOWN_BARCODE, name: 'Wiper blade 24in', qty: 6, loc: 'Shelf B1', by: 'Mara Reyes', at: '9:12', photo: true },
  { id: 'np2', barcode: '4805550099994', by: 'Jun Cruz', at: '8:40', note: 'Came with the Monday delivery' },
];

const meta: Meta = {
  title: 'Components/Forms/NewProductRequest',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'New-product request (RDY-391, I19): the stocker form and bar, and the manager "Needs setting up" rows. Source: inventory-home FINAL stocker.js npView(), stock.css .nsu, products.js.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

function Form({ initial, seen = [] }: { initial: NewProductDraft; seen?: string[] }) {
  const [d, setD] = useState(initial);
  const already = (c: string) => seen.includes(c);
  return (
    <StockerFrame
      platform="Parts Stockroom"
      title="What is this product?"
      lead="We don't have it yet. Tell your manager what you can. They set it up."
      back={{ href: '#', label: 'Find a product' }}
      account={{ initials: 'MR', name: 'Mara Reyes', href: '#' }}
      homeHref="#"
      bar={<NewProductBar value={d} alreadyRequested={already} onSend={() => undefined} />}
    >
      <NewProductForm value={d} onChange={setD} locations={places} />
    </StockerFrame>
  );
}

export const FormEmpty: Story = { render: () => <Form initial={EMPTY_NEW_PRODUCT} />, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const FormUnknownBarcodeKept: Story = {
  render: () => <Form initial={{ ...EMPTY_NEW_PRODUCT, code: UNKNOWN_BARCODE, name: 'Wiper blade 24in', qty: '6', loc: 'Shelf B1', photo: 'wiper.jpg' }} />,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
export const FormAlreadyTold: Story = {
  render: () => <Form initial={{ ...EMPTY_NEW_PRODUCT, code: UNKNOWN_BARCODE }} seen={[UNKNOWN_BARCODE]} />,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const ManagerRows: Story = {
  render: () => (
    <div className="p-6 text-body text-text">
      <NewProductRequests requests={requests} onSetUp={() => undefined} onNotOurs={() => undefined} />
    </div>
  ),
};
export const ManagerRowsPhone: Story = { ...ManagerRows, parameters: { viewport: { defaultViewport: 'mobile1' } } };
