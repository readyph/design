import type { Meta, StoryObj } from '@storybook/react';
import { JobRow } from './JobRow';
import { branch, jobs, mechanics } from './sms/data';
import { todayEnv, viewOf } from './sms/floorModel';
import { PartChip } from './PartChip';
import { productOf } from './sms/data';

const job = jobs.find((j) => j.id === 'j0412')!;

const meta: Meta<typeof JobRow> = {
  title: 'Components/SMS/Job row',
  component: JobRow,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[960px] max-w-full"><Story /></div>],
  args: { job, env: todayEnv, view: viewOf(job), mechanics, onOpen: () => {}, onAction: () => {} },
  argTypes: { density: { control: 'inline-radio', options: ['row', 'compact', 'two-line'] } },
};
export default meta;
type S = StoryObj<typeof JobRow>;

export const Row: S = {};
export const Compact: S = { args: { density: 'compact' } };
export const Selected: S = { args: { selected: true } };
export const NoTime: S = { args: { job: jobs.find((j) => !j.promisedAt)!, view: viewOf(jobs.find((j) => !j.promisedAt)!) } };
export const WithPartBelow: S = { args: { below: <PartChip product={productOf('pr04')} env={todayEnv} inventoryName={branch.inventory.platform} /> } };
export const TwoLine: S = {
  args: { density: 'two-line' },
  decorators: [(Story) => <div className="w-[375px] max-w-full"><Story /></div>],
};
