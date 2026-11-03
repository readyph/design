import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Combobox, type ComboOption } from './Combobox';

const all: ComboOption[] = ['Maria Santos', 'Jose Reyes', 'Ana Cruz', 'Ramon Bautista'].map((n) => ({ id: n, label: n, node: <span>{n}</span> }));

function Demo({ search, minChars, withAction, empty }: { search?: boolean; minChars?: number; withAction?: boolean; empty?: boolean }) {
  const [q, setQ] = useState(empty ? 'zzz' : '');
  const options = all.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <Combobox label="Customer" value={q} onValueChange={setQ} options={options} onSelect={(id) => setQ(id)} search={search} minChars={minChars}
      placeholder="Search customers" hint="Type a name or number." heading="Recent customers"
      action={withAction ? { id: 'new', label: 'Add new customer', node: <span>+ Add new customer</span>, onSelect: () => {} } : null} />
  );
}

const meta: Meta<typeof Combobox> = {
  title: 'Components/Forms/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="h-[360px] w-[360px] max-w-full"><Story /></div>],
};
export default meta;
type S = StoryObj<typeof Combobox>;

export const Default: S = { render: () => <Demo /> };
export const WithSearchIcon: S = { render: () => <Demo search /> };
export const WithAction: S = { render: () => <Demo withAction /> };
export const MinChars: S = { render: () => <Demo minChars={2} /> };
export const NoMatch: S = { render: () => <Demo empty /> };
