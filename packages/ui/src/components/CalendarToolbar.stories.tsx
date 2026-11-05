import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { CalendarToolbar, SPAN_DAYS, type Span } from './CalendarToolbar';
import { addDays, calMechanicOptions, weekStart } from './sms/scheduleModel';
import { futureJobs } from './sms/scheduleData';

const noop = () => {};
const meta = {
  title: 'Components/SMS/CalendarToolbar',
  component: CalendarToolbar,
  parameters: { layout: 'fullscreen' },
  args: { days: ['2026-11-02', '2026-11-03', '2026-11-04'], span: '3day', onSpan: noop, onPrev: noop, onNext: noop, onToday: noop, onJump: noop, q: '', onQ: noop, mechanic: 'any', mechanicOptions: calMechanicOptions(), onMechanic: noop, needsCount: 4 },
} satisfies Meta<typeof CalendarToolbar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NeedsYouOn: Story = { args: { needsOnly: true, onNeedsOnly: noop } };
export const Unscheduled: Story = { args: { unscheduled: futureJobs.slice(0, 2), onOpen: noop, onNeedsOnly: noop } };
export const BackToRange: Story = { args: { days: ['2026-11-04'], span: 'day', backLabel: 'Back to week', onBack: noop } };

export const Interactive: Story = {
  render: (args) => {
    const [span, setSpan] = useState<Span>('week');
    const [anchor, setAnchor] = useState('2026-11-02');
    const [q, setQ] = useState('');
    const [mechanic, setMechanic] = useState('any');
    const n = SPAN_DAYS[span];
    const days = span === 'week' ? Array.from({ length: 7 }, (_, i) => addDays(weekStart(anchor), i)) : Array.from({ length: n }, (_, i) => addDays(anchor, i));
    return <CalendarToolbar {...args} days={days} span={span} onSpan={setSpan} onPrev={() => setAnchor(addDays(anchor, -n))} onNext={() => setAnchor(addDays(anchor, n))} onToday={() => setAnchor('2026-11-02')} onJump={setAnchor} q={q} onQ={setQ} mechanic={mechanic} onMechanic={setMechanic} />;
  },
};
