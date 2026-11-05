import type { Meta, StoryObj } from '@storybook/react';
import { MechFeed } from './MechFeed';
import { jobs, mechanics } from './sms/data';
import { feedOf, useMech } from './sms/mechModel';

const me = mechanics[0];

function Feed({ empty = false, readOnly = false, allowInternal = false }: { empty?: boolean; readOnly?: boolean; allowInternal?: boolean }) {
  const s = useMech();
  const job = jobs.find((j) => j.status === 'IN_PROGRESS' && feedOf(s, j).length)!;
  return <div className="w-[375px] max-w-full bg-surface px-4 py-4"><MechFeed posts={empty ? [] : feedOf(s, job)} me={me} readOnly={readOnly} allowInternal={allowInternal} onPost={() => {}} flash={() => {}} /></div>;
}

const meta: Meta = { title: 'Components/SMS/Mechanic updates', tags: ['autodocs'] };
export default meta;
type S = StoryObj;

export const WithUpdates: S = { render: () => <Feed /> };
export const Empty: S = { render: () => <Feed empty /> };
export const ReadOnly: S = { render: () => <Feed readOnly /> };
export const WithInternalToggle: S = { render: () => <Feed allowInternal /> };
