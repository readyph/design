import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Rows, SquaresFour } from '@phosphor-icons/react';
import { SegmentedControl } from './SegmentedControl';

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/Navigation/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Segmented control (C39): raised-2 track, 2px padding, 5px radius; 28px segments, 13px text; the selected segment is surface + border + weight 500. Optional counts and icons. Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).',
          '',
          '`semantics`: `pressed` (default, `group` of `aria-pressed` buttons), `radio` (`radiogroup`, `aria-checked`, roving tabindex, arrow/Home/End keys) or `menu` (`menuitemradio`, for the theme row in the account menu; 36px on phone).',
          '',
          '```tsx',
          "import { SegmentedControl } from '@readyph/ui';",
          '',
          '<SegmentedControl',
          '  aria-label="Show"',
          '  value={filter}',
          '  onChange={setFilter}',
          '  options={[{ value: "all", label: "All", count: 12 }, { value: "on", label: "On", count: 8 }]}',
          '/>',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof SegmentedControl>;

const filters = [
  { value: 'all', label: 'All', count: 24 },
  { value: 'on', label: 'On', count: 18 },
  { value: 'off', label: 'Off', count: 4 },
  { value: 'custom', label: 'Custom', count: 2 },
];

export const Counts: Story = {
  render: function Example() {
    const [v, setV] = useState('all');
    return <SegmentedControl aria-label="Show" value={v} onChange={setV} options={filters} />;
  },
};

export const ListGrid: Story = {
  render: function Example() {
    const [v, setV] = useState('list');
    return (
      <SegmentedControl
        aria-label="Layout"
        value={v}
        onChange={setV}
        options={[
          { value: 'list', label: 'List', icon: Rows },
          { value: 'grid', label: 'Grid', icon: SquaresFour },
        ]}
      />
    );
  },
};

export const ThemeInMenu: Story = {
  render: () => (
    <div role="menu" aria-label="Appearance" className="inline-block">
      <SegmentedControl
        semantics="menu"
        aria-label="Theme"
        defaultValue="system"
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ]}
      />
    </div>
  ),
};

export const RadioKeyboard: Story = {
  render: () => <SegmentedControl semantics="radio" aria-label="Category" options={[{ value: 'all', label: 'All' }, { value: 'ops', label: 'Operations' }, { value: 'sales', label: 'Sales' }, { value: 'fin', label: 'Finance' }]} />,
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <SegmentedControl aria-label="Some off" options={[{ value: 'a', label: 'Day' }, { value: 'b', label: 'Week' }, { value: 'c', label: 'Month', disabled: true }]} />
      <SegmentedControl aria-label="All off" disabled options={filters} />
    </div>
  ),
};

export const RadioWithDisabled: Story = {
  render: () => (
    <SegmentedControl
      semantics="radio"
      aria-label="Range"
      defaultValue="day"
      options={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week', disabled: true },
        { value: 'month', label: 'Month' },
      ]}
    />
  ),
};

export const Small: Story = {
  render: () => <SegmentedControl size="sm" aria-label="Range" options={[{ value: 'd', label: 'Day' }, { value: 'w', label: 'Week' }]} />,
};
