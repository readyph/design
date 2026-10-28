import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ActionLink } from './ActionLink';
import {
  MovementFilters,
  MovementLedger,
  MovementTabs,
  MovementTransfersOpen,
  type MovementDay,
  type MovementIo,
} from './MovementLedger';

const meta: Meta<typeof MovementLedger> = {
  title: 'Components/Data/MovementLedger',
  component: MovementLedger,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Movement ledger (I13): tabs Ledger | Transfers, the "Transfers open" line, filters, and a flat ruled list grouped by day (Time, Product, What happened, By, Quantity, Left).',
          '',
          '```tsx',
          "import { MovementLedger, MovementTabs } from '@readyph/ui';",
          '',
          '<MovementTabs value="ledger" transfersCount={4} transfersOpen={2} />',
          '<MovementLedger days={days} more={12} onShowMore={() => {}} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof MovementLedger>;

const days: MovementDay[] = [
  {
    id: 'd22',
    heading: 'Today · Thursday 22 October',
    shortHeading: 'Today · Thu 22 Oct',
    rows: [
      { id: 'V1', time: '9:42 AM', product: { name: 'Engine oil 5W-30', sku: 'OIL-530', location: 'Shelf A2', href: '#p1' }, what: 'Used on JO-0417', detail: 'Oil change', by: 'Berto', qty: -2, unit: 'bottle', left: 3, undoable: true },
      { id: 'V2', time: '8:15 AM', product: { name: 'Brake pads, front', sku: 'BRK-110', location: 'Shelf B1', href: '#p2' }, what: 'Received from PO-0412', detail: '6 ordered, all in', by: 'Mara', qty: 6, unit: 'pc', left: 9 },
    ],
  },
  {
    id: 'd21',
    heading: 'Yesterday · Wednesday 21 October',
    shortHeading: 'Yesterday · Wed 21 Oct',
    rows: [
      { id: 'V3', time: '4:20 PM', product: { name: 'Engine oil 5W-30', sku: 'OIL-530', location: 'Shelf A2', href: '#p1' }, what: 'Damaged', by: 'Berto', qty: -1, unit: 'bottle', left: 5 },
      { id: 'V4', time: '11:05 AM', product: { name: 'Coolant 1L', sku: 'CLT-001', location: 'Shelf A3', href: '#p3' }, what: 'Count correction', detail: 'Recount', by: 'Mara', qty: 4, unit: 'bottle', left: 12 },
    ],
  },
];

const menu = (value: string, options: string[]) => ({ value, options: options.map((o) => ({ value: o, label: o })) });

function Page({ open = true }: { open?: boolean }) {
  const [view, setView] = useState<'ledger' | 'transfers'>('ledger');
  const [io, setIo] = useState<MovementIo>('all');
  const [q, setQ] = useState('');
  return (
    <div className="max-w-[1100px]">
      <MovementTabs value={view} onValueChange={setView} controls="vbody" transfersCount={4} transfersOpen={2} />
      <div id="vbody" role="tabpanel" aria-labelledby={`tab-${view}`} className="mt-6 flex flex-col gap-5 max-[640px]:mt-2 max-[640px]:gap-3">
        {open ? (
          <MovementTransfersOpen
            total={2}
            items={[
              { id: 'TR-0032', direction: 'to', place: 'Kapitolyo', state: <span>Draft</span>, action: <ActionLink caret>Send</ActionLink> },
              { id: 'TR-0030', direction: 'from', place: 'Marikina', state: <span>In transit</span>, action: <ActionLink caret>Receive</ActionLink> },
            ]}
          />
        ) : null}
        <MovementFilters
          io={io}
          onIoChange={setIo}
          counts={{ all: 17, in: 9, out: 8 }}
          query={q}
          onQueryChange={setQ}
          reason={menu('all', ['All reasons', 'Received from an order', 'Sold', 'Used on a job / in the kitchen', 'Transfers', 'Damaged', 'Count correction'])}
          product={menu('All products', ['All products'])}
          person={menu('Everyone', ['Everyone'])}
          dates={menu('Today and yesterday', ['Today and yesterday', 'Last 7 days', 'All dates', 'Choose dates'])}
        />
        <MovementLedger days={days} more={12} />
      </div>
    </div>
  );
}

export const Ledger: Story = { render: () => <Page /> };
export const NoOpenTransfers: Story = { render: () => <Page open={false} /> };
export const SingleUnitDay: Story = {
  render: () => (
    <MovementLedger
      days={[{ ...days[1], rows: days[1].rows.map((r) => ({ ...r, unit: 'bottle' })) }]}
    />
  ),
};
