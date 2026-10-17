import type { Meta, StoryObj } from '@storybook/react';
import { RepairShell, type BranchState } from './Shell';
import { JobList } from './JobScreens';
import { fullscreen, mobile } from './params';

/** PROTOTYPE (RDY-18) - Branch is an entity under one tenant. A switcher in the top bar re-scopes every record to the selected branch; one login, one tenant, company-wide settings stay shared. */
const meta: Meta = { title: 'Prototypes/Repair shop/Shell (A: branch under tenant)', tags: ['!autodocs'], parameters: fullscreen };
export default meta;
type Story = StoryObj;

const Page = ({ branchState, menuOpen }: { branchState?: BranchState; menuOpen?: boolean }) => (
  <RepairShell active="jobs" model="A" branchState={branchState} menuOpen={menuOpen}>{(b) => <JobList key={b.id} branchId={b.id} />}</RepairShell>
);

/** Starts on Davao City, then the play step picks Cebu - Mandaue from the switcher so the header and records visibly re-scope. */
export const Default: Story = {
  render: () => <Page />,
  play: async ({ canvasElement }) => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await wait(600);
    const trigger = canvasElement.querySelector<HTMLElement>('button[aria-label^="Branch:"]');
    trigger?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }));
    await wait(400);
    const item = Array.from(document.querySelectorAll<HTMLElement>('[role="menuitem"]')).find((e) => e.textContent?.startsWith('Cebu'));
    item?.click();
  },
};
export const SingleBranch: Story = { name: 'Single branch (no switching)', render: () => <Page branchState="single" /> };
export const LoadingBranches: Story = { name: 'Loading branches', render: () => <Page branchState="loading" /> };
export const BranchesError: Story = { name: 'Error (branches failed)', render: () => <Page branchState="error" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <Page /> };
export const MobileMenuOpen: Story = { name: 'Mobile 390 (menu open)', parameters: mobile, render: () => <Page menuOpen /> };
