import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TextField } from './TextField';

const meta: Meta<typeof TextField> = {
  title: 'Components/Forms/Text field',
  component: TextField,
  tags: ['autodocs'],
  parameters: { docs: { description: { component: 'Labelled text box (workshop `.field`). Focus draws the accent outline (2px, 1px offset) and an accent border. Hint or error sits 6px under the box.' } } },
  render: (args) => {
    const [v, setV] = useState(String(args.value));
    return <div className="max-w-[360px]"><TextField {...args} value={v} onChange={setV} /></div>;
  },
};
export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = { args: { id: 'tf-name', label: 'Name', value: 'Dela Cruz Auto Works', hint: 'Give this a clear name, like a branch name.' } };
export const WithError: Story = { args: { id: 'tf-err', label: 'Name', value: '', error: 'Give it a name.', required: true } };
export const WithUnit: Story = { args: { id: 'tf-unit', label: 'Delay', value: '15', unit: 'minutes', type: 'number' } };
