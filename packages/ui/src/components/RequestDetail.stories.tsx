import type { Meta, StoryObj } from '@storybook/react';
import { RequestBody, RequestHeader, type DetailActions } from './RequestDetail';
import { getMech } from './sms/mechModel';
import { declinePart, itemsOf, jobOf, seedRequests, type InboxItem } from './sms/requestsModel';

const noop = () => {};
const actions: DetailActions = { onApprove: noop, onReady: noop, onDecline: noop, onQuote: noop, onDismiss: noop, onAnswer: noop, onCustomerAnswer: noop, onOpenService: noop, onBack: noop };

function pick(customer: 'waiting' | 'approved' | 'declined', test: (i: InboxItem) => boolean, scenario: 'default' | 'customer messages' = 'default'): InboxItem {
  seedRequests({ scenario, customer });
  return itemsOf(getMech()).find(test)!;
}
const Detail = ({ item }: { item: InboxItem }) => <div className="w-[520px] max-w-full bg-surface"><RequestHeader item={item} job={jobOf(item.jobId)} a={actions} /><RequestBody item={item} job={jobOf(item.jobId)} a={actions} /></div>;

const meta: Meta = { title: 'Components/Data/Request detail', tags: ['autodocs'] };
export default meta;
type S = StoryObj;

/** A part request waiting for the manager: Approve is the only way forward. */
export const PartRequested: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'part' && i.part?.status === 'Requested')} /> };
export const PartDeclined: S = {
  render: () => {
    seedRequests({ scenario: 'default', customer: 'waiting' });
    declinePart(itemsOf(getMech()).find((i) => i.part?.status === 'Requested')!.part!.id, 'Not needed for this job', '');
    return <Detail item={itemsOf(getMech()).find((i) => i.part?.status === 'Declined')!} />;
  },
};
export const PartApproved: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'part' && i.part?.status === 'Approved')} /> };
export const PartReady: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'part' && i.part?.status === 'Ready at stockroom')} /> };
export const PartCollected: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'part' && i.part?.status === 'Collected')} /> };
export const ProblemOpen: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'problem' && !i.problem?.status)} /> };
export const ProblemQuotedWaiting: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'problem' && i.problem?.status === 'quoted')} /> };
export const ProblemQuotedApproved: S = { render: () => <Detail item={pick('approved', (i) => i.kind === 'problem' && i.problem?.status === 'quoted')} /> };
export const ProblemQuotedDeclined: S = { render: () => <Detail item={pick('declined', (i) => i.kind === 'problem' && i.problem?.status === 'quoted')} /> };
export const ProblemDismissed: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'problem' && i.problem?.status === 'dismissed')} /> };
export const QuestionOpen: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'question' && !i.msg?.answered)} /> };
export const QuestionAnswered: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'question' && !!i.msg?.answered)} /> };
export const CustomerMessage: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'customer' && i.status === 'Needs you', 'customer messages')} /> };
export const CustomerMessageAnswered: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'customer' && i.status === 'Answered', 'customer messages')} /> };
export const MechanicNote: S = { render: () => <Detail item={pick('waiting', (i) => i.kind === 'note')} /> };
