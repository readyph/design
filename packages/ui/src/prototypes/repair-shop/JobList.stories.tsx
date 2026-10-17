import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RepairShell, type BranchModel } from './Shell';
import { JobDetail, JobList } from './JobScreens';
import { fullscreen, mobile } from './params';

/**
 * PROTOTYPE (RDY-18) - job pipeline as a filtered list with status tabs. Shared by both branch models;
 * placed in the model A shell here (see Shell A / Shell B for the switching difference).
 */
const meta: Meta = { title: 'Prototypes/Repair shop/Job list', tags: ['!autodocs'], parameters: fullscreen };
export default meta;
type Story = StoryObj;

function Page({ model = 'A', ...props }: { model?: BranchModel } & Parameters<typeof JobList>[0]) {
  const [open, setOpen] = useState(false);
  return (
    <RepairShell active="jobs" model={model}>
      {open ? <JobDetail onBack={() => setOpen(false)} /> : <JobList {...props} onOpenJob={() => setOpen(true)} />}
    </RepairShell>
  );
}

export const Default: Story = { render: () => <Page /> };
export const EmptyTab: Story = { name: 'Empty (status tab)', render: () => <Page state="empty-tab" initialTab="quotation" /> };
export const EmptyBranch: Story = { name: 'Empty (new branch)', render: () => <Page state="empty-branch" /> };
export const NoSearchResults: Story = { name: 'Empty (search)', render: () => <Page initialQuery="zzz" /> };
export const Loading: Story = { render: () => <Page state="loading" /> };
export const ErrorState: Story = { name: 'Error', render: () => <Page state="error" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <Page /> };
export const MobileLoading: Story = { name: 'Mobile 390 (loading)', parameters: mobile, render: () => <Page state="loading" /> };
