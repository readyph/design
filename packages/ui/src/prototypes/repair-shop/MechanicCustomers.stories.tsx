import type { Meta, StoryObj } from '@storybook/react';
import { MechanicFlow } from './MechanicFlow';
import { mechanic } from './params';

/** PROTOTYPE (RDY-63) - Minimal, read-only customer list for the mechanic: name, plates, tap to call. A customer opens a small detail with vehicles and the mechanic jobs. */
const meta: Meta = { title: 'Repair shop/Mechanic customers', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

export const Default: Story = { name: 'Mobile 390', parameters: mechanic, render: () => <MechanicFlow tab="customers" /> };
export const CustomerDetail: Story = { name: 'Mobile 390 (customer)', parameters: mechanic, render: () => <MechanicFlow tab="customers" customerId={14} /> };
export const Empty: Story = { name: 'Mobile 390 (empty)', parameters: mechanic, render: () => <MechanicFlow tab="customers" state="empty" /> };
export const NoResults: Story = { name: 'Mobile 390 (no search results)', parameters: mechanic, render: () => <MechanicFlow tab="customers" customersQuery="zzz" /> };
export const Loading: Story = { name: 'Mobile 390 (loading)', parameters: mechanic, render: () => <MechanicFlow tab="customers" state="loading" /> };
export const ErrorState: Story = { name: 'Mobile 390 (error)', parameters: mechanic, render: () => <MechanicFlow tab="customers" state="error" /> };
