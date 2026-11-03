import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SidePanelLayout } from './SidePanel';
import type { FeedTab } from './FloorFeed';
import { jobs } from './data';

const floorRead = 'Ricky is free from 12:30 and Jun carries 5 active services. JO-0417 could move to Ricky and still make 16:00.';

const meta: Meta<typeof SidePanelLayout> = {
  title: 'Components/SMS/Side panel',
  component: SidePanelLayout,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="h-[640px] w-full"><Story /></div>],
  args: { open: true, jobs, replied: {}, tab: 'needs', floorRead, onOpenChange: () => {}, onTabChange: () => {}, onOpenJob: () => {}, onOpenInquiry: () => {}, children: <p className="p-4 text-[14px] text-muted">The page's own content.</p> },
};
export default meta;
type S = StoryObj<typeof SidePanelLayout>;

function Live(args: React.ComponentProps<typeof SidePanelLayout>) {
  const [open, setOpen] = useState(args.open);
  const [tab, setTab] = useState<FeedTab>(args.tab);
  return <SidePanelLayout {...args} open={open} onOpenChange={setOpen} tab={tab} onTabChange={setTab} />;
}

export const Open: S = { render: (a) => <Live {...a} /> };
export const Collapsed: S = { args: { open: false }, render: (a) => <Live {...a} /> };
export const Loading: S = { args: { loading: true } };
export const Limited: S = { args: { limited: true } };
export const InventoryDown: S = { args: { tab: 'parts', inventoryDown: true }, render: (a) => <Live {...a} /> };
export const DetailOpen: S = { args: { detailOpen: true } };
