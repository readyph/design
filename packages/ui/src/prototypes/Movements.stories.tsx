import type { Meta, StoryObj } from '@storybook/react';
import { MovementsPage } from './Movements.page';

/**
 * [For Review] Movements. Prototype only: stories are not exported from the package. RDY-436 (b): ledger, filters, tabs shell, states, phone. RDY-437 (c): Record movement and Undo.
 * Source: inventory-home FINAL movements.html, movements.js, movements.css. Data from Movements.data.ts. Later slices (c, d, e, f) append stories to this file.
 */
const meta: Meta<typeof MovementsPage> = {
  title: 'Prototypes/Inventory/Movements',
  component: MovementsPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof MovementsPage>;

export const Ledger: Story = { name: 'Ledger (manager)', args: {} };
export const FilterStockOutSold: Story = { name: 'Stock out, sold (&io=out &reason=sold)', args: { io: 'out', reason: 'sold' } };
export const FilterWeek: Story = { name: 'Last 7 days (&range=week)', args: { range: 'week' } };
export const FilterCustomDates: Story = { name: 'Choose dates (&range=custom&from=20&to=22)', args: { range: 'custom', from: 20, to: 22 } };
export const FilterSearch: Story = { name: 'Search (&qs=)', args: { qs: 'oil' } };
export const JobOrderNote: Story = { name: 'Job order note (JO ref opened)', args: { jo: 'JO-0413' } };
export const Loading: Story = { name: 'Loading', args: { state: 'loading' } };
export const ErrorState: Story = { name: 'Error', args: { state: 'error' } };
export const NoMovements: Story = { name: 'No movements yet (&mv=none)', args: { mv: 'none' } };
export const NoResults: Story = { name: 'No results', args: { qs: 'zzzz' } };
export const Quiet: Story = { name: 'Quiet', args: { state: 'quiet' } };
export const Clerk: Story = { name: 'Clerk', args: { as: 'clerk' } };
export const TenantB: Story = { name: 'Tenant B', args: { tenant: 'b' } };
export const Phone: Story = { name: 'Phone 390 ledger', args: {}, parameters: { viewport: { defaultViewport: 'mobile1' } } };

/* RDY-437 (c): Record movement and Undo. movements.js 276-293, 456-465, 483-500, 573-578; stock.js 83-91, 205-212. */
export const RecordMovement: Story = { name: 'Record movement (&record=1)', args: { record: true } };
export const RecordMovementWithProduct: Story = { name: 'Record movement with product (&record=1&p=)', args: { record: true, p: 'p01' } };
export const RecordMovementClerk: Story = { name: 'Record movement, clerk (Damaged or lost and Count correction locked)', args: { record: true, p: 'p01', as: 'clerk' } };
export const LandedWithUndo: Story = { name: 'Landed note with Undo (flash moved)', args: { landed: true } };
export const UndoAsksFirst: Story = { name: 'Undo asks first', args: { landed: true, undoOpen: true } };
export const RecordingOff: Story = { name: 'Recording off (error)', args: { state: 'error' } };
export const PhoneRecord: Story = { name: 'Phone 390 record', args: { record: true, p: 'p01' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
