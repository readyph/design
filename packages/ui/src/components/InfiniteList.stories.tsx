import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { InfiniteSentinel, ListEnd, CardSkeletons, ResultCount } from './InfiniteList';

const meta = { title: 'Components/SMS/InfiniteList', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const Sentinel: Story = {
  render: () => {
    const [n, setN] = useState(12);
    const total = 40;
    return (
      <div className="flex h-[480px] flex-col">
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {Array.from({ length: n }, (_, i) => <li key={i} className="border-b border-rule px-4 py-4 text-[14px] text-text">Service {i + 1}</li>)}
          <InfiniteSentinel hasMore={n < total} loading={false} onLoadMore={() => setN((x) => Math.min(total, x + 12))} />
          {n >= total && <ListEnd total={total} />}
        </ul>
        <ResultCount shown={n} total={total} />
      </div>
    );
  },
};
export const End: Story = { render: () => <ListEnd total={40} /> };
export const Skeletons: Story = { render: () => <CardSkeletons /> };
export const Counter: Story = {
  render: () => <div><ResultCount shown={12} total={40} /><ResultCount shown={24} total={40} loadingMore /><ResultCount shown={40} total={40} /></div>,
};
