import { TodayDialogs as PublicTodayDialogs } from '../../index';
import { branch, onHandElsewhere, type Job, type Product } from './data';

export type DialogState = { kind: 'transfer' | 'eta'; job: Job; product: Product } | null;

/** The two resolve dialogs behind a PartChip: the public TodayDialogs, with the sample branch's locations. */
export function TodayDialogs({ dialog, onClose, onTransfer, onEta }: {
  dialog: DialogState; onClose: () => void; onTransfer: (job: Job, product: Product) => void; onEta: (job: Job, product: Product, time: string) => void;
}) {
  const away = dialog ? onHandElsewhere(dialog.product)[0] : undefined;
  return (
    <PublicTodayDialogs
      dialog={dialog} onClose={onClose} onTransfer={onTransfer} onEta={onEta}
      fromLocation={away ? `${away.name} (${away.qty} on hand)` : null}
      toLocation={`${branch.name} stockroom`}
    />
  );
}
