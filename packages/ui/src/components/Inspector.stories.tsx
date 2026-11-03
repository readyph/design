import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Inspector, type InspectorProps } from './Inspector';
import { jobs, ledaProposals, type Job } from './sms/data';
import { money } from './sms/floorModel';

const byId = (id: string) => jobs.find((j) => j.id === id) as Job;
const unpaidPickup = jobs.find((j) => j.status === 'FOR_PICKUP' && money.balance(j) > 0) as Job;
const paidPickup = jobs.find((j) => j.status === 'FOR_PICKUP' && money.balance(j) <= 0) ?? jobs.find((j) => j.status === 'FOR_PICKUP') as Job;

const meta: Meta<typeof Inspector> = {
  title: 'Components/Data/Inspector',
  component: Inspector,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-[900px] w-[360px] flex-col border-l border-rule bg-surface"><Story /></div>],
  args: {
    job: byId('j0408'), proposalState: {}, onConfirmProposal: () => {}, onDiscardProposal: () => {}, onAction: () => {}, onAssign: () => {}, onResolve: () => {},
    onClose: () => {}, onViewQuote: () => {}, onBookQuote: () => {}, onEditQuote: () => {},
    trackingLink: <p className="text-[13px] text-muted">Tracking link block (TrackingLink).</p>,
  },
};
export default meta;
type S = StoryObj<typeof Inspector>;

export const InProgress: S = {};
/** Stuck: waiting on parts, with Leda's proposal for the job. */
export const Pending: S = { args: { job: byId('j0412') } };
export const ReadyUnpaidCollectPayment: S = { args: { job: unpaidPickup } };
export const PaidReleaseCar: S = { args: { job: paidPickup } };
export const Completed: S = { args: { job: byId('j0401') } };
export const QuotationBookIt: S = { args: { job: byId('j0421') } };
export const InventoryDown: S = { args: { inventoryDown: true } };
export const NothingSelected: S = { args: { job: null, floorRead: <>Two services are stuck on parts. Pick one on a lane to open it here.</> } };
/** Phone: the inspector is a pushed page with a back link and full-width primary action. */
export const PhonePage: S = { args: { asPage: true, onBack: () => {} }, decorators: [(Story) => <div className="w-[390px]"><Story /></div>] };

export const Interactive: S = {
  render: (args: InspectorProps) => {
    const [state, setState] = useState<InspectorProps['proposalState']>({});
    const first = ledaProposals[0];
    return <Inspector {...args} job={byId('j0412')} proposalState={state} onConfirmProposal={(p) => setState((s) => ({ ...s, [p.id]: 'done' }))} onDiscardProposal={(p) => setState((s) => ({ ...s, [p.id]: 'discarded' }))} floorProposalIds={[first.id]} />;
  },
};
