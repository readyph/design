import type { Meta, StoryObj } from '@storybook/react';
import { MechanicFlow } from './MechanicFlow';
import { mechanic } from './params';

/** PROTOTYPE (RDY-63) - Job detail for the mechanic: customer report, work to do (tap to tick), items used, comments, attachments. Sticky bottom bar: the next action is the one primary; Change status holds free moves and Mark as pending (with a reason). No confirm on status steps (undo toast); only removing an item confirms. Completing a job is the front desk step, not offered. */
const meta: Meta = { title: 'Repair shop/Mechanic job detail', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

const d = (x: NonNullable<Parameters<typeof MechanicFlow>[0]['detail']>) => x;
export const Default: Story = { name: 'Mobile 390 (in progress, next: Mark ready)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 13 })} /> };
export const ToDo: Story = { name: 'Mobile 390 (to-do, next: Start work)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 21 })} /> };
export const Pending: Story = { name: 'Mobile 390 (pending)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 17 })} /> };
export const ForPickup: Story = { name: 'Mobile 390 (for pick-up)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 15 })} /> };
export const Completed: Story = { name: 'Mobile 390 (completed, locked)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 22 })} /> };
export const EmptySections: Story = { name: 'Mobile 390 (for approval, no items, comments or files)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 24 })} /> };
export const Loading: Story = { name: 'Mobile 390 (loading)', parameters: mechanic, render: () => <MechanicFlow detail={d({ state: 'loading' })} /> };
export const ErrorState: Story = { name: 'Mobile 390 (error)', parameters: mechanic, render: () => <MechanicFlow detail={d({ state: 'error' })} /> };
export const SaveFailed: Story = { name: 'Mobile 390 (status save failed)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 13, saveFailed: 'for_pickup' })} /> };
export const Offline: Story = { name: 'Mobile 390 (offline)', parameters: mechanic, render: () => <MechanicFlow offline detail={d({ jobId: 13 })} /> };
export const ChangeStatus: Story = { name: 'Mobile 390 (change status sheet)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 13, sheet: 'status' })} /> };
export const PutPending: Story = { name: 'Mobile 390 (mark as pending)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 13, sheet: 'hold' })} /> };
export const AddItem: Story = { name: 'Mobile 390 (add item)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 13, sheet: 'item' })} /> };
export const AddItemValidation: Story = { name: 'Mobile 390 (add item, validation)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 13, sheet: 'item-validation' })} /> };
export const AddComment: Story = { name: 'Mobile 390 (add comment)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 13, sheet: 'comment' })} /> };
export const AddCommentValidation: Story = { name: 'Mobile 390 (comment, validation)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 13, sheet: 'comment-validation' })} /> };
export const RemoveItem: Story = { name: 'Mobile 390 (remove item confirm)', parameters: mechanic, render: () => <MechanicFlow detail={d({ jobId: 13, sheet: 'remove' })} /> };
