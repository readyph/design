import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TeamSection } from './TeamSection';
import { SEED_STAFF, STRESS_STAFF, LONG_STAFF, type Staff } from './sms/settingsModel';

function Demo({ staff: seed, initialOpen, phone }: { staff: Staff[]; initialOpen?: 'edit' | 'add' | null; phone?: boolean }) {
  const [staff, setStaff] = useState<Staff[]>(seed);
  return <div className="h-[640px]"><TeamSection staff={staff} onChange={setStaff} initialOpen={initialOpen} phone={!!phone} /></div>;
}

const meta: Meta<typeof Demo> = { title: 'Components/SMS/Team section', component: Demo, tags: ['autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type S = StoryObj<typeof Demo>;

export const Default: S = { args: { staff: SEED_STAFF } };
export const Staff40: S = { name: '40 staff (infinite list)', args: { staff: STRESS_STAFF } };
export const LongNames: S = { args: { staff: LONG_STAFF } };
export const Empty: S = { args: { staff: [] } };
export const EditStaff: S = { name: 'Edit staff', args: { staff: SEED_STAFF, initialOpen: 'edit' } };
export const AddStaff: S = { name: 'Add staff', args: { staff: SEED_STAFF, initialOpen: 'add' } };
export const Phone: S = { args: { staff: SEED_STAFF, phone: true }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
