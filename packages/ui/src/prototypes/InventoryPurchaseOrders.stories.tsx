import type { Meta, StoryObj } from '@storybook/react';
import { PurchaseOrdersPage } from './PurchaseOrders.page';

/**
 * [For Review] RDY-426. Prototype only: stories are not exported from the package. Purchase orders, list view (handover 2.5; slice b of 5).
 * Source: inventory-home FINAL purchase-orders.html, purchase-orders.js 150-238, purchase-orders.css. Data: PurchaseOrders.data.ts (RDY-425).
 * RDY-427 (slice c) appends the one-order view: purchase-orders.js 239-333, 371-394, 585-600, 631-635. RDY-428 (slice d) appends Receive and the short-delivery block. The final assembly follows.
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

/* RDY-428, slice d: Receive (&receive=1) and the short-delivery block (purchase-orders.js 334-370, 395-478, 539-641) */
const NOTE = { by: 'berto', at: 'Thu 22 Oct 9:12 AM' };
export const Receive: Story = { name: 'Receive: What actually arrived? (?po=PO-0222&receive=1)', args: { po: 'PO-0222', receive: true } };
export const ReceivePartIn: Story = { name: 'Receive: part in, 8 of 12 (?po=PO-0223&receive=1)', args: { po: 'PO-0223', receive: true } };
export const ReceiveClerk: Story = { name: 'Receive: clerk', args: { po: 'PO-0222', receive: true, as: 'clerk' } };
export const ReceivePhone: Story = { name: 'Phone 390 Receive', args: { po: 'PO-0222', receive: true }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const ReceiveTenantB: Story = { name: 'Receive: tenant B', args: { po: 'PO-0046', receive: true, tenant: 'b' } };
export const PickDeliveryStory: Story = { name: 'Receive a delivery: which delivery arrived?', args: { pick: true } };
export const ShortPartIn: Story = { name: 'Short delivery: part in, settle now (?po=PO-0223)', args: { po: 'PO-0223' } };
export const ShortClosed: Story = { name: 'Short delivery: closed short, awaiting you (?po=PO-0221)', args: { po: 'PO-0221' } };
export const ShortAcceptForm: Story = { name: 'Short delivery: accept the shortage (?settle=accept)', args: { po: 'PO-0221', settle: 'accept' } };
export const ShortDisputeForm: Story = { name: 'Short delivery: dispute with the supplier (?settle=dispute)', args: { po: 'PO-0221', settle: 'dispute' } };
export const ShortAccepted: Story = { name: 'Short delivery: accepted', args: { po: 'PO-0221', records: { acc: { 'PO-0221': { ...NOTE, why: 'never', note: '' } } } } };
export const ShortDisputed: Story = { name: 'Short delivery: disputed, Record the answer', args: { po: 'PO-0221', records: { dsp: { 'PO-0221': { ...NOTE, reason: 'short', status: 'open', ref: 'PD-118', note: 'Driver said the rest is on the next truck.' } } } } };
export const ShortRecordAnswer: Story = { name: 'Short delivery: record the answer (?settle=resolve)', args: { po: 'PO-0221', settle: 'resolve', records: { dsp: { 'PO-0221': { ...NOTE, reason: 'short', status: 'open' } } } } };
export const ShortResolvedCredit: Story = { name: 'Short delivery: dispute resolved, credit', args: { po: 'PO-0221', records: { dsp: { 'PO-0221': { ...NOTE, reason: 'short', status: 'resolved', outcome: 'credit', credit: '500', rby: 'berto', rat: 'Thu 22 Oct 9:30 AM' } } } } };
export const ShortClerk: Story = { name: 'Short delivery: clerk (tell the manager)', args: { po: 'PO-0221', as: 'clerk' } };
export const ShortClerkTold: Story = { name: 'Short delivery: clerk told the manager', args: { po: 'PO-0221', as: 'clerk', records: { told: { 'PO-0221': { by: 'nonoy', at: 'Thu 22 Oct 9:14 AM', note: 'Six short on the 10W-40.' } } } } };
export const ShortError: Story = { name: 'Short delivery: error (buttons disabled)', args: { po: 'PO-0221', state: 'error' } };
export const ShortPhone: Story = { name: 'Phone 390 short delivery', args: { po: 'PO-0221' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
