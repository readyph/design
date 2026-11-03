import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MechRequestForm, MechRequestRow, MechRequestSent } from './MechRequest';
import { jobs, mechanics } from './sms/data';
import { requestsOf, useMech } from './sms/mechModel';

const active = jobs.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'TODO');
const frame = 'w-[375px] max-w-full bg-surface px-4 py-4';

function Form({ askCar, withPart = false, scanOpen: scan = false }: { askCar: boolean; withPart?: boolean; scanOpen?: boolean }) {
  const [jobId, setJobId] = useState<string | null>(active[0].id);
  const [productId, setProductId] = useState<string | null>(withPart ? 'pr01' : null);
  const [qty, setQty] = useState(1);
  const [scanOpen, setScanOpen] = useState(scan);
  return <div className={frame}><MechRequestForm jobs={active} jobId={jobId} setJobId={setJobId} askCar={askCar} productId={productId} setProductId={setProductId} qty={qty} setQty={setQty} scanOpen={scanOpen} setScanOpen={setScanOpen} /></div>;
}

function Rows() {
  const s = useMech();
  const reqs = requestsOf(s, mechanics[0].id);
  return <ul className={frame}>{reqs.map((r) => <MechRequestRow key={r.id} r={r} jobs={jobs} />)}</ul>;
}

const meta: Meta = { title: 'Components/SMS/Mechanic request', tags: ['autodocs'] };
export default meta;
type S = StoryObj;

export const FormFromPartsTab: S = { render: () => <Form askCar /> };
export const FormFromService: S = { render: () => <Form askCar={false} /> };
export const FormPartChosen: S = { render: () => <Form askCar={false} withPart /> };
export const ScanSheet: S = { render: () => <Form askCar={false} scanOpen /> };
export const Sent: S = { render: () => <div className={frame}><MechRequestSent onDone={() => {}} onAnother={() => {}} doneLabel="Back to my services" /></div> };
export const RequestRows: S = { render: () => <Rows /> };
