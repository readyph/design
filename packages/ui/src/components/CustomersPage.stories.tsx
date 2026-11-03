import type { Meta, StoryObj } from '@storybook/react';
import { CustomersPage, type CustomersProps } from './CustomersPage';
import { Remount, control, liveMeta } from './sms/live';

/** [For Review] RDY-532. Prototype only: stories are not exported from the package. Live Customers page: list -> Customer page -> Add car / Edit customer / Text / Inspector -> New service wizard. All reachable by clicking; Back returns. */
const SCENARIOS: Record<string, CustomersProps> = {
  'List (default)': {},
  'List, search by plate (second car)': { initialQuery: 'ndh5502' },
  'List, search by phone': { initialQuery: '0917 662' },
  'List, search by name (several)': { initialQuery: 'ra' },
  'List, no match for a plate (Take in)': { initialQuery: 'NBC 9999' },
  'List, no match for a name': { initialQuery: 'Zenaida Abad' },
  'List, view: owes money': { initialView: 'owes' },
  'List, second batch loaded': { initialPage: 1 },
  'List, loading the next batch': { initialLoadingMore: true },
  'List, end of list': { initialPage: 2 },
  'Customer page: two cars (Maricel)': { initialCustomer: { id: 'c01' } },
  'Customer page: one car (Jennifer)': { initialCustomer: { id: 'c03' } },
  'Customer page: three cars, a quote waiting (Grace)': { initialCustomer: { id: 'c06' } },
  'Customer page: services filtered to one car': { initialCustomer: { id: 'c06', car: 'v26' } },
  'Customer page: filtered to quotes': { initialCustomer: { id: 'c06', status: 'quotes' } },
  'Customer page: car overdue and owing (Nestor)': { initialCustomer: { id: 'c19' } },
  'Customer page: new customer, no history': { initialCustomer: { id: 'c07' } },
  'Customer page: long name': { initialCustomer: { id: 'c12' } },
  'Customer page: a service opened from history (Inspector)': { initialCustomer: { id: 'c01' }, initialDetail: { kind: 'service', id: 'j0412', from: 'c01' } },
  'Customer page: Text the customer': { initialCustomer: { id: 'c01' }, initialText: 'c01' },
  'Customer page: Add car': { initialCustomer: { id: 'c03' }, initialDetail: { kind: 'car', customerId: 'c03' } },
  'Customer page: Edit car': { initialCustomer: { id: 'c01' }, initialDetail: { kind: 'car', customerId: 'c01', vehicleId: 'v23' } },
  'Customer page: Remove a car that has services': { initialCustomer: { id: 'c01' }, initialRemoveCar: 'v23' },
  'Customer sheet: edit customer (cars, add another)': { initialCustomer: { id: 'c06' }, initialDetail: { kind: 'edit', id: 'c06' } },
  'Customer sheet: new customer': { initialDetail: { kind: 'edit' } },
  'Customer sheet: new customer from a searched plate': { initialDetail: { kind: 'edit', seed: 'NBC 9999' } },
  'Customer sheet: new customer, phone already known': { initialDetail: { kind: 'edit', seed: '0917 803 2214' } },
  'Wizard: New service for the customer (choose car)': { initialCustomer: { id: 'c01' }, initialFlow: { kind: 'new', customerId: 'c01' } },
  'Wizard: New service for the second car': { initialCustomer: { id: 'c01' }, initialFlow: { kind: 'new', customerId: 'c01', vehicleId: 'v23' } },
  'Wizard: New service, add a new customer with two cars': { initialFlow: { kind: 'new' } },
};
type Args = {
  scenario: keyof typeof SCENARIOS;
  state: NonNullable<CustomersProps['state']>;
  inventory: NonNullable<CustomersProps['inventory']>;
  panelCollapsed: boolean;
  leda: boolean;
  stress: boolean;
};

const toProps = (a: Args): CustomersProps => {
  const s = SCENARIOS[a.scenario] ?? {};
  return {
    ...s, state: a.state, inventory: a.inventory, initialPanelCollapsed: a.panelCollapsed, ledaOpen: a.leda,
    initialCustomer: s.initialCustomer ?? (a.stress ? { id: 'c12' } : undefined),
  };
};

const meta: Meta<Args> = {
  ...liveMeta,
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Prototypes/SMS/Customers',
  argTypes: {
    scenario: control.select(Object.keys(SCENARIOS), 'Where the page opens: a list search / view, a Customer page, a car or customer sheet, the New service wizard.', 'Open on load'),
    state: control.select(['ready', 'loading', 'first-run', 'error'], 'Data state (error = the list did not load)'),
    inventory: control.select(['ok', 'slow', 'down'], 'Inventory link'),
    panelCollapsed: control.bool('Right panel collapsed to its rail', 'Layout'),
    leda: control.bool('Leda conversation panel open', 'Layout'),
    stress: control.bool('Open the customer with the long name (when the scenario opens none)', 'Data'),
  },
  args: { scenario: 'List (default)', state: 'ready', inventory: 'ok', panelCollapsed: false, leda: false, stress: false },
  render: (a) => <Remount on={a}><CustomersPage {...toProps(a)} /></Remount>,
};
export default meta;
type Story = StoryObj<Args>;

export const Live: Story = { name: 'Customers' };
