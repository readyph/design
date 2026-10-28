import type { Meta, StoryObj } from '@storybook/react';
import { SignedOutPage } from './SignedOut.page';

/**
 * RDY-410. Prototype only: not exported from the package. Exact copy of workshop `signed-out.html`
 * (workshop/prototypes/inventory-home/round-1/final): platform logo and name, "You are signed out", one primary Sign in back to Home
 * keeping tenant and viewer. Tenant A is Parts Stockroom, tenant B is Café Inventory. The 1440px hero-void WARN is kept on purpose.
 */
const meta: Meta<typeof SignedOutPage> = {
  title: 'Prototypes/Inventory/[For Review] Signed out',
  component: SignedOutPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof SignedOutPage>;
const phone = { viewport: { defaultViewport: 'mobile1' } };

export const TenantA: Story = { name: 'Tenant A (light)', args: { tenant: 'a', theme: 'light' } };
export const TenantADark: Story = { name: 'Tenant A (dark)', args: { tenant: 'a', theme: 'dark' } };
export const TenantB: Story = { name: 'Tenant B (light)', args: { tenant: 'b', theme: 'light' } };
export const TenantBDark: Story = { name: 'Tenant B (dark)', args: { tenant: 'b', theme: 'dark' } };
export const Phone: Story = { name: 'Phone', args: { tenant: 'a', theme: 'light' }, parameters: phone };
