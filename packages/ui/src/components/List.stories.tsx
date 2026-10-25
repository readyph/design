import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { List, ListCell, ListHeader, ListHeaderCell, ListMetric, ListMetrics, ListRow } from './List';
import { PlatformLogo } from './PlatformLogo';
import { StatusDot } from './StatusDot';

const meta: Meta<typeof List> = {
  title: 'Components/Data display/List rows',
  component: List,
  parameters: {
    docs: {
      description: {
        component:
          'Ruled list (C18). Rows have 16px top and bottom padding, a 1px rule, square corners and a value-column subgrid. Only the row under the pointer highlights; j / k move a 2px accent cursor and Enter opens it. Rows stack by the LIST width (container query), not the viewport. The hover rule is exported as `listRowSurface` for any other ruled row.',
      },
    },
  },
  decorators: [(Story) => <div className="bg-surface p-pad text-text"><Story /></div>],
};
export default meta;

const links = [
  ['Stock', 'Reads from Parts Stockroom', 'ok', 'Linked'],
  ['Catalog', 'Shares with Cubao', 'warn', 'Slow'],
  ['Customers', 'Reads from Café POS', 'bad', 'Paused · Café POS is offline'],
] as const;

export const Simple: StoryObj = {
  render: () => {
    const [flash, setFlash] = useState('');
    return (
      <>
        <button className="mb-2 text-ui text-accent underline" onClick={() => setFlash('catalog')}>Flash Catalog</button>
        <List aria-label="Data links" columns="minmax(0,1fr) auto">
          {links.map(([n, d, s, l]) => (
            <ListRow key={n} rowId={n.toLowerCase()} label={n} flash={flash === n.toLowerCase()} dimmed={n === 'Customers'} onActivate={() => {}}>
              <ListCell>
                <div className="font-medium">{n}</div>
                <div className="text-ui text-muted">{d}</div>
              </ListCell>
              <ListCell kind="actions"><StatusDot status={s} label={l} /></ListCell>
            </ListRow>
          ))}
        </List>
      </>
    );
  },
};

export const WithMetrics: StoryObj = {
  render: () => (
    <List as="table" aria-label="Platforms" columns="minmax(0,1fr) 220px">
      <ListHeader><ListHeaderCell>Platform</ListHeaderCell><ListHeaderCell>Now</ListHeaderCell></ListHeader>
      {[['Café POS', 'Orders today', '142', 'Sales', '₱38,420'], ['Main Stockroom', 'Items', '2,184', 'Low stock', '12']].map(([n, a, av, b, bv], i) => (
        <ListRow key={n} rowId={n}>
          <ListCell kind="lead" className="flex items-center gap-3"><PlatformLogo name={n} index={i + 1} size={32} decorative />{n}</ListCell>
          <ListCell>
            <ListMetrics><ListMetric label={a} value={av} /><ListMetric label={b} value={bv} /></ListMetrics>
          </ListCell>
        </ListRow>
      ))}
    </List>
  ),
};

export const LongValues: StoryObj = {
  render: () => (
    <div className="w-[420px]">
      <List aria-label="Long values" columns="minmax(0,1fr) auto">
        <ListRow rowId="a"><ListCell>Reads_Stock_from_Cebu_Parts_Stockroom_Warehouse_Annex_Building_Number_Twelve_Extension</ListCell><ListCell kind="actions">Open</ListCell></ListRow>
      </List>
    </div>
  ),
};

export const StackedBy600: StoryObj = {
  name: 'Stacks at 600px list width',
  render: () => (
    <div className="w-[560px]">
      <List aria-label="Stacked" stackBelow={600} columns="minmax(0,1fr) minmax(0,1fr) auto">
        <ListRow rowId="a"><ListCell kind="lead">Name</ListCell><ListCell>Body text under the name</ListCell><ListCell kind="actions">Open</ListCell></ListRow>
      </List>
    </div>
  ),
};
