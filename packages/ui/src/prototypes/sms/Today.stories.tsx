import type { Meta, StoryObj } from '@storybook/react';
import { RepairFlow } from './Flow';
import { mobile } from './params';

/** PROTOTYPE (RDY-18) - Today is the shell home for the branch: due today, waiting on customer, unpaid, then a "Needs attention" list. Each item suggests one next action. Leda slots are inert placeholders (pending decision). */
const meta: Meta = { title: 'SMS/Today', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => <RepairFlow /> };
export const AllClear: Story = { name: 'Empty (all clear)', render: () => <RepairFlow todayState="clear" /> };
export const Loading: Story = { render: () => <RepairFlow todayState="loading" /> };
export const ErrorState: Story = { name: 'Error', render: () => <RepairFlow todayState="error" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <RepairFlow /> };
