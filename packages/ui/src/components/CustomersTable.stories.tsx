import type { Meta, StoryObj } from '@storybook/react';
import { CustomersTable, CustomerCard } from './CustomersTable';
import { customers, jobs } from './sms/data';
import { recOf } from './sms/customersModel';

const recs = customers.map((c) => recOf(c, jobs));
const withStuck = recs.find((r) => r.stuck > 0) ?? recs[0]!;
const noVisits = { ...recs[0]!, services: [], open: [], last: null, spend: 0, stuck: 0 };

const meta: Meta<typeof CustomersTable> = {
  title: 'Components/SMS/Customers table',
  component: CustomersTable,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { rows: recs.slice(0, 10), onOpen: () => {}, onNewService: () => {} },
  decorators: [(Story) => <div className="overflow-x-auto border border-rule bg-surface"><Story /></div>],
};
export default meta;
type S = StoryObj<typeof CustomersTable>;

export const Default: S = {};
export const OpenRow: S = { name: 'Open customer', args: { openId: recs[0]!.customer.id } };
export const WaitingOnManager: S = { name: 'Open service waiting on manager', args: { rows: [withStuck, ...recs.slice(0, 3)] } };
export const NoVisits: S = { name: 'No visits yet', args: { rows: [noVisits] } };
export const PlateMatch: S = { name: 'Plate match', args: { query: recs[0]!.customer.vehicles[0]!.plate.slice(0, 3) } };
export const Loading: S = { args: { loading: true } };
export const LoadingMore: S = { name: 'Loading more', args: { loadingMore: true } };
export const PhoneCards: StoryObj = {
  name: 'Phone cards',
  render: () => <div className="max-w-sm px-2">{recs.slice(0, 5).map((r) => <CustomerCard key={r.customer.id} rec={r} onOpen={() => {}} />)}<CustomerCard rec={noVisits} onOpen={() => {}} /></div>,
};
