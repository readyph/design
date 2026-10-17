import type { Meta, StoryObj } from '@storybook/react';
import { RepairFlow } from './Flow';
import { fullscreen, mobile } from './params';

/** PROTOTYPE (RDY-18) - Shell A. Each branch is its own platform: the leftmost rail lists every platform connected to the tenant (Portal, Inventory, each Repair shop branch) and the header shows company and branch name as plain text. Account and sign-out stay in the platforms sidebar. */
const meta: Meta = { title: 'Repair shop/Shell A', tags: ['!autodocs'], parameters: fullscreen };
export default meta;
type Story = StoryObj;

export const Default: Story = { name: 'Default (one branch platform)', render: () => <RepairFlow /> };
export const ManyPlatforms: Story = { name: 'Several branch platforms in the rail', render: () => <RepairFlow manyPlatforms /> };
export const Loading: Story = { name: 'Loading', render: () => <RepairFlow todayState="loading" /> };
export const ErrorState: Story = { name: 'Error', render: () => <RepairFlow todayState="error" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <RepairFlow /> };
export const MobileMenuOpen: Story = { name: 'Mobile 390 (menu open)', parameters: mobile, render: () => <RepairFlow menuOpen /> };
