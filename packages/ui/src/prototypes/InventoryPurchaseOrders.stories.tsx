import type { Meta, StoryObj } from '@storybook/react';
import { PurchaseOrdersPage } from './PurchaseOrders.page';

/**
 * [For Review] RDY-426. Prototype only: stories are not exported from the package. Purchase orders, list view (handover 2.5; slice b of 5).
 * Source: inventory-home FINAL purchase-orders.html, purchase-orders.js 150-238, purchase-orders.css. Data: PurchaseOrders.data.ts (RDY-425).
 * RDY-427 (slice c) appends the one-order view: purchase-orders.js 239-333, 371-394, 585-600, 631-635. Later slices append Receive and the final assembly.
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

/* RDY-427, slice c: one order (?po=) */
export const OrderDraft: Story = { name: 'One order: draft (?po=PO-0224)', args: { po: 'PO-0224' } };
export const OrderDraftSendQuestion: Story = { name: 'One order: draft, Mark as sent asks first', args: { po: 'PO-0224', confirm: 'send' } };
export const OrderSent: Story = { name: 'One order: sent (?po=PO-0222)', args: { po: 'PO-0222' } };
export const OrderSentCancelQuestion: Story = { name: 'One order: sent, Cancel this order asks first', args: { po: 'PO-0222', confirm: 'cancel' } };
export const OrderPartIn: Story = { name: 'One order: part in, 8 of 12 (?po=PO-0223)', args: { po: 'PO-0223' } };
export const OrderReceived: Story = { name: 'One order: received (?po=PO-0221)', args: { po: 'PO-0221' } };
export const OrderCancelled: Story = { name: 'One order: cancelled (?po=PO-0218)', args: { po: 'PO-0218' } };
export const OrderCameInShort: Story = { name: 'One order: received short, settled (?po=PO-0217)', args: { po: 'PO-0217' } };
export const OrderUndoReceipt: Story = { name: 'One order: Undo this receipt', args: { po: 'PO-0222', receipt: true, undoOpen: true } };
export const OrderClerk: Story = { name: 'One order: clerk (no totals, no Mark as sent or Cancel)', args: { po: 'PO-0223', as: 'clerk' } };
export const OrderClerkDraft: Story = { name: 'One order: clerk, draft', args: { po: 'PO-0224', as: 'clerk' } };
export const OrderLate: Story = { name: 'One order: late (&asof=2)', args: { po: 'PO-0222', asof: 2 } };
export const OrderTenantB: Story = { name: 'One order: tenant B', args: { po: 'PO-0046', tenant: 'b' } };
export const OrderPhone: Story = { name: 'Phone 390 order', args: { po: 'PO-0223' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
