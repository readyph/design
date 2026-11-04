import type { Meta, StoryObj } from '@storybook/react';
import { CustomerThread } from './CustomerThread';
import { customerChatOf, jobOf } from './sms/requestsModel';
import { customerOf, manager } from './sms/data';
import { getMech } from './sms/mechModel';
import { seedTracker, SCENARIO_JOB, type ThreadSeed } from './sms/trackerModel';

const job = jobOf(SCENARIO_JOB['in progress'])!;
const seeded = (t: ThreadSeed) => { seedTracker('in progress', t); return getMech(); };

const meta: Meta<typeof CustomerThread> = {
  title: 'Components/Data/Customer thread',
  component: CustomerThread,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[520px] max-w-full bg-surface"><Story /></div>],
  args: { customer: { ...customerOf(job), short: customerOf(job).name.split(' ')[0]!, initials: customerOf(job).name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() }, you: manager, onSend: () => {} },
};
export default meta;
type S = StoryObj<typeof CustomerThread>;

export const Empty: S = { render: (a) => <CustomerThread {...a} posts={customerChatOf(seeded('none'), job)} /> };
export const Conversation: S = { render: (a) => <CustomerThread {...a} posts={customerChatOf(seeded('conversation'), job)} /> };
export const ReplyWaiting: S = { render: (a) => <CustomerThread {...a} posts={customerChatOf(seeded('reply waiting'), job)} /> };
export const LongConversation: S = { render: (a) => <CustomerThread {...a} posts={customerChatOf(seeded('long conversation'), job)} /> };
