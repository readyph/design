import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WeekCalendar, type WeekCalendarProps } from './WeekCalendar';
import { addDays } from './sms/scheduleModel';
import { calItems, weekDays } from './sms/calendarSample';

const noop = () => {};
const base: WeekCalendarProps = { days: weekDays('2026-11-04'), items: calItems, onOpen: noop, onBook: noop };

const meta = {
  title: 'SMS/WeekCalendar',
  component: WeekCalendar,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-[720px] flex-col bg-surface"><Story /></div>],
  args: base,
} satisfies Meta<typeof WeekCalendar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Wed 4 Nov is full: overlapping services split the day column into 3 lanes. */
export const ThreeLaneDay: Story = { args: { days: ['2026-11-04'] } };
export const ThreeDays: Story = { args: { days: ['2026-11-03', '2026-11-04', '2026-11-05'] } };
export const Week: Story = {};
export const ClosedDay: Story = { args: { days: weekDays('2026-11-09').map((d) => addDays(d, -1)) } };
export const VacantSlotHover: Story = { args: { days: ['2026-11-05'], demoHover: { date: '2026-11-05', start: 11 * 60 } } };
export const DragSelection: Story = { args: { days: ['2026-11-05'], demoSelect: { date: '2026-11-05', start: 11 * 60, dur: 90 } } };
export const HeldSlot: Story = { args: { days: ['2026-11-05'], held: { date: '2026-11-05', start: 11 * 60, dur: 60 } } };
export const OneMechanic: Story = { args: { days: ['2026-11-04'], mechanicId: 'm-jun', freeLabel: () => '2h free' } };
export const NeedsOnly: Story = { args: { needsOnly: true } };
export const Empty: Story = { args: { items: [], days: ['2026-11-05'] } };
export const Loading: Story = { args: { state: 'loading' } };
export const Phone: Story = { args: { days: ['2026-11-04'], phone: true }, parameters: { viewport: { defaultViewport: 'mobile1' } } };

export const Interactive: Story = {
  render: (args) => {
    const [sel, setSel] = useState<string | null>(null);
    return <WeekCalendar {...args} selectedId={sel} onOpen={(j) => setSel(j.id)} onPickDay={(d) => setSel(d)} />;
  },
};
