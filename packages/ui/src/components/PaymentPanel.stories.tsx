import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { BalancePanel, PaidNotice, PaymentList, RecordPayment } from './PaymentPanel';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { fmt, jobFor, methodLabel } from './sms/paymentModel';

const meta: Meta<typeof BalancePanel> = {
  title: 'Components/SMS/Payment panel',
  component: BalancePanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[360px]"><Story /></div>],
  args: { job: jobFor('unpaid') },
};
export default meta;
type S = StoryObj<typeof BalancePanel>;

const form = (id: string) => (
  <BalancePanel job={jobFor(id)}><RecordPayment job={jobFor(id)} onRecord={() => {}} /></BalancePanel>
);

export const Methods: S = { render: () => form('unpaid') };
export const MethodGCash: S = {
  render: () => <BalancePanel job={jobFor('unpaid')}><RecordPayment job={jobFor('unpaid')} onRecord={() => {}} initialMethod="GCASH" /></BalancePanel>,
};
export const PartPayment: S = { render: () => form('partial') };
export const Change: S = {
  render: () => form('unpaid'),
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await userEvent.type(c.getByLabelText('Cash handed over (optional)'), '2000');
  },
};
export const PaidInFull: S = {
  render: () => {
    const job = jobFor('paid');
    const last = job.payments[job.payments.length - 1];
    return (
      <BalancePanel job={job}>
        {last && <PaidNotice>{fmt(last.amount)} received.</PaidNotice>}
        <Button variant="primary" fullWidth>Release car</Button>
      </BalancePanel>
    );
  },
};
export const NotAvailable: S = {
  render: () => <BalancePanel job={jobFor('completed')}><RecordPayment job={jobFor('completed')} onRecord={() => {}} disabledReason="This service is completed, so no more payments can be recorded." /></BalancePanel>,
};

export const Payments: S = {
  decorators: [(Story) => <div className="w-[760px]"><Story /></div>],
  render: () => <PaymentList payments={jobFor('many').payments} canVoid onVoid={() => {}} />,
};
export const NoPayments: S = {
  decorators: [(Story) => <div className="w-[760px]"><Story /></div>],
  render: () => <PaymentList payments={[]} canVoid onVoid={() => {}} />,
};

export const VoidConfirm: S = {
  render: () => {
    const [open, setOpen] = useState(true);
    const p = jobFor('partial').payments;
    const last = p[p.length - 1];
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>Void last payment</Button>
        <ConfirmDialog
          open={open} onOpenChange={setOpen} title="Void the last payment?"
          description="It comes off the payments and the balance goes back up. You can undo this right after."
          name={`${fmt(last.amount)} · ${methodLabel(last.method)}`}
          confirmLabel="Void payment" cancelLabel="Keep it" onCancel={() => setOpen(false)} onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};
