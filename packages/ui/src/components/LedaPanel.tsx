import { useCallback, useRef, useState } from 'react';
import {
  Chat, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, usePersistedChat,
  type ChatMessageData, type ChatProposalData,
} from './Chat';
import { CommandPalette, type CommandPaletteGroup, type CommandPaletteItem } from './CommandPalette';
import { toast } from './toast/toastStore';
import type { LedaProposalData } from './today/types';

let seq = 100;
const fmtClock = () => new Date().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });

/** A `LedaProposalData` as the conversation's proposal card. Nothing is written until the manager confirms. */
export const toChatProposal = (p: LedaProposalData): ChatProposalData => ({
  id: p.id.toUpperCase(), title: p.title, writes: p.writes, cannot: p.cannot, confirmLabel: p.confirmLabel,
  notes: [p.why], after: `${p.confirmLabel}: done.`, extraLabel: undefined,
});

export interface LedaPanelOptions {
  /** The manager asking: short name and initials for the thread. */
  person: { short: string; initials: string };
  /** Everything Leda may propose. Each renders as a confirm/discard card from its `LedaProposalData`; `answer` shows one with `ctx.proposal(id)`. */
  proposals?: LedaProposalData[];
  /** Answers a question with message blocks, or null for "I can't answer that". */
  answer: (q: string, ctx: { proposal: (id: string) => ChatMessageData['blocks'] }) => ChatMessageData['blocks'] | null;
  /** Command palette groups ("Ask Leda", "Tell Leda to do", "Go to"). Items whose id starts with `ask:` ask the rest of the id. */
  palette: CommandPaletteGroup[];
  /** Called with the proposal id when the manager confirms a proposal in the conversation (after the write finishes). The page writes the change here. */
  onConfirmed?: (proposalId: string) => void;
  /** Called with the proposal id when the manager discards a proposal. */
  onDiscarded?: (proposalId: string) => void;
  /** Called when the manager navigates from the palette ("nav:today"). */
  onNavigate?: (target: string) => void;
  startOpen?: boolean;
  /** Page scope shown in the composer and placeholder. */
  scope?: string;
  /** Starter questions in the empty conversation. */
  chips?: string[];
  /** The time stamped on messages (default: the real time). */
  clock?: () => string;
  /** sessionStorage key of the persisted thread. */
  storageKey?: string;
}

const proposalBlocks = (p: LedaProposalData): ChatMessageData['blocks'] => [
  { type: 'text', text: 'Here is the change. Nothing is written until you confirm.' },
  { type: 'proposal', blockId: `${p.id}-${++seq}`, proposal: toChatProposal(p) },
];

/**
 * Leda behaviour for a page: the Ask Leda bar opens the command palette; Enter on "Ask Leda: ..." (or a row) opens the 440px conversation
 * panel (Chat family, workshop layout) with the page's scope. The thread persists in sessionStorage until the panel's "New conversation".
 * Returns `node` (render it once on the page), `openPalette`, `openChat`, `paused` (a layer is open) and `chatOpen`.
 */
export function useLedaPanel({ person, proposals = [], answer, palette: groups, onConfirmed, onDiscarded, onNavigate, startOpen = false, scope: SCOPE = 'Today', chips = [], clock = fmtClock, storageKey = 'rph-leda-v1' }: LedaPanelOptions) {
  const [palette, setPalette] = useState(false);
  const [chat, setChatRaw] = useState(startOpen);
  const [chatClosing, setChatClosing] = useState(false);
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = usePersistedChat<ChatMessageData[]>([], storageKey);
  const answerRef = useRef(answer);
  answerRef.current = answer;
  const proposalsRef = useRef(proposals);
  proposalsRef.current = proposals;
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
      { id, from: 'owner', name: person.short, time: clock(), scope: `About ${SCOPE}`, blocks: [{ type: 'text', text: q }] },
      { id: `${id}l`, from: 'leda', name: 'Leda', time: clock(), thinking: true, blocks: [] },
    ]);
    window.setTimeout(() => { setMessages((m) => m.map((x) => (x.id === `${id}l` ? { ...x, thinking: false, blocks: answerRef.current(q, { proposal: (id) => { const p = proposalsRef.current.find((x) => x.id === id); return p ? proposalBlocks(p) : []; } }) ?? [{ type: 'text', text: "Sorry, I can't answer that yet." }] } : x))); setBusy(false); }, 1000);
  }, [setMessages, clock, person.short, SCOPE]);
  const ask = (q: string) => { openChat(); send(q); };
  const setBlock = (blockId: string, st: ChatProposalData['state'], extra: Partial<ChatProposalData> = {}) =>
    setMessages((ms) => ms.map((m) => ({ ...m, blocks: m.blocks.map((b) => (b.type === 'proposal' && b.blockId === blockId ? { ...b, proposal: { ...b.proposal, state: st, ...extra } } : b)) })));

  paletteReturn.current = chat ? document.querySelector<HTMLElement>('[data-chat-composer]') : palette ? opener.current : null;

  const node = (
    <>
      <CommandPalette
        open={palette} onOpenChange={setPalette} groups={groups}
        onSelect={(i: CommandPaletteItem) => { if (i.id.startsWith('ask:')) ask(i.id.slice(4)); else if (i.id.startsWith('nav:')) onNavigate?.(i.id.slice(4)); }}
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
                  key={m.id} message={m} layout="workshop" initials={person.initials} onChip={(c) => send(c.label)}
                  onConfirm={(bid) => {
                    setBlock(bid, 'writing');
                    return new Promise<void>((res) => window.setTimeout(() => {
                      setBlock(bid, 'done', { doneAt: clock() });
                      onConfirmed?.(bid.split('-')[0]!);
                      toast.undo('Done. Leda wrote the change.', () => setBlock(bid, 'waiting'), { leda: true });
                      res();
                    }, 800));
                  }}
                  onDiscard={(bid) => { setBlock(bid, 'discarded'); onDiscarded?.(bid.split('-')[0]!); }}
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
