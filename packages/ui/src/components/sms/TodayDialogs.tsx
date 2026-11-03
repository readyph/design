import { useState } from 'react';
import { Button } from '../Button';
import { DataList } from '../DataList';
import { TextField } from '../TextField';
import { Modal } from '../Modal';
import { branch, onHandElsewhere, type Job, type Product } from './data';

export type DialogState = { kind: 'transfer' | 'eta'; job: Job; product: Product } | null;

/** The two resolve dialogs behind a PartChip. Studio stand-ins: the real ones are TransferForm and a small time field. */
export function TodayDialogs({ dialog, onClose, onTransfer, onEta }: {
  dialog: DialogState; onClose: () => void; onTransfer: (job: Job, product: Product) => void; onEta: (job: Job, product: Product, time: string) => void;
}) {
  const [time, setTime] = useState('14:30');
  if (!dialog) return null;
  const { job, product } = dialog;
  const away = onHandElsewhere(product)[0];
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
          { label: 'From', value: away ? `${away.name} (${away.qty} on hand)` : 'No other location has it' },
          { label: 'To', value: `${branch.name} stockroom` },
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
