import type { Meta, StoryObj } from '@storybook/react';
import { MechanicFlow } from './MechanicFlow';
import { mechanic } from './params';

/** PROTOTYPE (RDY-63) - Jobs assigned to the mechanic as a grouped list (System Settings style): Needs you now, Waiting, Ready for pick-up, Completed. Rows open the job. */
const meta: Meta = { title: 'SMS/Mechanic jobs', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

export const Default: Story = { name: 'Mobile 390', parameters: mechanic, render: () => <MechanicFlow tab="jobs" /> };
export const Empty: Story = { name: 'Mobile 390 (none assigned)', parameters: mechanic, render: () => <MechanicFlow tab="jobs" state="empty" /> };
export const NoResults: Story = { name: 'Mobile 390 (no search results)', parameters: mechanic, render: () => <MechanicFlow tab="jobs" jobsQuery="zzz" /> };
export const Loading: Story = { name: 'Mobile 390 (loading)', parameters: mechanic, render: () => <MechanicFlow tab="jobs" state="loading" /> };
export const ErrorState: Story = { name: 'Mobile 390 (error)', parameters: mechanic, render: () => <MechanicFlow tab="jobs" state="error" /> };
export const Offline: Story = { name: 'Mobile 390 (offline)', parameters: mechanic, render: () => <MechanicFlow tab="jobs" offline /> };
