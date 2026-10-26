import type { Meta, StoryObj } from '@storybook/react';
import { DayBar, type DayBarProps } from './DayBar';

const h = (hh: number, mm = 0) => hh * 60 + mm;
const hours = { open: h(8), close: h(18) };

const meta: Meta<typeof DayBar> = {
  title: 'Components/Charts/DayBar',
  component: DayBar,
  tags: ['autodocs'],
  args: {
    hours,
    now: h(9, 12),
    marks: [
      { kind: 'due', at: h(10, 15), label: 'Leave by 10:15 AM', tone: 'bad' },
      { kind: 'deadline', at: h(11), label: 'Promised 11:00 AM' },
    ],
  },
  decorators: [(Story) => <div className="w-full max-w-[720px] bg-surface p-4"><Story /></div>],
  parameters: {
    docs: {
      description: {
        component: [
          'Day bar (C23): an SVG strip across the platform\'s business hours on the raised ground (18px, 4px radius) with hour ticks (every 1, 2 or 3 hours by width) and three kinds of mark: Now (circle), the due time (square, `tone="bad"` when urgent) and the deadline (diamond). Colour is never the only signal: each mark has its own shape and a label.',
          '',
          '- Labels sit beside their own line; a second row only when needed; below 520px of the bar\'s own width (measured, not the viewport) they shorten (`shortLabel`, default the time).',
          '- A mark before opening or after closing pins to that edge with an arrow. Overnight hours: `close <= open` means the next day.',
          '- Time is never read from the clock: pass `now` (minutes since midnight). Format with `formatTime` or `locale`.',
          '- Read as one image; the description lists the hours and every mark. `closed` shows a plain "Closed today" strip. The Now dot pulses only when motion is allowed.',
          '',
          '```tsx',
          "<DayBar hours={{ open: 480, close: 1080 }} now={552} marks={[{ kind: 'due', at: 615, label: 'Leave by 10:15 AM', tone: 'bad' }, { kind: 'deadline', at: 660, label: 'Promised 11:00 AM' }]} />",
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof DayBar>;

export const Playground: Story = {};
export const Calm: Story = { args: { marks: [{ kind: 'due', at: h(14), label: 'Order by 2:00 PM' }, { kind: 'deadline', at: h(16, 30), label: 'Promised 4:30 PM' }] } };
export const MarksClose: Story = { args: { now: h(9, 40), marks: [{ kind: 'due', at: h(9, 45), label: 'Order by 9:45 AM', tone: 'bad' }, { kind: 'deadline', at: h(9, 50), label: 'Promised 9:50 AM' }] } };
export const DueIsNow: Story = { args: { now: h(10), marks: [{ kind: 'due', at: h(10), label: 'Order by 10:00 AM', tone: 'bad' }] } };
export const NowNearOpen: Story = { args: { now: h(8, 5), marks: [{ kind: 'due', at: h(17, 55), label: 'Leave by 5:55 PM' }] } };
export const DueAfterClose: Story = { args: { now: h(16), marks: [{ kind: 'due', at: h(19, 30), label: 'Leave by 7:30 PM', tone: 'bad' }] } };
export const DueBeforeOpen: Story = { args: { now: h(9), marks: [{ kind: 'deadline', at: h(7), label: 'Promised 7:00 AM' }] } };
export const Overnight: Story = { args: { hours: { open: h(22), close: h(6) }, now: h(23, 30), marks: [{ kind: 'due', at: h(2), label: 'Leave by 2:00 AM' }] } };
export const Closed: Story = { args: { closed: true } };
export const LongLabels: Story = {
  args: { marks: [{ kind: 'due', at: h(10), label: 'Leave the workshop by 10:00 AM to reach the customer', tone: 'bad' }, { kind: 'deadline', at: h(10, 20), label: 'Promised to Mr. Dela Cruz for 10:20 AM sharp' }] },
};
export const Hours24: Story = { args: { formatTime: (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}` } };
export const Compact: Story = {
  render: (args: DayBarProps) => <div className="w-[360px]"><DayBar {...args} /></div>,
};
export const InRaisedWell: Story = {
  render: (args: DayBarProps) => <div className="bg-frame p-4"><DayBar {...args} className="mt-2" /></div>,
};
