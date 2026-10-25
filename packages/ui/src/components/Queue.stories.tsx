import type { Meta, StoryObj } from '@storybook/react';
import { useState, type ReactNode } from 'react';
import { Queue, type QueueItem } from './Queue';
import { allPlatforms, done, items, manyItems, snoozed, stock, watching } from './Queue.data';

const meta: Meta<typeof Queue> = {
  title: 'Components/Data display/Queue',
  component: Queue,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Queue "Needs you" (C19, RDY-279). Header (22px title, filled count, platform filter), Leda headline, a scrolling list with a 28px bottom fade while more is below, then pinned groups folded to one line each. Sits on --frame in the portal place column (320-460px wide). Keys: j / k move, Enter opens, s snoozes; one component per page keeps them (give other lists `shortcuts={false}`). Items are a list with `aria-current` on the cursor row (not a listbox: rows hold a real button).',
      },
    },
  },
  args: { items, watching, snoozed, done, platforms: allPlatforms },
};
export default meta;
type Story = StoryObj<typeof Queue>;

const Column = ({ children, w = 400, h = 640 }: { children: ReactNode; w?: 320 | 400 | 460 | 390; h?: 560 | 640 | 720 }) => (
  <div className={`bg-frame py-3 ${w === 320 ? 'w-[320px]' : w === 460 ? 'w-[460px]' : w === 390 ? 'w-[390px]' : 'w-[400px]'} ${h === 560 ? 'h-[560px]' : h === 720 ? 'h-[720px]' : 'h-[640px]'}`}>
    {children}
  </div>
);
const col = (w?: 320 | 400 | 460 | 390, h?: 560 | 640 | 720): NonNullable<Story['decorators']> => [(S) => <Column w={w} h={h}><S /></Column>];

export const Default: Story = { decorators: col(), args: { shortcuts: false } };
export const Selected: Story = { decorators: col(), args: { defaultCursorId: 'q2', shortcuts: false } };
export const PinnedOpen: Story = { decorators: col(400, 720), args: { defaultOpenGroups: ['watching', 'snoozed', 'done'], shortcuts: false } };
export const ScrollsWithFade: Story = { decorators: col(400, 560), args: { items: manyItems, shortcuts: false } };
export const FilteredToPlatform: Story = { decorators: col(), args: { defaultFilter: 'stock', shortcuts: false } };
export const FilteredEmpty: Story = { decorators: col(), args: { defaultFilter: 'hq', items: items.filter((i) => i.platform.id !== 'hq'), shortcuts: false } };
export const Empty: Story = { decorators: col(), args: { items: [], watching: [], snoozed: [], done: done, shortcuts: false } };
export const Loading: Story = { decorators: col(), args: { loading: true, shortcuts: false } };
export const ErrorOnePlatform: Story = {
  decorators: col(),
  args: { items: items.filter((i) => i.platform.id !== 'stock'), errors: [{ platform: stock, lastLoaded: '9:10 AM' }], shortcuts: false },
};
export const LongTextNarrow320: Story = {
  decorators: col(320, 720),
  args: {
    shortcuts: false,
    items: [
      { id: 'l1', platform: { id: 'l', name: 'Cubao Repair Shop and Parts Counter, Quezon City Branch', index: 4 }, due: 'Today 17:00', urgent: true, title: 'Supercalifornianlongpartnumber-00000000 needs approval', detail: 'A very long detail line that has to wrap onto several lines without pushing the button out of the row or the column.', action: 'Approve the replacement order' },
      ...items.slice(0, 2),
    ],
  },
};
export const Phone390: Story = { decorators: col(390, 720), args: { shortcuts: false, items: items.slice(0, 4), defaultOpenGroups: ['done'] } };

/** Live: j / k / Enter / s work on the page; Snooze and the action move items between groups. */
export const Interactive: Story = {
  decorators: col(400, 720),
  render: () => {
    const [open, setOpen] = useState<QueueItem[]>(items);
    const [snz, setSnz] = useState(snoozed);
    const [dn, setDn] = useState(done);
    const [filter, setFilter] = useState<string | null>(null);
    const [last, setLast] = useState('');
    return (
      <div className="flex h-full flex-col">
        <Queue
          className="flex-1"
          items={open}
          watching={watching}
          snoozed={snz}
          done={dn}
          platforms={allPlatforms}
          filter={filter}
          onFilterChange={setFilter}
          onOpen={(id) => setLast(`Opened ${id}`)}
          onAction={(id) => {
            const it = open.find((i) => i.id === id)!;
            setOpen(open.filter((i) => i.id !== id));
            setDn([{ id: it.id, platform: it.platform, source: it.source, title: it.title, at: '9:20' }, ...dn]);
          }}
          onSnooze={(id) => {
            const it = open.find((i) => i.id === id)!;
            setOpen(open.filter((i) => i.id !== id));
            setSnz([...snz, { id: it.id, platform: it.platform, source: it.source, title: it.title, until: 'Later today · 13:00' }]);
          }}
        />
        <p className="px-3 text-small text-muted" role="note">{last || 'Try j, k, Enter, s'}</p>
      </div>
    );
  },
};
