import { useCallback, useRef, useState } from 'react';
import { ArrowsLeftRight, ClipboardText, Hash, PencilSimple, Table, Wrench } from '@phosphor-icons/react';
import {
  Chat, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, CommandPalette, toast, usePersistedChat,
  type ChatMessageData, type ChatProposalData, type CommandPaletteGroup, type CommandPaletteItem,
} from '../../index';
import { jobs, ledaChips, ledaProposals, manager, peso, jobBalance, customerOf, type LedaProposalData } from './data';

const clock = () => '10:20 AM';
let seq = 100;

const toProposal = (p: LedaProposalData): ChatProposalData => ({
  id: p.id.toUpperCase(), title: p.title, writes: p.writes, cannot: p.cannot, confirmLabel: p.confirmLabel,
  notes: [p.why], after: `${p.confirmLabel}: done.`, extraLabel: undefined,
});
const lp = (id: string) => ledaProposals.find((p) => p.id === id)!;

function reply(q: string): ChatMessageData['blocks'] {
  const t = q.toLowerCase();
  const chips = [{ id: 'f1', label: 'Who still owes us money?' }, { id: 'f2', label: 'What is Jun working on?' }];
  if (t.includes('12:00') || t.includes('finish'))
    return [
      { type: 'text', text: 'JO-0413 (11:30) and JO-0408 (12:00) are on track. JO-0410 is already past its 10:00 time. JO-0412 cannot finish until the alternator arrives.', stream: true },
      { type: 'meta', text: 'Read from Services and Parts Stockroom, 10:20' },
      { type: 'chips', chips },
    ];
  if (t.includes('jun'))
    return [
      { type: 'text', text: 'Jun has 5 active services. JO-0413 and JO-0408 are in progress, JO-0415 and JO-0417 are to-do, and JO-0412 is on hold for the alternator.', stream: true },
      { type: 'meta', text: 'Read from Services, 10:20' },
      { type: 'chips', chips: [{ id: 'f3', label: 'Move JO-0417 from Jun to Ricky' }] },
    ];
  if (t.includes('owe') || t.includes('money')) {
    const rows = jobs.filter((j) => j.status === 'FOR_PICKUP' && jobBalance(j) > 0).map((j) => ({ svc: j.number, customer: customerOf(j).name, balance: peso(jobBalance(j)) }));
    return [
      { type: 'text', text: `${rows.length} cars are ready and not fully paid.`, stream: true },
      { type: 'table', caption: 'Unpaid at pick-up', columns: [{ key: 'svc', label: 'Service' }, { key: 'customer', label: 'Customer' }, { key: 'balance', label: 'Balance', align: 'right' }], rows },
      { type: 'meta', text: 'Read from Services, 10:20' },
    ];
  }
  if (t.includes('ranger') || t.includes('pad'))
    return [
      { type: 'text', text: 'Bendix front pads: 2 here, 0 at Main warehouse. PO-0233 brings 6 on Wed 14:00. Two quotes already need them.', stream: true },
      { type: 'meta', text: 'Read from Parts Stockroom, 10:18' },
      { type: 'chips', chips: [{ id: 'f4', label: 'Add Bendix front pads to the order list' }] },
    ];
  if (t.includes('alternator') || t.includes('0412') || t.includes('transfer'))
    return [{ type: 'text', text: 'Here is the change. Nothing is written until you confirm.' }, { type: 'proposal', blockId: `lp1-${seq}`, proposal: toProposal(lp('lp1')) }];
  if (t.includes('ricky') || t.includes('0417') || t.includes('move'))
    return [{ type: 'text', text: 'Here is the change. Nothing is written until you confirm.' }, { type: 'proposal', blockId: `lp2-${seq}`, proposal: toProposal(lp('lp2')) }];
  if (t.includes('remind') || t.includes('quote'))
    return [{ type: 'text', text: 'Here is the change. Nothing is written until you confirm.' }, { type: 'proposal', blockId: `lp3-${seq}`, proposal: toProposal(lp('lp3')) }];
  if (t.includes('order list'))
    return [{ type: 'text', text: 'Here is the change. Nothing is written until you confirm.' }, { type: 'proposal', blockId: `lp4-${seq}`, proposal: toProposal(lp('lp4')) }];
  if (t.includes('pay') || t.includes('refund'))
    return [{ type: 'refusal', text: "Leda can't record payments or refunds. That stays with you at the counter.", actions: [{ id: 'go', label: 'Open the Counter lane', href: '#counter' }] }];
  return [{ type: 'text', text: "Sorry, I can't answer that in this prototype.", stream: true }, { type: 'chips', chips: ledaChips.slice(0, 2).map((c, i) => ({ id: `u${i}`, label: c })) }];
}

const PALETTE: CommandPaletteGroup[] = [
  { id: 'ask', label: 'Ask Leda', items: [
    { id: `ask:${ledaChips[0]}`, label: ledaChips[0]!, icon: Hash }, { id: `ask:${ledaChips[1]}`, label: ledaChips[1]!, icon: Hash },
    { id: `ask:${ledaChips[2]}`, label: ledaChips[2]!, icon: Table }, { id: `ask:${ledaChips[3]}`, label: ledaChips[3]!, icon: Hash },
  ] },
  { id: 'do', label: 'Tell Leda to do', items: [
    { id: 'ask:Get the alternator for JO-0412', label: 'Get the alternator for JO-0412', icon: ArrowsLeftRight, meta: 'you confirm' },
    { id: 'ask:Move JO-0417 from Jun to Ricky', label: 'Move JO-0417 from Jun to Ricky', icon: PencilSimple, meta: 'you confirm' },
    { id: 'ask:Remind customers about their quotes', label: 'Remind customers about their quotes', icon: PencilSimple, meta: 'you confirm' },
    { id: 'ask:Record a payment', label: 'Record a payment', icon: PencilSimple, refused: true, meta: 'you do this' },
  ] },
  { id: 'go', label: 'Go to', items: [
    { id: 'nav:today', label: 'Today', icon: Wrench },
    { id: 'nav:services', label: 'Services', icon: ClipboardText, meta: 'all service orders' },
  ] },
];

/**
 * The Portal's Leda behaviour on SMS: the Ask Leda bar opens the command palette; Enter on "Ask Leda: ..." (or a row) opens the 440px conversation
 * panel (Chat family, workshop layout) with the page's scope. The thread persists in sessionStorage until the panel's "New conversation".
 */
export function useSmsLeda({ onConfirmed, startOpen = false, scope: SCOPE = 'Today', handle, chips = ledaChips }: {
  onConfirmed?: (proposalId: string) => void; startOpen?: boolean;
  /** Page scope shown in the composer and placeholder. */
  scope?: string;
  /** Page-specific answers (Services: filter the list). Return null to fall through to the shared replies. */
  handle?: (q: string) => ChatMessageData['blocks'] | null;
  /** Starter questions in the empty conversation. */
  chips?: string[];
} = {}) {
  const [palette, setPalette] = useState(false);
  const [chat, setChatRaw] = useState(startOpen);
  const [chatClosing, setChatClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = usePersistedChat<ChatMessageData[]>([], 'rph-sms-leda-v1');
  const handleRef = useRef(handle);
  handleRef.current = handle;
  const opener = useRef<HTMLElement | null>(null);
  const paletteReturn = useRef<HTMLElement | null>(null);

  /** Closing keeps the panel mounted for the library's 220ms slide-out (Chat `closing`), then unmounts. */
  const setChat = (on: boolean) => {
    if (on) { setChatClosing(false); setChatRaw(true); return; }
    setChatClosing(true);
    window.setTimeout(() => { setChatRaw(false); setChatClosing(false); }, 220);
  };
  const capture = () => { const a = document.activeElement as HTMLElement | null; opener.current = a && a !== document.body ? a : null; };
  const openPalette = () => { capture(); setPalette(true); };
  const openChat = () => { if (!palette) capture(); setPalette(false); setChat(true); };

  const send = useCallback((q: string) => {
    const id = `m${++seq}`;
    setText(''); setBusy(true);
    setMessages((m) => [...m,
      { id, from: 'owner', name: manager.short, time: clock(), scope: `About ${SCOPE}`, blocks: [{ type: 'text', text: q }] },
      { id: `${id}l`, from: 'leda', name: 'Leda', time: clock(), thinking: true, blocks: [] },
    ]);
    window.setTimeout(() => { setMessages((m) => m.map((x) => (x.id === `${id}l` ? { ...x, thinking: false, blocks: handleRef.current?.(q) ?? reply(q) } : x))); setBusy(false); }, 1000);
  }, [setMessages]);
  const ask = (q: string) => { openChat(); send(q); };
  const setBlock = (blockId: string, st: ChatProposalData['state'], extra: Partial<ChatProposalData> = {}) =>
    setMessages((ms) => ms.map((m) => ({ ...m, blocks: m.blocks.map((b) => (b.type === 'proposal' && b.blockId === blockId ? { ...b, proposal: { ...b.proposal, state: st, ...extra } } : b)) })));

  paletteReturn.current = chat ? document.querySelector<HTMLElement>('[data-chat-composer]') : palette ? opener.current : null;

  const node = (
    <>
      <CommandPalette
        open={palette} onOpenChange={setPalette} groups={PALETTE}
        onSelect={(i: CommandPaletteItem) => { if (i.id.startsWith('ask:')) ask(i.id.slice(4)); }}
        onAsk={ask} query={query} onQueryChange={setQuery}
        conversationMessages={messages.length} onOpenConversation={openChat}
        returnFocusRef={paletteReturn} placeholder={`Ask Leda about ${SCOPE} or tell her what to do`}
      />
      {chat && (
        <Chat onClose={() => setChat(false)} closing={chatClosing} returnFocusTo={opener}>
          <ChatHeader layout="inline" busy={busy} empty={messages.length === 0} onNewConversation={() => setMessages([])} onClose={() => setChat(false)} />
          {messages.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto pt-2"><ChatEmpty layout="workshop" scope={SCOPE} chips={chips.map((q) => ({ id: q, label: q }))} onPick={(c) => send(c.label)} /></div>
          ) : (
            <ChatThread>
              {messages.map((m) => (
                <ChatMessage
                  key={m.id} message={m} layout="workshop" initials={manager.initials} onChip={(c) => send(c.label)}
                  onConfirm={(bid) => {
                    setBlock(bid, 'writing');
                    return new Promise<void>((res) => window.setTimeout(() => {
                      setBlock(bid, 'done', { doneAt: clock() });
                      onConfirmed?.(bid.split('-')[0]!);
                      toast.undo('Done. Leda wrote the change.', () => setBlock(bid, 'waiting'), { leda: true });
                      res();
                    }, 800));
                  }}
                  onDiscard={(bid) => setBlock(bid, 'discarded')}
                />
              ))}
            </ChatThread>
          )}
          <ChatComposer layout="workshop" label="Message Leda" placeholder="Reply to Leda" value={text} onChange={setText} onSend={send} busy={busy} scope={`About ${SCOPE}`} />
        </Chat>
      )}
    </>
  );
  return { node, openPalette, openChat, paused: palette || chat, chatOpen: chat };
}
