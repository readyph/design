import type { Meta, StoryObj } from '@storybook/react';
import { RequestThread } from './RequestThread';
import { mechanics } from './sms/data';
import { getMech } from './sms/mechModel';
import { itemsOf, jobOf, mechOf, seedRequests } from './sms/requestsModel';

seedRequests({ scenario: 'default', customer: 'waiting' });
const item = itemsOf(getMech()).find((i) => i.kind === 'question')!;
const job = jobOf(item.jobId);

const meta: Meta<typeof RequestThread> = {
  title: 'Components/Data/Request thread',
  component: RequestThread,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[520px] max-w-full bg-surface"><Story /></div>],
  args: { job, s: getMech(), mech: mechOf(item.mechId), itemKey: item.id, onSend: () => {} },
};
export default meta;
type S = StoryObj<typeof RequestThread>;

/** The service's posts oldest first, the opened item tinted, then the reply box. */
export const Default: S = {};
export const NoService: S = { args: { job: null, itemKey: undefined, mech: mechanics[0]! } };
