import type { Meta, StoryObj } from '@storybook/react';
import { RepairShell, type BranchState } from './Shell';
import { JobList } from './JobScreens';
import { fullscreen, mobile } from './params';

/** PROTOTYPE (RDY-18) - Each branch is its own tenant, grouped under a company. A rail of branch workspaces switches tenant context; data, catalogue and users are separate per branch. */
const meta: Meta = { title: 'Prototypes/Repair shop/Shell (B: branch as tenant)', tags: ['!autodocs'], parameters: fullscreen };
export default meta;
type Story = StoryObj;

const Page = ({ branchState, menuOpen }: { branchState?: BranchState; menuOpen?: boolean }) => (
  <RepairShell active="jobs" model="B" branchState={branchState} menuOpen={menuOpen}>{(b) => <JobList key={b.id} branchId={b.id} />}</RepairShell>
);

export const Default: Story = { render: () => <Page /> };
export const SingleBranch: Story = { name: 'Single branch (no switching)', render: () => <Page branchState="single" /> };
export const LoadingBranches: Story = { name: 'Loading branches', render: () => <Page branchState="loading" /> };
export const BranchesError: Story = { name: 'Error (branches failed)', render: () => <Page branchState="error" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <Page /> };
export const MobileMenuOpen: Story = { name: 'Mobile 390 (menu open)', parameters: mobile, render: () => <Page menuOpen /> };
