import type { ChatChip, ChatMessageData } from './Chat';

/** Sample data for the Chat stories and tests. */
const chips: ChatChip[] = [
  { id: 'c1', label: 'How did the shop do this week?' },
  { id: 'c2', label: 'Anong parts ang pinakamaraming nagamit kahapon?' },
  { id: 'c3', label: 'Raise oil filter reorder level to 30' },
];

const thread: ChatMessageData[] = [
  { id: 'm1', from: 'owner', name: 'Maria Santos', time: '9:10 AM', scope: 'About Parts Stockroom', blocks: [{ type: 'text', text: 'What shares data with what?' }] },
  {
    id: 'm2',
    from: 'leda',
    name: 'Leda',
    time: '9:10 AM',
    blocks: [
      { type: 'text', text: 'Parts Stockroom shares its catalog with Auto Works, and Auto Works shares job orders with Books.' },
      {
        type: 'table',
        caption: 'Data links',
        columns: [{ key: 'from', label: 'From' }, { key: 'to', label: 'To' }, { key: 'what', label: 'Shares' }],
        rows: [
          { from: 'Parts Stockroom', to: 'Auto Works', what: 'Catalog, stock' },
          { from: 'Auto Works', to: 'Books', what: 'Job orders' },
        ],
      },
      { type: 'meta', text: 'Read from your platform links, 9:10 AM' },
      { type: 'chips', chips: [{ id: 'f1', label: 'Is everything running?' }, { id: 'f2', label: 'Who works at the stockroom?' }] },
    ],
  },
  { id: 'm3', from: 'owner', name: 'Maria Santos', time: '9:11 AM', scope: 'About Parts Stockroom', blocks: [{ type: 'text', text: 'Disconnect Parts Stockroom' }] },
  {
    id: 'm4',
    from: 'leda',
    name: 'Leda',
    time: '9:11 AM',
    blocks: [{ type: 'refusal', text: "Leda can't add, rename or disconnect platforms or change links.", actions: [{ id: 'go', label: 'Go to Parts Stockroom', href: '#parts' }] }],
  },
];

const withProposal: ChatMessageData[] = [
  { id: 'p1', from: 'owner', name: 'Maria Santos', time: '9:12 AM', scope: 'About Parts Stockroom', blocks: [{ type: 'text', text: 'Raise oil filter reorder level to 30' }] },
  {
    id: 'p2',
    from: 'leda',
    name: 'Leda',
    time: '9:12 AM',
    blocks: [
      { type: 'text', text: 'Here is the change. Nothing is written until you confirm.' },
      {
        type: 'proposal',
        blockId: 'CMD-RL',
        proposal: { id: 'CMD-RL', title: 'Raise oil filter reorder level to 30', writes: ['Oil filter (OF-114) reorder level: 20 to 30'], notes: ['Nothing is ordered yet.'], confirmLabel: 'Confirm change', extraLabel: 'Change it first' },
      },
    ],
  },
];

export const chatSample = { chips, thread, withProposal };
