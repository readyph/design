import { TodayDialogs as PublicTodayDialogs } from '../TodayDialogs';
import { branch, onHandElsewhere, type Job, type Product } from './data';

export type DialogState = { kind: 'transfer' | 'eta'; job: Job; product: Product } | null;

/** The Storybook mock-data binding of the public TodayDialogs: works out the locations from the sample branch. */
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
