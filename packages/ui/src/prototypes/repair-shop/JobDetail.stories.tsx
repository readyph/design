import type { Meta, StoryObj } from '@storybook/react';
import { RepairShell } from './Shell';
import { JobDetail, type DetailState } from './JobScreens';
import { JOBS, type JobStatus } from './data';
import { mobile } from './params';

/** PROTOTYPE (RDY-18) - job detail. The next action is the single primary in the header (the sticky bar on mobile); free status moves live in "Change status". The Leda slot is an inert placeholder. */
const meta: Meta = { title: 'Repair shop/Job detail', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

const Page = ({ status, state, id = 13 }: { status?: JobStatus; state?: DetailState; id?: number }) => (
  <RepairShell active="jobs" title="Job #13">{(b) => <JobDetail job={JOBS.find((j) => j.id === id)} status={status} state={state} branchName={b.name} />}</RepairShell>
);

export const Default: Story = { name: 'Default (in progress, next: Mark ready)', render: () => <Page /> };
export const ReadyForPayment: Story = { name: 'Ready for payment (next: Record payment)', render: () => <Page status="for_pickup" /> };
export const Completed: Story = { name: 'Completed (locked)', render: () => <Page status="completed" /> };
export const EmptyItems: Story = { name: 'Empty (quotation, no items)', render: () => <Page status="quotation" state="empty-items" /> };
export const Loading: Story = { render: () => <Page state="loading" /> };
export const ErrorState: Story = { name: 'Error (not in this branch)', render: () => <Page state="error" /> };
export const Validation: Story = { name: 'Validation (payment and comment)', render: () => <Page state="validation" status="for_pickup" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <Page /> };
export const MobileReadyForPayment: Story = { name: 'Mobile 390 (ready for payment)', parameters: mobile, render: () => <Page status="for_pickup" /> };
export const MobileLoading: Story = { name: 'Mobile 390 (loading)', parameters: mobile, render: () => <Page state="loading" /> };
