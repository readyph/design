import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MechServiceBody, type ServiceDialog } from './MechService';
import { jobs, mechanics, type Job } from './sms/data';
import { useMech } from './sms/mechModel';

const me = mechanics[0];
const byStatus = (st: Job['status']) => jobs.find((j) => j.status === st)!;

function Screen({ job, open = null }: { job: Job; open?: ServiceDialog }) {
  const s = useMech();
  const [dialog, setDialog] = useState<ServiceDialog>(open);
  return <div className="w-[375px] max-w-full bg-surface px-4 py-4"><MechServiceBody job={job} s={s} me={me} flash={() => {}} onNeedPart={() => {}} dialog={dialog} setDialog={setDialog} onSentDone={() => {}} /></div>;
}

const meta: Meta = { title: 'Components/SMS/Mechanic service', tags: ['autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type S = StoryObj;

export const NotStarted: S = { render: () => <Screen job={byStatus('TODO')} /> };
export const Working: S = { render: () => <Screen job={byStatus('IN_PROGRESS')} /> };
export const Waiting: S = { render: () => <Screen job={byStatus('PENDING')} /> };
export const Finished: S = { render: () => <Screen job={byStatus('FOR_PICKUP')} /> };
export const PauseReason: S = { render: () => <Screen job={byStatus('IN_PROGRESS')} open="pause" /> };
export const MarkDoneConfirm: S = { render: () => <Screen job={byStatus('IN_PROGRESS')} open="done" /> };
export const AskManager: S = { render: () => <Screen job={byStatus('IN_PROGRESS')} open="ask" /> };
