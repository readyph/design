import type { Meta, StoryObj } from '@storybook/react';
import { InquiryDetail } from './sms/InquiryDetail';
import { inquiries, jobs } from './sms/data';

const meta: Meta<typeof InquiryDetail> = {
  title: 'Components/Data/Inquiry detail',
  component: InquiryDetail,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-[480px] w-[360px] flex-col border-l border-rule bg-surface"><Story /></div>],
  args: { inquiry: inquiries[1], onReply: () => {}, onNewService: () => {}, onOpenJob: () => {}, onClose: () => {} },
};
export default meta;
type S = StoryObj<typeof InquiryDetail>;

export const Unanswered: S = {};
export const LinkedToService: S = { args: { inquiry: inquiries[0], job: jobs.find((j) => j.id === inquiries[0].jobId) } };
export const Replied: S = { args: { inquiry: inquiries[2] } };
export const RepliedThisSession: S = { args: { repliedAt: '10:25' } };
