import type { Meta, StoryObj } from '@storybook/react';
import { CustomerPanel } from './CustomerPanel';
import { customers } from './sms/data';
import { everyService } from './sms/servicesData';

const meta: Meta<typeof CustomerPanel> = {
  title: 'Components/SMS/Customer panel',
  component: CustomerPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="h-[640px] w-[360px] border border-rule bg-surface"><Story /></div>],
  args: { customer: customers[0], pool: everyService, onOpenService: () => {}, onNewService: () => {}, onClose: () => {}, onBack: () => {} },
};
export default meta;
type S = StoryObj<typeof CustomerPanel>;

export const Panel: S = {};
export const Page: S = { args: { asPage: true } };
