import type { Meta, StoryObj } from '@storybook/react';
import { PanelToggle } from '../PanelToggle';
import { FloorFeed } from './FloorFeed';
import { jobs } from './data';

const floorRead = 'Ricky is free from 12:30 and Jun carries 5 active services. JO-0417 could move to Ricky and still make 16:00.';

const meta: Meta<typeof FloorFeed> = {
  title: 'Components/SMS/Floor feed',
  component: FloorFeed,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="h-[640px] w-[400px] border border-rule"><Story /></div>],
  args: { jobs, replied: {}, floorRead, onOpenJob: () => {}, onOpenInquiry: () => {} },
  argTypes: { tab: { control: 'inline-radio', options: ['needs', 'inquiries', 'parts'] } },
};
export default meta;
type S = StoryObj<typeof FloorFeed>;

export const NeedsYou: S = { args: { tab: 'needs' } };
export const NothingStuck: S = { args: { tab: 'needs', jobs: [], floorRead: undefined } };
export const Inquiries: S = { args: { tab: 'inquiries' } };
export const InquiryReplied: S = { args: { tab: 'inquiries', replied: { iq1: '10:20' } } };
export const Parts: S = { args: { tab: 'parts' } };
export const PartsInventoryDown: S = { args: { tab: 'parts', inventoryDown: true } };
export const WithHideToggle: S = { args: { tab: 'needs', headerAction: <PanelToggle mode="hide" onClick={() => {}} className="-mr-2 flex-none" /> } };
