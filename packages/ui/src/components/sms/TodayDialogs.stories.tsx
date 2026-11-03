import type { Meta, StoryObj } from '@storybook/react';
import { TodayDialogs } from './TodayDialogs';
import { jobs, products } from './data';

const meta: Meta<typeof TodayDialogs> = {
  title: 'Components/Overlays/Today dialogs',
  component: TodayDialogs,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {}, onTransfer: () => {}, onEta: () => {} },
};
export default meta;
type Story = StoryObj<typeof TodayDialogs>;

export const RequestTransfer: Story = { args: { dialog: { kind: 'transfer', job: jobs[0], product: products[0] } } };
export const SetExpectedTime: Story = { args: { dialog: { kind: 'eta', job: jobs[0], product: products[0] } } };
