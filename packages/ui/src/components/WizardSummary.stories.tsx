import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { WizardSummary, type BlockId } from './WizardSummary';
import { customers } from './sms/data';
import { typeIdFor } from './sms/catalogue';
import { emptyDraft, linesFromType, type WizardDraft } from './sms/wizardModel';

const meta: Meta<typeof WizardSummary> = {
  title: 'Components/Forms/Wizard summary',
  component: WizardSummary,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="min-h-[640px] w-[760px] max-w-full"><Story /></div>],
};
export default meta;
type S = StoryObj<typeof WizardSummary>;

function Host({ init, bookingQuote }: { init?: Partial<WizardDraft>; bookingQuote?: boolean }) {
  const c = customers[0]!;
  const [draft, setDraft] = useState<WizardDraft>(() => emptyDraft({ customer: c, vehicleId: c.vehicles[0]!.id, lines: linesFromType(typeIdFor('Change oil (Shell Helix 10W-40)')!), ...init }));
  const [editing, setEditing] = useState<BlockId | null>(null);
  return <WizardSummary draft={draft} onChange={(p) => setDraft((d) => ({ ...d, ...p }))} editing={editing} setEditing={setEditing} onPreview={() => {}} quoteNo="QT-0009" bookingQuote={bookingQuote} onDur={(dur) => setDraft((d) => ({ ...d, dur }))} />;
}

export const Review: S = { render: () => <Host /> };
export const WithDetails: S = { name: 'With mileage and concerns', render: () => <Host init={{ mileageIn: '48200', concerns: 'Grinding when braking', remarks: 'Prices good for 7 days.' }} /> };
export const BookingAQuote: S = { name: 'Booking a quote', render: () => <Host bookingQuote /> };
