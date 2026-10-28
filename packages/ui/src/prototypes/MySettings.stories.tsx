import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { MySettingsPage } from './MySettings.page';

/**
 * [For Review] RDY-409. Prototype only: stories are not exported from the package. My settings (handover 2.8): the SettingsModal (I20) over the Inventory frame (I23).
 * Source: inventory-home FINAL settings.js, settings-modal.js, settings-modal.css, my-settings.css. The Home sheet behind it is RDY-403 and stays empty here.
 * Not changed here by design: name, role, photo (initials only), password.
 */
const meta: Meta<typeof MySettingsPage> = {
  title: 'Prototypes/Inventory/My settings',
  component: MySettingsPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof MySettingsPage>;

export const Profile: Story = { name: 'Profile (manager)', args: { settings: 'profile' } };
export const Display: Story = { name: 'Display (manager)', args: { settings: 'display' } };
export const Notifications: Story = { name: 'Notifications (manager)', args: { settings: 'notifications' } };
export const Leda: Story = { name: 'Leda (manager)', args: { settings: 'leda' } };
export const Account: Story = { name: 'Account (manager)', args: { settings: 'account' } };

export const ClerkNotifications: Story = { name: 'Notifications (clerk)', args: { as: 'clerk', settings: 'notifications' } };
export const ClerkLeda: Story = { name: 'Leda (clerk)', args: { as: 'clerk', settings: 'leda' } };
export const ClerkProfile: Story = { name: 'Profile (clerk)', args: { as: 'clerk', settings: 'profile' } };
export const OwnerNotifications: Story = { name: 'Notifications (owner)', args: { as: 'owner', settings: 'notifications' } };
export const OwnerLeda: Story = { name: 'Leda (owner)', args: { as: 'owner', settings: 'leda' } };
export const OwnerProfile: Story = { name: 'Profile (owner)', args: { as: 'owner', settings: 'profile' } };

export const TenantB: Story = { name: 'Tenant B (Café Inventory)', args: { tenant: 'b', settings: 'notifications' } };

const dirty: NonNullable<Story['play']> = async ({ canvasElement }) => {
  const dlg = within(canvasElement.ownerDocument.body);
  await userEvent.click(await dlg.findByRole('switch', { name: 'Stock is low or out' }));
};
export const UnsavedChanges: Story = { name: 'Unsaved changes', args: { settings: 'notifications' }, play: dirty };
export const DiscardQuestion: Story = {
  name: 'Discard question',
  args: { settings: 'notifications' },
  play: async (ctx) => {
    await dirty(ctx);
    const dlg = within(ctx.canvasElement.ownerDocument.body);
    await userEvent.click(await dlg.findByRole('button', { name: 'Cancel' }));
  },
};
export const FailedSave: Story = {
  name: 'Failed save (?fail=1)',
  args: { settings: 'notifications', fail: true },
  play: async (ctx) => {
    await dirty(ctx);
    const dlg = within(ctx.canvasElement.ownerDocument.body);
    await userEvent.click(await dlg.findByRole('button', { name: 'Save' }));
  },
};
export const Loading: Story = { name: 'Loading (?state=loading)', args: { state: 'loading' } };
export const LoadError: Story = { name: 'Error (?state=error)', args: { state: 'error' } };
export const PhoneSheet: Story = { name: 'Phone sheet (390)', args: { settings: 'profile' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const PhoneNotifications: Story = { name: 'Phone sheet, Notifications', args: { settings: 'notifications' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
