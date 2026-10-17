import type { Meta, StoryObj } from '@storybook/react';
import { RepairFlow } from './Flow';
import { mobile } from './params';

/** PROTOTYPE (RDY-18) - Shell, copied from the shipped InventoryShell. Each branch is its own platform: the rail has the R home tile, Inventory and every Repair shop branch with a status dot, a plus button and the account menu at the bottom. Company and branch sit in the sidebar header. */
const meta: Meta = { title: 'Repair shop/Shell A', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

export const Default: Story = { name: 'Default (one branch platform)', render: () => <RepairFlow /> };
export const ManyPlatforms: Story = { name: 'Several branch platforms in the rail', render: () => <RepairFlow manyPlatforms /> };
export const Loading: Story = { name: 'Loading', render: () => <RepairFlow todayState="loading" /> };
export const ErrorState: Story = { name: 'Error', render: () => <RepairFlow todayState="error" /> };
export const Mobile: Story = { name: 'Mobile 390', parameters: mobile, render: () => <RepairFlow /> };
export const MobileMenuOpen: Story = { name: 'Mobile 390 (menu open)', parameters: mobile, render: () => <RepairFlow menuOpen /> };
