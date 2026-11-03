import { useState } from 'react';
import { Button } from './Button';
import { DataList } from './DataList';
import { TextField } from './TextField';
import { Modal } from './Modal';

/** What the dialogs show of a job and a part. Any richer job or product (API client types included) satisfies these. */
export interface TodayDialogJob { number: string }
export interface TodayDialogProduct { name: string }

export type TodayDialogState<J extends TodayDialogJob = TodayDialogJob, P extends TodayDialogProduct = TodayDialogProduct> =
  { kind: 'transfer' | 'eta'; job: J; product: P } | null;

export interface TodayDialogsProps<J extends TodayDialogJob = TodayDialogJob, P extends TodayDialogProduct = TodayDialogProduct> {
  /** Which dialog is open, for which job and part; `null` closes both. */
  dialog: TodayDialogState<J, P>;
  onClose: () => void;
  onTransfer: (job: J, product: P) => void;
  onEta: (job: J, product: P, time: string) => void;
  /** Where the part comes from, shown as is, for example "Dela Cruz Parts (3 on hand)". Empty: no other location has it. */
  fromLocation?: string | null;
  /** Where the part goes, for example "Kapitolyo stockroom". */
  toLocation: string;
  /** Time the ETA field starts with (24-hour). */
  defaultTime?: string;
}

/** The two resolve dialogs behind a PartChip: request a transfer, set the expected time. Data-agnostic: the callers pass the locations. */
export function TodayDialogs<J extends TodayDialogJob, P extends TodayDialogProduct>({
  dialog, onClose, onTransfer, onEta, fromLocation, toLocation, defaultTime = '14:30',
}: TodayDialogsProps<J, P>) {
  const [time, setTime] = useState(defaultTime);
  if (!dialog) return null;
  const { job, product } = dialog;
  if (dialog.kind === 'transfer') {
    return (
      <Modal
        open
        onOpenChange={(o) => !o && onClose()}
        title="Request a transfer"
        description="You request it. Staff at the other location send it in Inventory."
        size="sm"
        footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { onTransfer(job, product); onClose(); }}>Request transfer</Button></>}
      >
        <DataList items={[
          { label: 'Part', value: product.name },
          { label: 'From', value: fromLocation || 'No other location has it' },
          { label: 'To', value: toLocation },
          { label: 'Quantity', value: '1' },
          { label: 'For job', value: job.number },
        ]} />
      </Modal>
    );
  }
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="Set expected time"
      description={`When will ${product.name} be here? ${job.number} and the customer's text use it.`}
      size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { onEta(job, product, time); onClose(); }}>Save time</Button></>}
    >
      <TextField label="Expected today at" value={time} onChange={(e) => setTime(e.target.value)} hint="24-hour time, for example 14:30" />
    </Modal>
  );
}
