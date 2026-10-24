import type { Meta, StoryObj } from '@storybook/react';
import { RepairFlow } from './Flow';
import { mobile } from './params';

/** PROTOTYPE (RDY-18) - the full job list with status tabs, filters and one suggested next action per row. Opens from the Jobs nav item. */
const meta: Meta = { title: 'SMS/Job list', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => <RepairFlow start="jobs" /> };
export const EmptyTab: Story = { name: 'Empty (status tab)', render: () => <RepairFlow start="jobs" listState="empty-tab" initialTab="quotation" /> };
export const EmptyBranch: Story = { name: 'Empty (new branch)', render: () => <RepairFlow start="jobs" listState="empty-branch" /> };
export const NoSearchResults: Story = { name: 'Empty (search)', render: () => <RepairFlow start="jobs" initialQuery="zzz" /> };
export const Loading: Story = { render: () => <RepairFlow start="jobs" listState="loading" /> };
export const ErrorState: Story = { name: 'Error', render: () => <RepairFlow start="jobs" listState="error" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <RepairFlow start="jobs" /> };
export const MobileLoading: Story = { name: 'Mobile 390 (loading)', parameters: mobile, render: () => <RepairFlow start="jobs" listState="loading" /> };
