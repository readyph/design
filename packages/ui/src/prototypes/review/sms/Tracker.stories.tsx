import type { Meta, StoryObj } from '@storybook/react';
import { TrackerPage, type TrackerProps } from './Tracker.page';
import { Remount, control, liveMeta } from '../../../components/sms/live';

/** [For Review] The customer's tracking page (no login). Opens on Phone-sized column; use the toolbar Viewport for Small mobile and Theme for dark. */
type Args = { scenario: NonNullable<TrackerProps['scenario']>; thread: NonNullable<TrackerProps['thread']>; state: NonNullable<TrackerProps['state']>; studioBar: boolean };

const meta: Meta<Args> = {
  ...liveMeta,
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Prototypes/SMS/[For Review] Customer tracker',
  argTypes: {
    scenario: control.select(['received', 'in progress', 'waiting for parts', 'quote waiting', 'ready for pick-up', 'done', 'long text', 'many updates', 'empty feed'], 'Where the service stands (the staff pages read the same data)'),
    thread: control.select(['none', 'conversation', 'reply waiting', 'long conversation'], 'Chat history: none, a short conversation, an unread reply from the manager, or a long one over two days (scrolls)', 'Chat'),
    state: control.select(['ready', 'loading', 'invalid link', 'replaced link'], 'Data state: loading skeleton, a link nobody issued, or one the manager replaced'),
    studioBar: control.bool('Studio-only strip to act as the manager (post an update, add an internal note, reply)', 'Studio'),
  },
  args: { scenario: 'in progress', thread: 'none', state: 'ready', studioBar: true },
  render: (a) => (
    <Remount on={a}>
      <TrackerPage scenario={a.scenario} thread={a.thread} state={a.state} studioBar={a.studioBar} />
    </Remount>
  ),
};
export default meta;
type Story = StoryObj<Args>;

export const Live: Story = { name: 'Customer tracker' };
