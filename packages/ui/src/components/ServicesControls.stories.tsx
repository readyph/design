import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchBox, ToggleChip } from './ServicesControls';

const meta = { title: 'Components/SMS/ServicesControls', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Search: Story = {
  render: () => {
    const [q, setQ] = useState('');
    return <div className="max-w-sm"><SearchBox value={q} onChange={setQ} /></div>;
  },
};
export const Chips: Story = {
  render: () => {
    const [on, setOn] = useState(true);
    return <div className="flex gap-2"><ToggleChip pressed={on} onChange={setOn}>Needs you</ToggleChip><ToggleChip pressed={false} onChange={() => {}}>Overdue</ToggleChip></div>;
  },
};
