import type { Meta, StoryObj } from '@storybook/react';
import { QuotationDoc, QuotationModal } from './QuotationDoc';
import { jobs } from './sms/data';
import { docFromJob } from './sms/wizardModel';

const parked = jobs.find((j) => j.status === 'QUOTATION')!;

const meta: Meta<typeof QuotationDoc> = {
  title: 'Components/SMS/Quotation',
  component: QuotationDoc,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { doc: docFromJob(parked) },
};
export default meta;
type S = StoryObj<typeof QuotationDoc>;

export const View: S = {};
export const BookParkedQuote: S = { render: (a) => <QuotationModal doc={a.doc} actions={{ onBook: () => {}, onEdit: () => {} }} onClose={() => {}} />, parameters: { layout: 'fullscreen' } };
export const EditParkedQuote: S = { render: (a) => <QuotationModal doc={a.doc} actions={{ onBook: () => {}, onEdit: () => {} }} note="Waiting for the customer." onClose={() => {}} />, parameters: { layout: 'fullscreen' } };
export const UsedQuote: S = { render: (a) => <QuotationModal doc={a.doc} note="Booked as a job." onClose={() => {}} />, parameters: { layout: 'fullscreen' } };
