import type { Meta, StoryObj } from '@storybook/react';
import { UNKNOWN_BARCODE } from '../components/BarcodeSheet';
import { ProductsPage } from './Products.page';

/**
 * [For Review] RDY-404. Prototype only: stories are not exported from the package. Products (handover 2.2): list and product detail.
 * Source: inventory-home FINAL products.html, products.js, products.css. Data: Products.data.ts (dumped from data.js, stock.js, orders.js).
 * GAPs: the workshop starts Needs setting up empty (requests come from the stocker flow), so its story seeds one illustrative request; Setup navigates by hash only (no Setup page); the palette's "Prototype states" group (products.js 676-681) is not built, the stories are those states.
 */
const meta: Meta<typeof ProductsPage> = { title: 'Prototypes/Inventory/[For Review] Products', component: ProductsPage, parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj<typeof ProductsPage>;
const phone = { viewport: { defaultViewport: 'mobile1' } };

export const List: Story = { name: 'List (manager)' };
export const Detail: Story = { name: 'Detail (?open=p07)', args: { open: 'p07' } };
export const DetailRate: Story = { name: 'Detail, steady use rate', args: { open: 'p01' } };
export const AdjustStock: Story = { name: 'Adjust stock panel', args: { open: 'p07', panel: 'adjust' } };
export const AddToOrderList: Story = { name: 'Add to order list panel', args: { open: 'p07', panel: 'list' } };
export const AddProduct: Story = { name: 'Add product dialog', args: { addDialog: true } };
export const Loading: Story = { name: 'Loading (?state=loading)', args: { state: 'loading' } };
export const ErrorState: Story = { name: 'Error (?state=error)', args: { state: 'error', open: 'p07' } };
export const Down: Story = { name: 'List did not load (?state=down)', args: { state: 'down' } };
export const Empty: Story = { name: 'Empty (?state=empty)', args: { state: 'empty' } };
export const Quiet: Story = { name: 'Quiet (?state=quiet)', args: { state: 'quiet' } };
export const NoResults: Story = { name: 'No results', args: { qs: 'zzz' } };
export const Degraded: Story = { name: 'Degraded (?state=degraded)', args: { state: 'degraded' } };
export const SupplierChosen: Story = { name: 'Supplier chosen', args: { sup: 'autopro' } };
export const Clerk: Story = { name: 'List (clerk)', args: { as: 'clerk' } };
export const ClerkDetail: Story = { name: 'Detail (clerk)', args: { as: 'clerk', open: 'p07' } };
export const TenantB: Story = { name: 'List (tenant B)', args: { tenant: 'b' } };
export const Phone: Story = { name: 'List (phone 390)', parameters: phone };
export const PhoneDetail: Story = { name: 'Detail (phone 390)', args: { open: 'p07' }, parameters: phone };
export const NeedsSetup: Story = { name: 'Needs setting up (illustrative request)', args: { requests: [{ id: 'np1', barcode: UNKNOWN_BARCODE, name: 'Fleetguard LF3349 oil filter', qty: 6, loc: 'Aisle B', by: 'jomar', at: 'Thu 22 Oct 8:40' }] } };
export const OrderLists: Story = { name: 'Order lists panel (I8)', args: { ordersOpen: true } };
