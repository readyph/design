import type { Meta, StoryObj } from '@storybook/react';
import { useCallback, useRef, useState } from 'react';
import { Chat, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, usePersistedChat, type ChatChip, type ChatMessageData, type ChatProposalData } from './Chat';
import { chatSample } from './Chat.sample';
import { PlatformShell } from './PlatformShell';
import { SheetBar } from './SheetBar';
import { AskLedaBar } from './AskLedaBar';
import { Toaster } from './toast/Toaster';
import { toast } from './toast/toastStore';

/** [For Review] RDY-268 (C8). Prototype only: stories are not exported from the package. The panel in the real PlatformShell, with scripted answers. */
const meta: Meta = {
  title: 'Components/Leda/Leda conversation',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const SCOPE = 'Parts Stockroom';
const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
let seq = 100;

const proposal: ChatProposalData = {
  id: 'CMD-RL',
  title: 'Raise oil filter reorder level to 30',
  writes: ['Oil filter (OF-114) reorder level: 20 to 30'],
  notes: ['Nothing is ordered yet.'],
  confirmLabel: 'Confirm change',
};

function reply(q: string): ChatMessageData['blocks'] {
  const t = q.toLowerCase();
  if (t.includes('reorder')) return [{ type: 'text', text: 'Here is the change. Nothing is written until you confirm.' }, { type: 'proposal', blockId: `CMD-RL-${seq}`, proposal }];
  if (t.includes('disconnect')) return [{ type: 'refusal', text: "Leda can't add, rename or disconnect platforms or change links.", actions: [{ id: 'go', label: 'Go to Parts Stockroom', href: '#parts' }] }];
  if (t.includes('week'))
    return [
      { type: 'text', text: 'Sales are up on last week, and parts moved faster than usual.', stream: true },
      { type: 'figure', value: 'PHP 148,200', label: 'Sales this week', detail: 'Last week PHP 131,900' },
      { type: 'meta', text: 'Read from Auto Works and Parts Stockroom, today' },
      { type: 'chips', chips: [{ id: 'x', label: 'What shares data with what?' }] },
    ];
  if (t.includes('share')) return [{ type: 'text', text: 'Parts Stockroom shares its catalog with Auto Works.', stream: true }, ...chatSample.thread[1]!.blocks.slice(1, 2)];
  return [{ type: 'text', text: "Sorry, I can't answer that in this prototype.", stream: true }, { type: 'chips', chips: chatSample.chips.slice(0, 2) }];
}

function Prototype({ startOpen = false }: { startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [messages, setMessages] = usePersistedChat<ChatMessageData[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const askRef = useRef<HTMLButtonElement>(null);

  const send = useCallback(
    (q: string) => {
      const id = `m${++seq}`;
      setText('');
      setBusy(true);
      setMessages((m) => [
        ...m,
        { id, from: 'owner', name: 'Maria Santos', time: now(), scope: `About ${SCOPE}`, blocks: [{ type: 'text', text: q }] },
        { id: `${id}l`, from: 'leda', name: 'Leda', time: now(), thinking: true, blocks: [] },
      ]);
      // The scripted "model" thinks for ~1s, then answers.
      window.setTimeout(() => {
        setMessages((m) => m.map((x) => (x.id === `${id}l` ? { ...x, thinking: false, blocks: reply(q) } : x)));
        setBusy(false);
      }, 1100);
    },
    [setMessages],
  );
  const pick = (c: ChatChip) => send(c.label);
  const setProposal = (blockId: string, state: ChatProposalData['state'], extra: Partial<ChatProposalData> = {}) =>
    setMessages((ms) => ms.map((m) => ({ ...m, blocks: m.blocks.map((b) => (b.type === 'proposal' && b.blockId === blockId ? { ...b, proposal: { ...b.proposal, state, ...extra } } : b)) })));

  return (
    <>
      <PlatformShell
        place={<div className="px-3 text-ui text-muted">{SCOPE}</div>}
        placeLabel={SCOPE}
        detail
        sheetLabel="Overview"
        status={<span>Leda 1,742 / 2,000</span>}
        sheetBar={<SheetBar actions={<AskLedaBar ref={askRef} scope={SCOPE} onOpen={() => setOpen(true)} />}><span className="text-ui font-medium">Overview</span></SheetBar>}
      >
        <div className="px-pad py-6 text-body">
          <h1 className="text-title">{SCOPE}</h1>
          <p className="mt-2 max-w-prose text-muted">Press Ask Leda (or Cmd K, then Enter) to open the conversation. Try "How did the shop do this week?", "Raise oil filter reorder level to 30", or "Disconnect Parts Stockroom".</p>
        </div>
      </PlatformShell>
      {open && (
        <Chat onClose={() => setOpen(false)} returnFocusTo={askRef}>
          <ChatHeader
            busy={busy}
            empty={messages.length === 0}
            onNewConversation={() => setMessages([])}
            onClose={() => setOpen(false)}
          />
          {messages.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto"><ChatEmpty scope={SCOPE} chips={chatSample.chips} onPick={pick} /></div>
          ) : (
            <ChatThread>
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onChip={pick}
                  onConfirm={(id) => {
                    setProposal(id, 'writing');
                    return new Promise<void>((res) =>
                      window.setTimeout(() => {
                        setProposal(id, 'done', { after: 'Reorder level is now 30.', doneAt: now() });
                        toast.undo('Oil filter reorder level is now 30.', () => setProposal(id, 'waiting'), { leda: true });
                        res();
                      }, 900),
                    );
                  }}
                  onDiscard={(id) => {
                    setProposal(id, 'discarded');
                    toast.undo('Draft discarded.', () => setProposal(id, 'waiting'));
                  }}
                />
              ))}
            </ChatThread>
          )}
          <ChatComposer value={text} onChange={setText} onSend={send} busy={busy} scope={`About ${SCOPE}`} />
        </Chat>
      )}
      <Toaster />
    </>
  );
}

export const PanelClosed: StoryObj = { render: () => <Prototype /> };
export const PanelOpen: StoryObj = { render: () => <Prototype startOpen /> };
