import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Row, WizardBlock } from './WizardBlock';

const meta: Meta<typeof WizardBlock> = {
  title: 'Components/SMS/Wizard block',
  component: WizardBlock,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[720px] max-w-full"><Story /></div>],
};
export default meta;
type S = StoryObj<typeof WizardBlock>;

const rows = <dl><Row k="Customer" v="Maria Santos" /><Row k="Car" v="Toyota Vios 2018" /></dl>;

export const Open: S = { render: () => <WizardBlock id="customer" title="Customer and car" open>{rows}</WizardBlock> };
export const ReadOnly: S = { render: () => <WizardBlock id="customer" title="Customer and car" hint="Step 1" summary="Maria Santos" onEdit={() => {}}>{rows}</WizardBlock> };
export const Editing: S = { render: () => <WizardBlock id="customer" title="Customer and car" summary="Maria Santos" editing edit={<p className="text-ui">Controls go here.</p>} onDone={() => {}} onCancel={() => {}} /> };
export const Live: S = {
  render: () => {
    const [editing, setEditing] = useState(false);
    return <WizardBlock id="customer" title="Customer and car" editing={editing} onEdit={() => setEditing(true)} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} edit={<p className="text-ui">Controls go here.</p>}>{rows}</WizardBlock>;
  },
};
