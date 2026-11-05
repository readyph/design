import type { Meta, StoryObj } from '@storybook/react';
import { ItemsBlock, PaymentBlock, QuoteCard, StatusBlock, TrackerFrame, UpdatesBlock, WhoBlock } from './TrackerBlocks';
import { useMech } from './sms/mechModel';
import { SCENARIO_JOB, liveJob, seedTracker, type TrackerScenario } from './sms/trackerModel';
import { answerFromStore, trackerViewOf } from './sms/trackerAdapter';
import { branch } from './sms/data';

/** The customer tracker blocks, composed the way the tracking page stacks them (single 520px column). */
function Tracker({ scenario }: { scenario: TrackerScenario }) {
  seedTracker(scenario, 'none');
  const s = useMech();
  const v = trackerViewOf(s, liveJob(s, SCENARIO_JOB[scenario])!);
  return (
    <TrackerFrame business={branch.business} branchName={branch.name}>
      <div className="flex min-w-0 flex-col gap-10 [&>section]:mt-0">
        <div><WhoBlock who={v.who} /><StatusBlock status={v.status} /></div>
        {v.quotes.map((q) => <QuoteCard key={q.id} q={q} onAnswer={answerFromStore} />)}
        <ItemsBlock items={v.items} />
        <PaymentBlock payment={v.payment} />
        <UpdatesBlock posts={v.updates} />
      </div>
    </TrackerFrame>
  );
}

const meta: Meta<typeof Tracker> = {
  title: 'Components/SMS/Tracker blocks',
  component: Tracker,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type S = StoryObj<typeof Tracker>;

export const Received: S = { args: { scenario: 'received' } };
export const WorkingOnIt: S = { args: { scenario: 'in progress' } };
export const WaitingForParts: S = { args: { scenario: 'waiting for parts' } };
export const QuoteWaiting: S = { args: { scenario: 'quote waiting' } };
export const ReadyForPickUp: S = { args: { scenario: 'ready for pick-up' } };
export const Done: S = { args: { scenario: 'done' } };
export const LongText: S = { args: { scenario: 'long text' } };
export const ManyUpdates: S = { args: { scenario: 'many updates' } };
export const EmptyFeed: S = { args: { scenario: 'empty feed' } };
