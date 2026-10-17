import type { Meta, StoryObj } from '@storybook/react';
import { RepairShell } from './Shell';
import { JobDetail, type DetailState } from './JobScreens';
import type { JobStatus } from './data';
import { fullscreen, mobile } from './params';

/** PROTOTYPE (RDY-18) - job detail: info, status, line items, comments and the payment and invoice panel. */
const meta: Meta = { title: 'Prototypes/Repair shop/Job detail', tags: ['!autodocs'], parameters: fullscreen };
export default meta;
type Story = StoryObj;

const Page = ({ status, state }: { status?: JobStatus; state?: DetailState }) => (
  <RepairShell active="jobs"><JobDetail status={status} state={state} /></RepairShell>
);

export const Default: Story = { name: 'Default (in progress, part-paid)', render: () => <Page /> };
export const Completed: Story = { name: 'Completed (locked)', render: () => <Page status="completed" /> };
export const EmptyItems: Story = { name: 'Empty (quotation, no items)', render: () => <Page status="quotation" state="empty-items" /> };
export const Loading: Story = { render: () => <Page state="loading" /> };
export const ErrorState: Story = { name: 'Error (not in this branch)', render: () => <Page state="error" /> };
export const Validation: Story = { name: 'Validation (payment and comment)', render: () => <Page state="validation" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <Page /> };
export const MobileLoading: Story = { name: 'Mobile 390 (loading)', parameters: mobile, render: () => <Page state="loading" /> };
