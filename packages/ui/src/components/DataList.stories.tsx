import type { Meta, StoryObj } from '@storybook/react';
import { Buildings, Calendar } from '@phosphor-icons/react';
import { DataList } from './DataList';

const evidence = [
  { label: 'Invoice', value: 'INV-20418' },
  { label: 'Due', value: '28 Oct 2026', note: 'in 2 days' },
  { label: 'Amount', value: 'PHP 48,250.00' },
  { label: 'Supplier', value: 'Sunrise Groceries Trading Corp.' },
];

const meta: Meta<typeof DataList> = {
  title: 'Components/Data display/DataList',
  component: DataList,
  tags: ['autodocs'],
  args: { items: evidence },
  decorators: [
    (Story) => (
      <div className="max-w-[640px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'Key-value rows (C41, update): a `dl` in a `minmax(120px, 34%) | 1fr` grid at 13/20, 7px row padding with a top rule. The label (`dt`) is muted on one line with an ellipsis; the value (`dd`) is weight 500 and wraps, breaking inside long unbroken strings. An optional `note` sits at the right (muted, one line); `tone="bad"` colours the value and note. The list stacks when it is narrower than 600px, or always with `stacked`. Labels and values take phrasing content only.',
          '',
          'Used in the Home case evidence, the person Account tab and the platform General info facts.',
          '',
          'API change from the old `DataList`: the layout and type are new; `stacked` and `icon` are kept; `note` and `tone` are new. Values no longer truncate: they wrap.',
          '',
          '```tsx',
          "import { DataList } from '@readyph/ui';",
          '',
          '<DataList items={[',
          '  { label: "Invoice", value: "INV-20418" },',
          '  { label: "Due", value: "28 Oct 2026", note: "in 2 days", tone: "bad" },',
          ']} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof DataList>;

export const Playground: Story = {};

export const NoteAndBadTone: Story = {
  args: {
    items: [
      { label: 'Invoice', value: 'INV-20418' },
      { label: 'Due', value: '24 Oct 2026', note: '2 days overdue', tone: 'bad' },
      { label: 'Last paid', value: '12 Sep 2026', note: 'by bank transfer' },
      { label: 'Status', value: 'Unpaid', tone: 'bad' },
    ],
  },
};

export const WithIcons: Story = {
  args: {
    items: [
      { icon: Buildings, label: 'Company', value: 'Sunrise Groceries' },
      { icon: Calendar, label: 'Created', value: '12 Mar 2025' },
    ],
  },
};

export const LongValues: Story = {
  args: {
    items: [
      { label: 'A label that is far too long to fit on a single line here', value: 'Short' },
      { label: 'Reference', value: 'INV-20418-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' },
      { label: 'Notes', value: 'Paid in two parts after the supplier agreed to waive the late fee on the first invoice.', note: 'a very long right note that is cut with an ellipsis' },
    ],
  },
};

export const Stacked: Story = {
  args: { stacked: true },
  decorators: [(Story) => <div className="max-w-xs"><Story /></div>],
};

export const NarrowStacksItself: Story = {
  decorators: [(Story) => <div className="max-w-[360px]"><Story /></div>],
};

export const OnRaisedSurfaces: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <div className="rounded-card bg-surface p-pad"><DataList {...args} /></div>
      <div className="rounded-card bg-raised p-pad"><DataList {...args} /></div>
      <div className="rounded-card bg-raised-2 p-pad"><DataList {...args} /></div>
    </div>
  ),
};

export const BesideNote: Story = {
  render: (args) => (
    <div className="flex max-w-[640px] gap-4">
      <DataList {...args} />
      <p className="m-0 w-40 shrink-0 text-[13px] text-muted">Leda: this invoice is two days overdue.</p>
    </div>
  ),
};
