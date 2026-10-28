import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Alarm, ArrowSquareOut, Check, CheckCircle, ChartLineDown, Timer, Truck, Warning, WarningCircle } from '@phosphor-icons/react';
import { ChipId, ChipSub, ChipTime, ChipWord, DayTimeline, DayTimelinePhone, type DayTimelineLane, type DayTimelineProps } from './DayTimeline';
import { StockRunway } from './StockRunway';

const h = (hh: number, mm = 0) => hh * 60 + mm;
const hours = { open: h(8), close: h(18) };
const now = h(9, 12);
const xt = (t: number) => ((t - hours.open) / (hours.close - hours.open)) * 100;
const noop = () => {};

/* Story values only (the workshop builds them from DATA decisions, jobs and purchase orders in home.js). */
const decide: DayTimelineLane = {
  id: 'decide', icon: <Alarm size={18} />, title: 'To do by', sub: 'deadlines',
  marks: [
    { id: 'd1', x: xt(h(10)), tone: 'bad', chip: { onSelect: noop, 'aria-label': 'Order by 10:00: Oil filters run out', tip: 'Oil filters run out<br>Click to open ›', children: <><ChipTime>10:00</ChipTime><span>Order</span></> } },
    { id: 'd2', x: xt(h(14)), tone: 'wait', chip: { onSelect: noop, children: <><ChipTime>14:00</ChipTime><span>Approve</span><ChipSub>· your manager</ChipSub></> } },
    { id: 'd3', x: xt(h(16)), chip: { onSelect: noop, children: <><ChipTime>16:00</ChipTime><span>Count</span></> } },
  ],
};
const stockIn: DayTimelineLane = {
  id: 'in', icon: <Truck size={18} />, title: 'Stock in', sub: 'deliveries today',
  carry: [{ id: 'c1', tone: 'bad', icon: <WarningCircle size={13} />, onSelect: noop, 'aria-label': 'PO-0221 arrived short 6', children: <><ChipId>PO-0221</ChipId><ChipWord>short 6</ChipWord></> }],
  marks: [
    { id: 'i1', x: xt(h(11)), tone: 'info', chip: { onSelect: noop, children: <><ChipId>PO-0225</ChipId><span>arriving 11:00</span></> } },
    { id: 'i2', x: xt(h(14)), tone: 'draft', chip: { onSelect: noop, children: <><ChipId>PO-0224</ChipId><span>if sent, 14:00</span></> } },
  ],
  later: { label: 'Later', chips: [{ id: 'l1', tone: 'info', onSelect: noop, children: <><ChipId>PO-0226</ChipId><ChipSub>Fri</ChipSub></> }] },
};
const stockOut: DayTimelineLane = {
  id: 'out', icon: <ArrowSquareOut size={18} />, title: 'Stock out', sub: 'jobs and transfers',
  pastOut: { id: 'p', count: 4, word: 'out', onSelect: noop, 'aria-label': '4 movements already out today', tip: 'Already out today<br>Click to see Stock moved ›', children: null },
  marks: [
    { id: 'o1', x: xt(h(11)), chip: { onSelect: noop, children: <><ChipId>JO-0412</ChipId><ChipSub>Makati</ChipSub></> } },
    { id: 'o2', x: xt(h(14, 30)), tone: 'bad', chip: { onSelect: noop, children: <><ChipId>JO-0417</ChipId><ChipWord>short</ChipWord></> } },
  ],
};
const expiring: DayTimelineLane = {
  id: 'exp', icon: <Timer size={18} />, title: 'Expiring', sub: 'by close',
  marks: [{ id: 'e1', x: xt(h(17)), tone: 'exp', chip: { onSelect: noop, icon: <Timer size={13} />, children: <><ChipTime>6</ChipTime><span>Fresh milk</span></> } }],
};
const run: DayTimelineLane = {
  id: 'run', icon: <ChartLineDown size={18} />, title: 'Stock left', sub: 'Oil filter OF-0107', runway: (
    <StockRunway name="Oil filter" hours={hours} now={now} points={[{ t: h(8), v: 14, kind: 'start' }, { t: h(11), v: 6, kind: 'job', ref: 'JO-0412' }, { t: h(14, 30), v: -3, kind: 'job', ref: 'JO-0417', short: true }]} caption="Projected from booked jobs, as of 9:12 AM" />
  ),
};

const base: DayTimelineProps = { subtitle: '8:00-18:00 · as of 9:12', legend: true, hours, now, nowLabel: 'Now 9:12', lanes: [decide, stockIn, stockOut, expiring, run] };

const meta: Meta<typeof DayTimeline> = {
  title: 'Components/Charts/DayTimeline',
  component: DayTimeline,
  tags: ['autodocs'],
  args: base,
  decorators: [(Story) => <div className="w-full max-w-[1330px] bg-surface p-4"><Story /></div>],
  parameters: { docs: { description: { component: 'Day timeline (I6): lanes on a time axis. Only chips open something. Story values only.' } } },
};
export default meta;
type Story = StoryObj<typeof DayTimeline>;

export const Live: Story = {};
export const Quiet: Story = { args: { lanes: [
  { ...decide, marks: [], note: { text: 'No deadlines today.', icon: <CheckCircle size={14} />, tone: 'ok' } },
  { ...stockIn, marks: [], carry: [], later: undefined, note: { text: 'Nothing due in.' } },
  { ...stockOut, pastOut: undefined, marks: [], note: { text: 'Nothing booked to go out' } },
  run,
] } };
export const Empty: Story = { args: { legend: false, lanes: [
  { ...decide, marks: [], note: { text: 'Nothing to do until there is stock.' } },
  { ...stockIn, marks: [], carry: [], later: undefined, note: { text: 'No suppliers yet.' } },
  { ...stockOut, pastOut: undefined, marks: [], note: { text: 'Nothing goes out until there is stock.' } },
] } };
export const ErrorLane: Story = { args: { lanes: [decide, { ...stockIn, marks: [], carry: [], later: undefined, note: { text: "Couldn't load deliveries. Last loaded 9:05.", icon: <WarningCircle size={14} />, tone: 'bad' } }, stockOut, run] } };
export const Degraded: Story = { args: { lanes: [decide, stockIn, { ...stockOut, dimmed: true, sub: undefined, warn: <><Warning size={12} />slow since 8:50</>, title: 'Jobs' }, run] } };
export const ClerkRole: Story = { args: { lanes: [{ ...decide, sub: 'Your manager decides', marks: decide.marks!.map((m) => ({ ...m, tone: 'wait' as const })) }, stockIn, stockOut, run] } };
export const Loading: Story = { args: { state: 'loading', legend: false } };
const dx = (k: number) => (k / 7) * 100;
export const Week: Story = { args: {
  nowX: dx(0) + 4, legend: false, subtitle: 'today and the next 6 days · as of 9:12',
  axisLabels: ['Today', 'Thu 22', 'Fri 23', 'Sat 24', 'Sun, closed', 'Mon 26', 'Tue 27'].map((label, k) => ({ x: dx(k), label })),
  dayLines: [1, 2, 3, 4, 5, 6].map(dx),
  lanes: [
    { ...decide, marks: [{ id: 'w1', x: dx(0) + 7, chip: { onSelect: noop, children: <><ChipTime>2</ChipTime><span>to do today</span></> } }] },
    { ...stockIn, carry: undefined, later: undefined, marks: [{ id: 'w2', x: dx(3) + 5, tone: 'draft', chip: { onSelect: noop, children: <><ChipId>PO-0224</ChipId><ChipSub>not sent · 20</ChipSub></> } }] },
    { ...stockOut, pastOut: undefined, marks: [{ id: 'w3', x: dx(0) + 7, info: <><b>3</b> jobs today</> }] },
  ] } };
export const Narrow: Story = { decorators: [(Story) => <div className="w-[760px] bg-surface p-4"><Story /></div>] };

const rows = [
  { id: 'r1', time: '11:00', icon: <ArrowSquareOut size={18} />, title: <><ChipId>JO-0412</ChipId> · Makati</>, sub: 'Out: 2 OF-107', onSelect: noop },
  { id: 'r2', time: '14:30', icon: <ArrowSquareOut size={18} />, title: <><ChipId>JO-0417</ChipId> · Cubao</>, sub: 'Out: 4 OF-107 · short, none left', short: true, onSelect: noop },
  { id: 'r3', time: '11:00', icon: <Truck size={18} />, title: <><ChipId>PO-0225</ChipId> · Petron Direct</>, sub: 'In: 24 units · arriving', onSelect: noop },
  { id: 'r4', time: '14:00', icon: <Truck size={18} />, title: <><ChipId>PO-0224</ChipId> · Petron Direct</>, sub: 'In: 12 units · only if sent by 12:00', onSelect: noop },
  { id: 'r5', time: '16:00', icon: <Truck size={18} />, title: <><ChipId>PO-0227</ChipId> · Shell</>, sub: 'In: 6 units · arriving', onSelect: noop },
];
const earlierRows = [{ id: 'm1', time: '8:40', icon: <ArrowSquareOut size={18} />, title: 'Oil filter', sub: 'Out: 2 · MV-1 · Ana' }];
function Phone(args: { loading?: boolean; none?: boolean }) {
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div className="w-[390px] bg-surface p-4">
      <DayTimelinePhone state={args.loading ? 'loading' : 'ready'} nowLabel="Now 9:12" rows={args.none ? [] : rows} expanded={all} onToggleExpanded={() => setAll(!all)}
        emptyIcon={<Check size={18} />} earlier={{ count: 4, rows: earlierRows, open, onToggle: () => setOpen(!open) }}
        carryRows={args.none ? [] : [{ id: 'cr', time: 'Yday', icon: <WarningCircle size={18} />, title: <><ChipId>PO-0221</ChipId> · short 6</>, sub: 'In: arrived short · settle it', short: true, onSelect: noop }]} />
    </div>
  );
}
export const PhoneList: StoryObj = { render: () => <Phone />, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const PhoneEmpty: StoryObj = { render: () => <Phone none /> };
export const PhoneLoading: StoryObj = { render: () => <Phone loading /> };
