import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SettingsForm, SettingsModal, type SettingsTheme } from './SettingsModal';
import { sampleChannels, sampleLedaScope, sampleNotifications, sampleValue } from './SettingsModal.sample';

const base = {
  platform: 'Parts Stockroom',
  person: { name: 'Berto Villanueva', initials: 'BV', title: 'Manager' },
  notifications: sampleNotifications,
  channels: sampleChannels,
  ledaScope: sampleLedaScope,
  value: sampleValue,
  savedAt: '9:12 AM',
  portalHref: '#portal',
  signOutHref: '#signed-out',
  onSave: () => undefined,
  onThemeChange: () => undefined,
  theme: 'system' as SettingsTheme,
};

const meta: Meta<typeof SettingsModal> = {
  title: 'Components/Overlays/SettingsModal',
  component: SettingsModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: 'My settings modal (RDY-402, I20). Source: inventory-home FINAL/settings-modal.css, settings-modal.js, my-settings.css, settings.js.' } },
  },
};
export default meta;
type Story = StoryObj<typeof SettingsModal>;

function Host({ tab, fail }: { tab?: 'notifications' | 'profile'; fail?: boolean }) {
  const [open, setOpen] = useState(true);
  const [theme, setTheme] = useState<SettingsTheme>('system');
  let failed = !!fail;
  return (
    <div className="p-6">
      <button type="button" className="rounded-control border border-control px-3 py-2" onClick={() => setOpen(true)}>My settings</button>
      <SettingsModal
        {...base}
        open={open}
        onOpenChange={setOpen}
        tab={tab}
        theme={theme}
        onThemeChange={setTheme}
        onSave={() => {
          if (failed) {
            failed = false;
            throw new Error('fail');
          }
        }}
      />
    </div>
  );
}

export const Profile: Story = { render: () => <Host /> };
export const NotificationsTab: Story = { render: () => <Host tab="notifications" /> };
export const FailedFirstSave: Story = { render: () => <Host fail /> };

export const PageForm: StoryObj<typeof SettingsForm> = { render: () => <div className="p-6"><SettingsForm {...base} layout="page" /></div> };
export const StockerPageCompact: StoryObj<typeof SettingsForm> = {
  render: () => (
    <div className="max-w-[390px] p-4">
      <SettingsForm {...base} layout="page" compact stocker ledaScope={undefined} person={{ name: 'Nonoy Reyes', initials: 'NR', title: 'Stocker' }} value={{ ...sampleValue, phone: '' }} />
    </div>
  ),
};
export const Loading: StoryObj<typeof SettingsForm> = { render: () => <div className="p-6"><SettingsForm {...base} layout="page" state="loading" /></div> };
export const LoadError: StoryObj<typeof SettingsForm> = { render: () => <div className="p-6"><SettingsForm {...base} layout="page" state="error" lastLoaded="9:05 AM" onRetry={() => undefined} /></div> };
