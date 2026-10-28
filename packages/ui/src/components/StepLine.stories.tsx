import type { Meta, StoryObj } from '@storybook/react';
import { StepLine } from './StepLine';

const pts = [{ t: 480, v: 12 }, { t: 600, v: 8 }, { t: 720, v: 5 }, { t: 840, v: 14, kind: 'del' }, { t: 960, v: 9 }];
const short = [{ t: 480, v: 6 }, { t: 600, v: 3 }, { t: 720, v: 0 }, { t: 900, v: -4 }];

const meta: Meta<typeof StepLine> = {
  title: 'Components/Inventory/StepLine',
  component: StepLine,
  tags: ['autodocs'],
  args: { points: pts, now: 650, open: 480, close: 1020, end: 9, 'aria-label': 'Flour: 8:00 12, 10:00 8, 12:00 5, 2:00 14, 4:00 9.' },
  parameters: { docs: { description: { component: 'Phone inline runway step line (RDY-471). Props-driven: no model dependency. Source: inventory-home FINAL home.js 606-612.' } } },
};
export default meta;
type Story = StoryObj<typeof StepLine>;

export const Default: Story = {};

export const Short: Story = {
  args: { points: short, end: -4, 'aria-label': 'Flour: 8:00 6, 10:00 3, 12:00 0, 3:00 -4. Short for PO-12.' },
};

export const PhoneWidth: Story = {
  args: { width: 280, height: 44 },
  render: (args) => <div className="pr-10"><StepLine {...args} /></div>,
};
