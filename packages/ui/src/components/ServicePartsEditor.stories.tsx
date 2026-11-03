import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ServicePartsEditor } from './ServicePartsEditor';
import { typeById, type ServicePart } from './sms/catalogue';

const meta: Meta<typeof ServicePartsEditor> = {
  title: 'Components/SMS/Service parts editor',
  component: ServicePartsEditor,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[560px] max-w-full"><Story /></div>],
  render: (args) => {
    const [parts, setParts] = useState<ServicePart[]>(args.parts);
    return <ServicePartsEditor parts={parts} onChange={setParts} />;
  },
};
export default meta;
type S = StoryObj<typeof ServicePartsEditor>;

export const LabourOnly: S = { name: 'No parts (labour only)', args: { parts: [], onChange: () => {} } };
export const WithParts: S = { args: { parts: typeById('sv01')!.parts!, onChange: () => {} } };
export const OutOfStock: S = { name: 'Out of stock and on order', args: { parts: [{ productId: 'pr04', qty: 1 }, { productId: 'pr05', qty: 1 }, { productId: 'pr03', qty: 1 }], onChange: () => {} } };
