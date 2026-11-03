import type { Meta, StoryObj } from '@storybook/react';
import { PaymentPage, type PaymentOverlay, type PaymentProps } from './PaymentPage';
import { PAYMENT_JOBS } from './sms/paymentModel';
import { Remount, control, liveMeta } from './sms/live';

/** [For Review] RDY-536. Prototype only: stories are not exported from the package. Live Payment page: the final price, optional discount, payments, receipt, void and release. All reachable by clicking. */
const JOBS = Object.fromEntries(PAYMENT_JOBS.map((j) => [j.label, j.id]));
type Args = {
  job: string;
  role: 'manager' | 'mechanic';
  state: 'ready' | 'loading';
  overlay: PaymentOverlay;
  method: 'CASH' | 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'CARD' | 'CHECK';
};

export const toProps = (a: Args): PaymentProps => ({ jobId: JOBS[a.job], role: a.role, state: a.state, initialOverlay: a.overlay, initialMethod: a.method });

const meta: Meta<Args> = {
  ...liveMeta,
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Prototypes/SMS/Payment',
  argTypes: {
    job: control.select(Object.keys(JOBS), 'Which job the page opens on: unpaid, part paid, paid, with a discount, a booked quotation, no parts, many lines, still in progress, completed, no lines.', 'Data'),
    role: control.select(['manager', 'mechanic'], 'Manager takes payments and discounts. Mechanic reads the statement only.', 'Data'),
    state: control.select(['ready', 'loading'], 'Data state'),
    overlay: control.select(['none', 'discount', 'add line', 'receipt', 'receipt slip', 'void'], 'Open on load: discount editor, add-a-line form, receipt (A4 or slip), void confirmation.', 'Data'),
    method: control.select(['CASH', 'GCASH', 'MAYA', 'BANK_TRANSFER', 'CARD', 'CHECK'], 'Method preselected in the payment form.', 'Data'),
  },
  args: { job: PAYMENT_JOBS[0].label, role: 'manager', state: 'ready', overlay: 'none', method: 'CASH' },
  render: (a) => <Remount on={a}><PaymentPage {...toProps(a)} /></Remount>,
};
export default meta;
type Story = StoryObj<Args>;

export const ForReview: Story = { name: '[For Review] Payment' };
