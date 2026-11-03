import type { Meta, StoryObj } from '@storybook/react';
import { RequestsPage, type RequestsOverlay, type RequestsProps } from './Requests.page';
import { Remount, control, liveMeta } from '../../../components/sms/live';

/** Live manager inbox: what mechanics sent (parts, found problems, questions, notes). Approve, decline, quote, dismiss and reply; the Mechanic story reads the same store. */
const SELECTED = {
  'first one waiting for you (desktop)': 'auto',
  'none (list only)': null,
  'part request, needs you (Arnel, timing belt kit)': 'part:rq2',
  'part request, 2 for Jun (oil filters)': 'part:rq6',
  'part request, approved (alternator)': 'part:rq1',
  'part request, ready at stockroom': 'part:rq3',
  'found problem, needs a quote (Paolo)': 'problem:pp1',
  'found problem, quoted': 'problem:pp2',
  'found problem, dismissed': 'problem:pp3',
  'question, needs you (Arnel)': 'question:ms10',
  'question, answered': 'question:ms11',
  'note with photos (Jun)': 'note:n2',
} as const;
type Args = {
  state: NonNullable<RequestsProps['state']>;
  scenario: NonNullable<RequestsProps['scenario']>;
  selected: keyof typeof SELECTED;
  filter: NonNullable<RequestsProps['initialFilter']>;
  customer: NonNullable<RequestsProps['customerApproval']>;
  overlay: RequestsOverlay | 'Inspector open';
};

const meta: Meta<Args> = {
  ...liveMeta,
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Prototypes/SMS/[For Review] Requests',
  argTypes: {
    state: control.select(['ready', 'loading'], 'Data state (loading = skeleton rows)'),
    scenario: control.select(['default', 'all clear', 'many', 'long text', 'customer messages'], 'What the inbox holds: the normal day, nothing waiting, 20+ items, very long mechanic text'),
    selected: control.select(Object.keys(SELECTED), 'Item open on load (phone: opens the pushed detail)', 'Open on load'),
    filter: control.select(['all', 'needs', 'parts', 'problems', 'messages'], 'Starting filter', 'Layout'),
    customer: control.select(['waiting', 'approved', 'declined'], 'Where a quote stands with the customer when it starts (seeded quote and any new quote). The page also has a studio-only control to simulate the answer live.', 'Data'),
    overlay: control.select(['none', 'quote', 'decline', 'dismiss', 'service'], 'Dialog or the Today Inspector open on load (needs a matching selected item)', 'Open on load'),
  },
  args: { state: 'ready', scenario: 'default', selected: 'first one waiting for you (desktop)', filter: 'all', customer: 'waiting', overlay: 'none' },
  render: (a) => (
    <Remount on={a}>
      <RequestsPage state={a.state} scenario={a.scenario} initialSelected={SELECTED[a.selected]} initialFilter={a.filter} customerApproval={a.customer} overlay={a.overlay as RequestsOverlay} />
    </Remount>
  ),
};
export default meta;
type Story = StoryObj<Args>;

export const Live: Story = { name: 'Requests & messages' };
