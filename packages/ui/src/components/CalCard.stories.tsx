import type { Meta, StoryObj } from '@storybook/react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { CalCard } from './CalCard';
import { packDay } from './sms/scheduleModel';
import { calItems } from './sms/calendarSample';

const noop = () => {};
const placeOf = (id: string, dur: number) => {
  const it = calItems.find((i) => i.job.id === id)!;
  return packDay([{ ...it, end: it.start + dur }]).placed[0]!;
};

const meta = {
  title: 'SMS/CalCard',
  component: CalCard,
  decorators: [(Story) => <RadixTooltip.Provider><div className="relative h-[300px] w-[224px] bg-surface"><Story /></div></RadixTooltip.Provider>],
  args: { selected: false, flash: false, dim: false, showMech: true, onOpen: noop, placed: placeOf('f06', 60) },
} satisfies Meta<typeof CalCard>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The card degrades by height: 30 min shows identity only. */
export const Min30: Story = { args: { placed: placeOf('f06', 30) } };
export const Min45: Story = { args: { placed: placeOf('f06', 45) } };
export const Min60: Story = {};
export const Min120: Story = { args: { placed: placeOf('f06', 120) } };
export const Selected: Story = { args: { selected: true } };
export const Dimmed: Story = { args: { dim: true } };
export const Unassigned: Story = { args: { placed: placeOf('f05', 60) } };
