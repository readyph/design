import type { Meta, StoryObj } from '@storybook/react';
import { StockRunway, type StockRunwayProps, type StockRunwayPoint } from './StockRunway';

const h = (hh: number, mm = 0) => hh * 60 + mm;
const hours = { open: h(8), close: h(18) };
const now = h(9, 12);
// Story values only (the workshop computes them from DATA.projection, jobs and POs).
const points: StockRunwayPoint[] = [
  { t: h(8), v: 14, kind: 'start' },
  { t: h(8, 40), v: 12, kind: 'moved', ref: 'MV-1' },
  { t: h(11), v: 6, kind: 'job', ref: 'JO-0412' },
  { t: h(14, 30), v: -3, kind: 'job', ref: 'JO-0417', short: true },
];
const days = ['today', 'Thu 22', 'Fri 23', 'Sat 24', 'Sun 25', 'Mon 26', 'Tue 27'].map((label) => ({ label, width: label === 'Sun 25' ? 0.45 : 1 }));
const week = {
  days,
  points: [{ k: 0, t: now, v: 12 }, { k: 0, t: h(18), v: 4 }, { k: 1, t: h(8), v: 4 }, { k: 1, t: h(13), v: 0 }, { k: 1, t: h(18), v: 0 }, { k: 2, t: h(18), v: 0 }, { k: 3, t: h(18), v: 0 }, { k: 4, t: h(18), v: 0 }, { k: 5, t: h(18), v: 0 }, { k: 6, t: h(18), v: 0 }],
  deliveries: [{ k: 3, t: h(10), v: 20, q: 20, no: 'PO-0224', draft: true }],
  outs: [{ k: 1, t: h(13) }],
  bands: [{ k0: 1, t0: h(13), k1: 6, t1: h(18) }],
  end: 0,
  caption: 'Projected at about 20 a day, plus ordered deliveries, as of 9:12 AM',
};

const meta: Meta<typeof StockRunway> = {
  title: 'Components/Charts/StockRunway',
  component: StockRunway,
  tags: ['autodocs'],
  args: { name: 'Oil filter', hours, now, points, caption: 'Projected from booked jobs, as of 9:12 AM' },
  decorators: [(Story) => <div className="w-full max-w-[720px] bg-surface p-4"><Story /></div>],
  parameters: { docs: { description: { component: 'Stock runway (I5): step chart of on-hand through today\'s booked jobs and deliveries, or the week. Read as one image; pass the same clock your page uses.' } } },
};
export default meta;
type Story = StoryObj<typeof StockRunway>;

export const WithoutDraftPO: Story = {};
export const WithDraftPO: Story = { args: { alt: { no: 'PO-0224', left: 60, at: h(14) } } satisfies Partial<StockRunwayProps> };
export const RatePart: Story = { args: { points: [{ t: h(8), v: 9, kind: 'start' }], rate: { vNow: 8, tz: h(14, 48), end: 0 }, caption: 'Projected at about 20 a day, as of 9:12 AM' } };
export const Week: Story = { args: { week } };
export const Loading: Story = { args: { state: 'loading' } };
export const Empty: Story = { args: { state: 'empty' } };
export const Phone: Story = { args: { alt: { no: 'PO-0224', left: 60, at: h(14) } }, decorators: [(Story) => <div className="w-[390px] bg-surface p-4"><Story /></div>] };

// Lane-embedded day (RDY-445): 128px lane height, full width. Story values only.
const laneDecorator = (Story: () => JSX.Element) => <div className="w-full max-w-[960px] bg-surface"><Story /></div>;
const lanePO = { no: 'PO-0224', left: 60, at: h(14), points: [...points.slice(0, 3), { t: h(14), v: 66, kind: 'del' as const, ref: 'PO-0224', d: 60 }, { t: h(14, 30), v: 60, kind: 'job' as const, ref: 'JO-0417' }] };
export const LaneDay: Story = { args: { variant: 'lane', points: points.slice(0, 3).concat([{ t: h(14, 30), v: 3, kind: 'job', ref: 'JO-0417' }]) }, decorators: [laneDecorator] };
export const LaneShort: Story = { args: { variant: 'lane' }, decorators: [laneDecorator] };
export const LaneShortWithFix: Story = { args: { variant: 'lane', endAction: <button type="button" className="rounded-chip border border-rule px-2 text-small">Fix</button> }, decorators: [laneDecorator] };
export const LaneWithDraftPO: Story = { args: { variant: 'lane', alt: lanePO }, decorators: [laneDecorator] };
export const LaneWithSentPO: Story = { args: { variant: 'lane', confirmed: true, points: lanePO.points }, decorators: [laneDecorator] };
export const LaneRate: Story = { args: { variant: 'lane', points: [{ t: h(8), v: 9, kind: 'start' }], rate: { vNow: 8, tz: h(14, 48), end: 0 }, laterLabel: 'PO-0231: +40 Thu 22 8:30', caption: 'Projected at about 20 a day, as of 9:12 AM' }, decorators: [laneDecorator] };
export const LaneLoading: Story = { args: { variant: 'lane', state: 'loading' }, decorators: [laneDecorator] };
export const LaneEmpty: Story = { args: { variant: 'lane', state: 'empty' }, decorators: [laneDecorator] };
