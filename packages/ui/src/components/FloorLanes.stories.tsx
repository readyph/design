import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FloorLanes } from './sms/FloorLanes';
import { jobs, type Job } from './sms/data';
import { applyOverrides, lanesFor, type LaneId } from './sms/floorModel';

const meta: Meta<typeof FloorLanes> = {
  title: 'Components/Data/Floor lanes',
  component: FloorLanes,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-[640px] flex-col"><Story /></div>],
  args: { lanes: lanesFor(jobs), onSelect: () => {}, onMove: () => {} },
};
export default meta;
type S = StoryObj<typeof FloorLanes>;

/** Now line at 10:20, the "No time" well and stuck flags (warn background, red border) come from the sample jobs. */
export const NowLine: S = {};
export const Selected: S = { args: { selectedId: 'j0412' } };
export const BeforeOpening: S = { args: { now: 7 * 60 } };
export const AfterClosing: S = { args: { now: 19 * 60 } };
export const Loading: S = { args: { state: 'loading' } };

/** Drag a chip to another lane, or use the "Move to..." menu on its handle. */
export const Drag: S = {
  render: (args) => {
    const [ov, setOv] = useState<Record<string, { assigneeId: string }>>({});
    const move = (job: Job, to: LaneId) => setOv((o) => ({ ...o, [job.id]: { assigneeId: to } }));
    return <FloorLanes {...args} lanes={lanesFor(applyOverrides(ov, jobs))} onMove={move} />;
  },
};
