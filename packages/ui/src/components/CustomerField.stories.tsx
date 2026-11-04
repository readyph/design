import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CustomerField } from './CustomerField';
import { WizardBlock } from './WizardBlock';
import { customers, type Customer } from './sms/data';

const meta: Meta<typeof CustomerField> = {
  title: 'Components/Forms/Customer field',
  component: CustomerField,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="min-h-[440px] w-[720px] max-w-full"><Story /></div>],
};
export default meta;
type S = StoryObj<typeof CustomerField>;

function Host({ initialQuery = '', start = null, vehicleId = '' }: { initialQuery?: string; start?: Customer | null; vehicleId?: string }) {
  const [c, setC] = useState<Customer | null>(start);
  const [v, setV] = useState(vehicleId);
  return (
    <WizardBlock id="customer" title="Customer and car" open>
      <CustomerField key={c ? 'picked' : 'find'} customer={c} vehicleId={v} initialQuery={initialQuery} onPick={(next, vid) => { setC(next); setV(vid); }} onClear={() => { setC(null); setV(''); }} />
    </WizardBlock>
  );
}

export const Lookup: S = { render: () => <Host /> };
export const NoMatchToNewCustomer: S = { name: 'No match to new customer', render: () => <Host initialQuery="Lorna Bautista" /> };
export const TwoCars: S = { name: 'Two cars', render: () => <Host start={customers[0]!} vehicleId="v01" /> };
export const OneCar: S = { name: 'One car', render: () => <Host start={customers[2]!} vehicleId="v03" /> };
const noCar: Customer = { id: 'c-nocar', name: 'Zztest Customer 1', phone: '0917 000 1111', since: '2026-11-01', vehicles: [] };
/** A customer with no vehicles still shows in search ("No car yet") and can be picked. */
export const NoCarYet: S = { name: 'No car yet', render: () => { if (!customers.includes(noCar)) customers.push(noCar); return <Host initialQuery="Zztest" />; } };
export const PickedNoCar: S = { name: 'Picked, no car', render: () => <Host start={noCar} /> };
