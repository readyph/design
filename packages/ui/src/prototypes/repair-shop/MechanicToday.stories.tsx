import type { Meta, StoryObj } from '@storybook/react';
import { MechanicFlow } from './MechanicFlow';
import { mechanic } from './params';

/** PROTOTYPE (RDY-63) - Mechanic mobile at 390. Today is the work queue: each job that needs the mechanic shows its next action first (the top job is the one primary). Waiting and ready-for-pick-up are one line each. The bottom tab bar is prototype-local (NEEDS EARVIN: no kit tab bar). */
const meta: Meta = { title: 'Repair shop/Mechanic today', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

export const Default: Story = { name: 'Mobile 390', parameters: mechanic, render: () => <MechanicFlow /> };
export const Empty: Story = { name: 'Mobile 390 (nothing needs you)', parameters: mechanic, render: () => <MechanicFlow state="empty" /> };
export const Loading: Story = { name: 'Mobile 390 (loading)', parameters: mechanic, render: () => <MechanicFlow state="loading" /> };
export const ErrorState: Story = { name: 'Mobile 390 (error)', parameters: mechanic, render: () => <MechanicFlow state="error" /> };
export const Offline: Story = { name: 'Mobile 390 (offline)', parameters: mechanic, render: () => <MechanicFlow offline /> };
