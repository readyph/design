import { useState } from 'react';
import { PlatformLogo } from './PlatformLogo';
import { Toaster } from './toast/Toaster';
import { toast } from './toast/toastStore';
import type { SelectOption } from './Select';
import { TopicDocument, UnsavedLeaveDialog, useUnsavedGuard, type TopicDocumentError, type TopicDocumentProps, type TopicDocumentTopic } from './TopicDocument';

/** Sample data and a stateful page for the stories and tests. Not exported from the package. */

export const customTopic: TopicDocumentTopic = {
  id: 'c1',
  title: 'Warranty on repairs',
  body: 'Every repair carries a 30 day or 1,000 km warranty on labour. Parts follow the maker’s own warranty.\n\nBring the job order when you come back, so we can find the work quickly.',
  source: 'Custom',
  sourceKind: 'custom',
  on: true,
  questions: ['Is there a warranty on repairs?', 'How long does the warranty last?', 'Are parts covered too?'],
  lastChanged: 'Last edited Tue 20 Oct · Auto Works',
};

export const dataTopic: TopicDocumentTopic = {
  id: 'd1',
  title: 'Services and prices',
  body: 'Oil change from ₱1,200, brake pads from ₱3,500, full diagnostics ₱800. Prices include labour; parts are quoted before work starts. Ask the front desk about fleet rates.',
  source: 'From Auto Works data',
  sourceKind: 'data',
  on: true,
  questions: ['How much is an oil change?'],
  lastChanged: 'Last changed Mon 19 Oct, when Auto Works data changed · Auto Works',
};

export const lockedTopic: TopicDocumentTopic = { ...dataTopic, id: 'd2', title: 'Payment details', body: 'Cash, GCash and cards at the counter. Bank transfer details are for staff only.', on: false, locked: true, lockNote: 'Customers would see what you pay.', questions: ['Can I pay with GCash?'] };

export const folderOptions: SelectOption[] = ['Company', 'Auto Works', 'Café POS'].map((l) => ({ value: l.toLowerCase(), label: l, icon: <PlatformLogo name={l} size={16} decorative /> }));

const taken = ['senior citizen discount', 'where to park'];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A page around TopicDocument: saves after a delay (`delay`), checks the title is unique (case-insensitive),
 * the memory room and an edit conflict (title "Conflict"), switches save at once with Undo, Delete confirms then
 * shows Undo, and leaving with unsaved text asks first.
 */
export function TopicDocumentPage({ initial = customTopic, delay = 400, room = { max: 16000, others: 12500 }, ...props }: Partial<TopicDocumentProps> & { initial?: TopicDocumentTopic; delay?: number }) {
  const [topic, setTopic] = useState<TopicDocumentTopic | undefined>(props.isNew ? undefined : initial);
  const [folder, setFolder] = useState('auto works');
  const [dirty, setDirty] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  useUnsavedGuard(dirty);

  const onSave: NonNullable<TopicDocumentProps['onSave']> = async (d) => {
    await wait(delay);
    const t = d.title.toLowerCase();
    if (taken.includes(t) && t !== topic?.title.toLowerCase()) return { error: 'A memory with this title already exists.', field: 'title' } satisfies TopicDocumentError;
    if (t === 'conflict') return { error: 'This memory was changed by someone else. Reload and try again.' } satisfies TopicDocumentError;
    if (d.body.length + d.title.length > room.max - room.others) return { error: 'The memory is full. Shorten or delete entries first.', field: 'body' } satisfies TopicDocumentError;
    setTopic({ ...(topic ?? { id: 'n1', source: 'Custom', sourceKind: 'custom', on: true }), title: d.title, body: d.body, lastChanged: 'Last edited just now' });
  };
  const onToggle = (next: boolean) => {
    if (!topic) return;
    setTopic({ ...topic, on: next });
    toast.undo(`${topic.title} is ${next ? 'on' : 'off'} for customers.`, () => setTopic((t) => t && { ...t, on: !next }));
  };
  const onDelete = async () => {
    await wait(delay);
    setGone(true);
    toast.undo(`${topic?.title} was deleted.`, () => setGone(false));
  };

  return (
    <>
      <TopicDocument
        {...props}
        topic={topic}
        missing={gone}
        onBack={() => setLeaving(true)}
        folders={folderOptions}
        folder={folder}
        onFolderChange={setFolder}
        room={room}
        edit={{ href: '#auto-works', label: 'Auto Works' }}
        origin="Auto Works"
        onSave={onSave}
        onToggle={onToggle}
        onDelete={onDelete}
        onDiscard={() => undefined}
        onTry={(q) => toast.info(`Try it opens on “${q}”.`)}
        onDirtyChange={setDirty}
      />
      <UnsavedLeaveDialog open={leaving && dirty} title={topic?.title} onStay={() => setLeaving(false)} onLeave={() => setLeaving(false)} />
      <Toaster />
    </>
  );
}
