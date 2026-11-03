import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ShopDetailsSection } from './ShopDetailsSection';
import { NEW_SHOP, SAMPLE_LOGO, SEED_SHOP, validateShop, week, type ShopDetails } from './sms/settingsModel';

function Live({ initial, showErrors }: { initial: ShopDetails; showErrors: boolean }) {
  const [v, setV] = useState(initial);
  return <ShopDetailsSection value={v} onChange={setV} errors={validateShop(v)} showErrors={showErrors} />;
}

const meta: Meta<typeof Live> = { title: 'Components/SMS/Shop details section', component: Live, tags: ['autodocs'], args: { showErrors: false } };
export default meta;
type S = StoryObj<typeof Live>;

export const NewShop: S = { name: 'New shop', args: { initial: NEW_SHOP } };
export const Filled: S = { args: { initial: SEED_SHOP } };
export const LogoUploaded: S = { name: 'Logo uploaded', args: { initial: { ...SEED_SHOP, logo: SAMPLE_LOGO } } };
export const Invalid: S = { args: { initial: { ...NEW_SHOP, tin: '12', hours: week((d) => ({ open: d !== 'sun', from: '17:00', to: '08:00' })) }, showErrors: true } };
export const Phone: S = { name: 'Phone', args: { initial: SEED_SHOP }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
