import type { Meta, StoryObj } from '@storybook/react';
import { OrderListsPage } from './OrderLists.page';

/**
 * [For Review] RDY-405. Prototype only: stories are not exported from the package. Order lists (handover 2.3 and 2.4): the paper (I9) you print and send, the index, the steps (I10) and the cart offcanvas (I8).
 * Source: inventory-home FINAL order-list.html, order-list.js, order-list.css, cart.js, cart.css, orders.js. Data generated from data.js and orders.js (OrderLists.data.ts).
 */
const meta: Meta<typeof OrderListsPage> = {
  title: 'Prototypes/Inventory/Order lists',
  component: OrderListsPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof OrderListsPage>;

export const Lists: Story = { name: 'Order lists (manager)', args: {} };
export const SentOrders: Story = { name: 'Sent orders', args: { tab: 'sent' } };
export const OneSentPo: Story = { name: 'One sent PO (PO-0222)', args: { tab: 'sent', po: 'PO-0222' } };
export const NoLists: Story = { name: 'No lists (?lists=empty)', args: { empty: true } };
export const Loading: Story = { name: 'Loading', args: { state: 'loading' } };
export const ErrorState: Story = { name: 'Error', args: { state: 'error' } };
export const Clerk: Story = { name: 'Clerk', args: { as: 'clerk' } };
export const ClerkAsked: Story = { name: 'Clerk, asked the manager', args: { as: 'clerk', asked: true } };
export const MarkAsSentConfirm: Story = { name: 'Mark as sent confirm', args: { confirm: true } };
export const CartOpen: Story = { name: 'Cart offcanvas open (&cart=open)', args: { cart: true } };
export const TenantB: Story = { name: 'Tenant B', args: { tenant: 'b' } };
export const Phone: Story = { name: 'Phone 390', args: {}, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const FromHome: Story = { name: 'From Home (&from=home)', args: { from: 'home' } };
export const FirstRun: Story = { name: 'No products yet (?state=empty)', args: { state: 'empty' } };
