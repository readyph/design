import type { Meta, StoryObj } from '@storybook/react';
import { HomeTimelinePanel } from './InventoryHome.timeline';

/**
 * [For Review] RDY-422 Inventory Home 2/5 (b). Prototype only: stories are not exported from the package.
 * The timeline panel (To do by, Stock in, Stock out, Expiring, Stock left with the runway) composed from I6 Day timeline and I5 Stock runway.
 * Source: inventory-home FINAL home.js 131-447, home.html CSS. Data: InventoryHome.data.ts. Later slices append to this file.
 */
const meta: Meta<typeof HomeTimelinePanel> = {
  title: 'Prototypes/Inventory/[For Review] Home',
  component: HomeTimelinePanel,
  parameters: { layout: 'padded' },
  argTypes: {
    tenant: { control: 'inline-radio', options: ['a', 'b'] },
    role: { control: 'inline-radio', options: ['manager', 'clerk', 'owner'] },
    state: { control: 'inline-radio', options: ['live', 'quiet', 'loading', 'error', 'empty', 'degraded'] },
    view: { control: 'inline-radio', options: ['today', 'week'] },
  },
};
export default meta;
type Story = StoryObj<typeof HomeTimelinePanel>;

export const TimelineToday: Story = { name: 'Timeline, Today', args: { tenant: 'a' } };
export const TimelineThisWeek: Story = { name: 'Timeline, This week', args: { tenant: 'a', view: 'week' } };
export const RunwayToday: Story = { name: 'Runway, Today (tenant B, milk)', args: { tenant: 'b' } };
export const RunwayThisWeek: Story = { name: 'Runway, This week (tenant B, milk)', args: { tenant: 'b', view: 'week' } };
export const ErrorLane: Story = { name: 'Error lane (?state=error)', args: { tenant: 'a', state: 'error' } };
export const EmptyFirstRun: Story = { name: 'Empty first run (?state=empty)', args: { tenant: 'a', state: 'empty' } };
export const Loading: Story = { name: 'Loading', args: { tenant: 'a', state: 'loading' } };
