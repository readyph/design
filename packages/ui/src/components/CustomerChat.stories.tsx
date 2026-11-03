import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ChatPanel } from './CustomerChat';
import { jobs, TODAY } from './sms/data';
import { patchMech, resetMech, useMech, type CustMsg } from './sms/mechModel';

const job = jobs.find((j) => j.id === 'j0408')!;
const jobId = job.id;
const at = (hmm: string) => `${TODAY}T${hmm}:00+08:00`;
const yd = (hmm: string) => `2026-11-01T${hmm}:00+08:00`;
type Seed = 'none' | 'conversation' | 'reply waiting' | 'long conversation';

const seedOf = (thread: Seed): CustMsg[] => {
  if (thread === 'long conversation') {
    const q = ['Hi, is the radiator the only thing?', 'Can you check the belt too?', 'How long will it take?', 'Is parking free?', 'Can I send my driver?', 'Thanks!'];
    const a = ['Yes, for now. We will tell you if we find more.', 'Sure, we will look at it.', 'About two hours once we start.', 'Yes, in front of the shop.', 'Yes, just give us the plate.', 'You are welcome.'];
    return Array.from({ length: 12 }, (_, i) => ({ id: `cl${i}`, jobId, from: (i % 2 ? 'manager' : 'customer') as 'manager' | 'customer', text: (i % 2 ? a : q)[Math.floor(i / 2)]!, at: i < 6 ? yd(`${15 + Math.floor(i / 2)}:${i % 2 ? '12' : '05'}`) : at(`0${7 + Math.floor((i - 6) / 2)}:${i % 2 ? '40' : '31'}`), read: true }));
  }
  if (thread === 'conversation' || thread === 'reply waiting') {
    return [
      { id: 'cm1', jobId, from: 'customer', text: 'Hi, can I pick it up by 4 pm today?', at: at('09:20'), answered: true },
      { id: 'cm2', jobId, from: 'manager', text: 'Yes, that should be fine. We will text you when it is ready.', at: at('09:26'), read: thread === 'conversation' },
      ...(thread === 'reply waiting' ? [{ id: 'cm3', jobId, from: 'manager' as const, text: 'Update: the part is here, we start in 10 minutes.', at: at('10:09'), read: false }] : []),
    ];
  }
  return [];
};

function Live({ thread }: { thread: Seed }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { resetMech(); patchMech(() => ({ custMsgs: seedOf(thread) })); setReady(true); }, [thread]);
  const s = useMech();
  return ready ? <div className="mx-auto max-w-[520px]"><ChatPanel job={job} s={s} /></div> : null;
}

const meta: Meta<typeof Live> = {
  title: 'Components/SMS/Customer chat',
  component: Live,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj<typeof Live>;

export const Empty: S = { args: { thread: 'none' } };
export const Conversation: S = { args: { thread: 'conversation' } };
export const ReplyWaiting: S = { args: { thread: 'reply waiting' } };
export const LongConversation: S = { args: { thread: 'long conversation' } };
