import type { Meta, StoryObj } from '@storybook/react';
import { PurchaseOrdersPage } from './PurchaseOrders.page';

/**
 * [For Review] RDY-426. Prototype only: stories are not exported from the package. Purchase orders, list view (handover 2.5; slice b of 5).
 * Source: inventory-home FINAL purchase-orders.html, purchase-orders.js 150-238, purchase-orders.css. Data: PurchaseOrders.data.ts (RDY-425).
 * Later slices append the one-order view, Receive and the final assembly to this file.
 */
const meta: Meta<typeof PurchaseOrdersPage> = { title: 'Prototypes/Inventory/Purchase orders', component: PurchaseOrdersPage, parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj<typeof PurchaseOrdersPage>;

export const List: Story = { name: '[For Review] Purchase orders (list)' };
export const GroupBySupplier: Story = { name: 'Group by supplier (&group=sup)', args: { group: 'sup' } };
export const NoPurchaseOrders: Story = { name: 'No purchase orders yet (&pos=none)', args: { pos: 'none' } };
export const NoResults: Story = { name: 'No results', args: { qs: 'zzz' } };
export const Loading: Story = { name: 'Loading (?state=loading)', args: { state: 'loading' } };
export const ErrorState: Story = { name: 'Error (?state=error)', args: { state: 'error' } };
export const Late: Story = { name: 'Late (&asof=2)', args: { asof: 2 } };
export const Clerk: Story = { name: 'Clerk', args: { as: 'clerk' } };
export const TenantB: Story = { name: 'Tenant B', args: { tenant: 'b' } };
export const Phone: Story = { name: 'Phone 390 list', parameters: { viewport: { defaultViewport: 'mobile1' } } };
