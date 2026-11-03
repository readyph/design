import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RequestList } from './RequestList';
import { getMech } from './sms/mechModel';
import { itemsOf, matches, seedRequests } from './sms/requestsModel';

seedRequests({ scenario: 'default', customer: 'waiting' });
const all = itemsOf(getMech()).sort((a, b) => b.at.localeCompare(a.at));

const meta: Meta<typeof RequestList> = {
  title: 'Components/Data/Request list',
  component: RequestList,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[420px] max-w-full bg-surface"><Story /></div>],
  args: { items: all, selectedId: null, onOpen: () => {} },
};
export default meta;
type S = StoryObj<typeof RequestList>;

/** Rows newest first. Rows waiting for the manager are tinted warn; an unread row has an accent dot. */
export const Default: S = {};
export const Selected: S = { args: { selectedId: all[1]?.id ?? null } };
export const NeedsYou: S = { args: { items: all.filter((i) => matches(i, 'needs')) } };
export const Parts: S = { args: { items: all.filter((i) => matches(i, 'parts')) } };
export const Problems: S = { args: { items: all.filter((i) => matches(i, 'problems')) } };
export const Messages: S = { args: { items: all.filter((i) => matches(i, 'messages')) } };
export const Empty: S = { args: { items: [], empty: <p className="px-4 py-6 text-[14px] text-muted">Nothing here.</p> } };

/** Arrow keys, Home and End move focus; Enter or Space opens. */
export const Interactive: S = {
  render: (args) => {
    const [id, setId] = useState<string | null>(null);
    return <RequestList {...args} selectedId={id} onOpen={setId} />;
  },
};
