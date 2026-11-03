import type { Meta, StoryObj } from '@storybook/react';
import { CustomerThread } from './CustomerThread';
import { jobOf } from './sms/requestsModel';
import { getMech } from './sms/mechModel';
import { seedTracker, SCENARIO_JOB, type ThreadSeed } from './sms/trackerModel';

const job = jobOf(SCENARIO_JOB['in progress'])!;
const seeded = (t: ThreadSeed) => { seedTracker('in progress', t); return getMech(); };

const meta: Meta<typeof CustomerThread> = {
  title: 'Components/Data/Customer thread',
  component: CustomerThread,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[520px] max-w-full bg-surface"><Story /></div>],
  args: { job, onSend: () => {} },
};
export default meta;
type S = StoryObj<typeof CustomerThread>;

export const Empty: S = { render: (a) => <CustomerThread {...a} s={seeded('none')} /> };
export const Conversation: S = { render: (a) => <CustomerThread {...a} s={seeded('conversation')} /> };
export const ReplyWaiting: S = { render: (a) => <CustomerThread {...a} s={seeded('reply waiting')} /> };
export const LongConversation: S = { render: (a) => <CustomerThread {...a} s={seeded('long conversation')} /> };
