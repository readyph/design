import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CarFields } from './CarFields';
import { blankCar, carToDraft, type CarDraft } from './sms/customersModel';
import { customers } from './sms/data';

const meta: Meta<typeof CarFields> = {
  title: 'Components/Forms/Car fields',
  component: CarFields,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[520px] max-w-full"><Story /></div>],
};
export default meta;
type S = StoryObj<typeof CarFields>;

function Host({ start, compact, twin }: { start: CarDraft; compact?: boolean; twin?: boolean }) {
  const [car, setCar] = useState(start);
  return <CarFields car={car} compact={compact} onChange={(p) => setCar((x) => ({ ...x, ...p }))} onOpenTwin={twin ? () => {} : undefined} />;
}

export const Empty: S = { render: () => <Host start={blankCar()} /> };
export const Filled: S = { render: () => <Host start={carToDraft(customers[0]!.vehicles[0]!)} /> };
export const Compact: S = { render: () => <Host start={carToDraft(customers[0]!.vehicles[1]!)} compact /> };
export const DuplicatePlate: S = { name: 'Duplicate plate', render: () => <Host start={{ ...blankCar('NBC 4521'), make: 'Toyota', model: 'Vios', year: '2016' }} twin /> };
