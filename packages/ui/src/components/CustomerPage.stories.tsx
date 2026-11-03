import type { Meta, StoryObj } from '@storybook/react';
import { CustomerPage } from './CustomerPage';
import { customers } from './sms/data';
import { allServices } from './sms/scheduleData';
import { extraHistory } from './sms/customerExtras';
import { SEED_NOTES, recOf } from './sms/customersModel';

const rec = (id: string) => recOf(customers.find((c) => c.id === id)!, [...allServices, ...extraHistory]);

const meta: Meta<typeof CustomerPage> = {
  title: 'Prototypes/SMS/[For Review] Customer page',
  component: CustomerPage,
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'desktop' } },
  args: { rec: rec('c01'), notes: SEED_NOTES.c01 ?? '', onOpenService: () => {}, onNewService: () => {}, onEdit: () => {}, onCar: () => {}, onRemoveCar: () => {}, onBack: () => {} },
};
export default meta;
type S = StoryObj<typeof CustomerPage>;

export const TwoCars: S = { name: 'Two cars (Maricel)' };
export const OneCar: S = { name: 'One car (Jennifer)', args: { rec: rec('c03'), notes: SEED_NOTES.c03 ?? '' } };
export const ThreeCars: S = { name: 'Three cars, a quote waiting (Grace)', args: { rec: rec('c06'), notes: SEED_NOTES.c06 ?? '' } };
export const FilteredToOneCar: S = { name: 'Services filtered to one car', args: { rec: rec('c06'), notes: SEED_NOTES.c06 ?? '', initialCar: 'v26' } };
export const FilteredToQuotes: S = { name: 'Filtered to quotes', args: { rec: rec('c06'), notes: SEED_NOTES.c06 ?? '', initialStatus: 'quotes' } };
export const OverdueAndOwing: S = { name: 'Car overdue and owing (Nestor)', args: { rec: rec('c19'), notes: SEED_NOTES.c19 ?? '' } };
export const NewCustomer: S = { name: 'New customer, no history', args: { rec: rec('c07'), notes: '' } };
export const LongName: S = { name: 'Long name', args: { rec: rec('c12'), notes: SEED_NOTES.c12 ?? '' } };
export const RemoveCarWithServices: S = { name: 'Remove a car that has services', args: { initialRemove: 'v23' } };
export const Phone: S = { name: 'Phone', parameters: { viewport: { defaultViewport: 'mobile1' } } };
