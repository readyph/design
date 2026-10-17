import type { Meta, StoryObj } from '@storybook/react';
import { RepairFlow } from './Flow';
import { fullscreen, mobile } from './params';

/** PROTOTYPE (RDY-18) - Shell A, decided: a branch is an entity under one tenant. A switcher in the top bar re-scopes every record to the branch and keeps you on the same page; single-branch tenants see the name as plain text. */
const meta: Meta = { title: 'Repair shop/Shell A', tags: ['!autodocs'], parameters: fullscreen };
export default meta;
type Story = StoryObj;

/** Opens on Today for Davao City, then the play step picks Cebu - Mandaue so the header description and items visibly re-scope on the same page. */
export const Default: Story = {
  render: () => <RepairFlow />,
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
export const SingleBranch: Story = { name: 'Single branch (plain text, no switching)', render: () => <RepairFlow branchState="single" /> };
export const LoadingBranches: Story = { name: 'Loading branches', render: () => <RepairFlow branchState="loading" /> };
export const BranchesError: Story = { name: 'Error (branches failed)', render: () => <RepairFlow branchState="error" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <RepairFlow /> };
export const MobileMenuOpen: Story = { name: 'Mobile 390 (menu open)', parameters: mobile, render: () => <RepairFlow menuOpen /> };
