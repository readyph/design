import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Buildings, Bell, Users, Wrench } from '@phosphor-icons/react';
import { SettingsNav, type SettingsSection } from './SettingsNav';
import { FileDropzone, Group, SaveBar, WeekHoursEditor } from './SettingsFields';
import { BizMark } from './BizMark';
import { SAMPLE_LOGO, SEED_SHOP, week, type WeekHours } from './sms/settingsModel';

type Id = 'shop' | 'team' | 'services' | 'notifications';
const SECTIONS: SettingsSection<Id>[] = [
  { id: 'shop', label: 'Shop details', hint: 'Name, address, logo, hours', icon: Buildings },
  { id: 'team', label: 'Team', hint: 'Staff, roles and shifts', icon: Users },
  { id: 'services', label: 'Services & prices', hint: 'What you offer and charge', icon: Wrench },
  { id: 'notifications', label: 'Notifications', hint: 'Who is told what, and texts to customers', icon: Bell },
];

function Shell({ variant, state }: { variant: 'side' | 'list'; state: 'clean' | 'edited' | 'invalid' }) {
  const [cur, setCur] = useState<Id>('shop');
  const [logo, setLogo] = useState<string | null>(state === 'edited' ? SAMPLE_LOGO : null);
  const [hours, setHours] = useState<WeekHours>(state === 'invalid' ? week((d) => ({ open: d !== 'sun', from: '17:00', to: '08:00' })) : SEED_SHOP.hours);
  const dirty = state !== 'clean';
  return (
    <div className={variant === 'side' ? 'flex min-h-[640px] w-[960px] max-w-full border border-rule' : 'w-[390px] max-w-full border border-rule'}>
      <SettingsNav sections={SECTIONS} current={variant === 'side' ? cur : undefined} onSelect={setCur} variant={variant} />
      {variant === 'side' && (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 px-6">
            <Group first title="Logo" help="Shown on receipts and quotations.">
              <FileDropzone label="Business logo" value={logo} onChange={setLogo} placeholder={<BizMark />} />
            </Group>
            <Group title="Opening hours" help="Customers see these on the tracking page.">
              <WeekHoursEditor value={hours} onChange={setHours} />
            </Group>
          </div>
          <SaveBar dirty={dirty} problems={state === 'invalid' ? 6 : 0} onSave={() => {}} onDiscard={() => {}} />
        </div>
      )}
    </div>
  );
}

const meta: Meta<typeof Shell> = { title: 'Components/SMS/Settings shell', component: Shell, tags: ['autodocs'] };
export default meta;
type S = StoryObj<typeof Shell>;

export const Clean: S = { args: { variant: 'side', state: 'clean' } };
export const Edited: S = { args: { variant: 'side', state: 'edited' } };
export const Invalid: S = { args: { variant: 'side', state: 'invalid' } };
export const PhoneMenu: S = { name: 'Phone menu first', args: { variant: 'list', state: 'clean' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
