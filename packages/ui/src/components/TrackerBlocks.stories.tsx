import type { Meta, StoryObj } from '@storybook/react';
import { ItemsBlock, PaymentBlock, QuoteCard, StatusBlock, TrackerFrame, UpdatesBlock, WhoBlock } from './TrackerBlocks';
import { useMech } from './sms/mechModel';
import { SCENARIO_JOB, feedForCustomer, liveJob, quotesFor, seedTracker, type TrackerScenario } from './sms/trackerModel';

/** The customer tracker blocks, composed the way the tracking page stacks them (single 520px column). */
function Tracker({ scenario }: { scenario: TrackerScenario }) {
  seedTracker(scenario, 'none');
  const s = useMech();
  const job = liveJob(s, SCENARIO_JOB[scenario])!;
  return (
    <TrackerFrame>
      <div className="flex min-w-0 flex-col gap-10 [&>section]:mt-0">
        <div><WhoBlock job={job} /><StatusBlock job={job} /></div>
        {quotesFor(s, job).map((q) => <QuoteCard key={q.id} q={q} />)}
        <ItemsBlock job={job} />
        <PaymentBlock job={job} />
        <UpdatesBlock job={job} posts={feedForCustomer(s, job)} />
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
