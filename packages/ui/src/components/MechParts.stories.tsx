import type { Meta, StoryObj } from '@storybook/react';
import { MechPartsSample } from './MechParts';
import { jobs } from './sms/data';
import { useMech } from './sms/mechModel';

function Parts({ status, readOnly = false }: { status: (typeof jobs)[number]['status']; readOnly?: boolean }) {
  const s = useMech();
  return <div className="w-[375px] max-w-full bg-surface px-4 py-4"><MechPartsSample job={jobs.find((j) => j.status === status && j.parts.length)!} s={s} readOnly={readOnly} onRequest={() => {}} /></div>;
}

const meta: Meta = { title: 'Components/SMS/Mechanic parts', tags: ['autodocs'] };
export default meta;
type S = StoryObj;

export const Checklist: S = { render: () => <Parts status="TODO" /> };
export const Working: S = { render: () => <Parts status="IN_PROGRESS" /> };
export const WaitingForPart: S = { render: () => <Parts status="PENDING" /> };
export const ReadOnly: S = { render: () => <Parts status="TODO" readOnly /> };
