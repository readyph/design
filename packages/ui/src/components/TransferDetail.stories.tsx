import type { Meta, StoryObj } from '@storybook/react';
import { TransferDetail, type TransferDetailProps } from './TransferDetail';
import { ProgressSteps } from './ProgressSteps';

const steps = (s: 'draft' | 'transit' | 'received') => (
  <ProgressSteps
    aria-label="Where this transfer is"
    steps={[
      { label: 'Drafted', note: 'Ana, 22 Oct, 9:40 AM', state: 'done' },
      { label: 'Sent', note: s === 'draft' ? 'Not sent. Print it, then mark it sent.' : 'Ana, 22 Oct, 10:15 AM', state: s === 'draft' ? 'now' : 'done' },
      { label: 'Received', note: s === 'received' ? 'Berto, 23 Oct, 8:30 AM' : 'Cebu checks it in', state: s === 'received' ? 'done' : s === 'transit' ? 'now' : 'next' },
    ]}
  />
);
const paper = <article aria-label="Stock transfer TR-0032" className="rounded-control border border-border p-6 text-[14px]">Transfer paper (PaperDocument, I9)</article>;
const base: TransferDetailProps = {
  id: 'TR-0032', out: true, otherName: 'Cebu branch', status: 'draft',
  facts: [<>From <b>Main stockroom</b></>, <>To <b>Cebu branch</b></>, '8 pcs', <>For <b className="font-mono">JO-0412</b></>],
  steps: steps('draft'), paper,
  history: [{ at: '22 Oct, 9:40 AM', who: 'Ana', what: 'Drafted the transfer' }],
  can: { send: true, receive: true, change: true },
  otherShort: 'Cebu', hereShort: 'Main', managerName: 'Berto',
  onAskSend: () => {}, onSend: () => {}, onNotYet: () => {}, onPrint: () => {}, onReceive: () => {}, onChange: () => {}, onCancelDraft: () => {},
};
const meta: Meta<typeof TransferDetail> = {
  title: 'Components/Inventory/TransferDetail',
  component: TransferDetail,
  tags: ['autodocs'],
  args: base,
  decorators: [(Story) => <div className="bg-surface px-4 py-5 min-[641px]:px-pad"><Story /></div>],
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Transfer detail (RDY-398, I15). Source: inventory-home FINAL/movements.js 311-376, movements.css 107-121.' } } },
};
export default meta;
type Story = StoryObj<typeof TransferDetail>;

export const Draft: Story = {};
export const SendQuestion: Story = { args: { confirming: true, confirmText: 'FLT-OIL-S goes from 8 to 0 here. Cebu checks it in on their side, and then it is stock there.' } };
export const SendBlocked: Story = { args: { confirming: true, confirmText: '8 pcs leave Main.', issue: 'Only 1 Oil filter on hand now, the draft has 2.' } };
export const ClerkWaitingForManager: Story = { args: { can: { send: false, receive: true, change: false } } };
export const InTransitOut: Story = { args: { status: 'transit', steps: steps('transit'), note: { tone: 'transit', title: 'On its way to Cebu.', text: 'They check it in on their own screen; this page updates when they do. Stock already left Main.' } } };
export const InTransitIn: Story = { args: { status: 'transit', out: false, steps: steps('transit') } };
export const ReceivedShort: Story = { args: { status: 'received', steps: steps('received'), note: { tone: 'short', title: '6 of 8 in, 2 short.', text: 'Only what arrived went into stock.' } } };
