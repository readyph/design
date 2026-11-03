import type { Meta, StoryObj } from '@storybook/react';
import { JobRow } from './JobRow';
import { jobs } from './sms/data';
import { PartChip } from './PartChip';
import { productOf } from './sms/data';

const meta: Meta<typeof JobRow> = {
  title: 'Components/Data/Job row',
  component: JobRow,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[960px] max-w-full"><Story /></div>],
  args: { job: jobs.find((j) => j.id === 'j0412')!, onOpen: () => {}, onAction: () => {} },
  argTypes: { density: { control: 'inline-radio', options: ['row', 'compact', 'two-line'] } },
};
export default meta;
type S = StoryObj<typeof JobRow>;

export const Row: S = {};
export const Compact: S = { args: { density: 'compact' } };
export const Selected: S = { args: { selected: true } };
export const NoTime: S = { args: { job: jobs.find((j) => !j.promisedAt)! } };
export const WithPartBelow: S = { args: { below: <PartChip product={productOf('pr04')} /> } };
export const TwoLine: S = {
  args: { density: 'two-line' },
  decorators: [(Story) => <div className="w-[375px] max-w-full"><Story /></div>],
};
