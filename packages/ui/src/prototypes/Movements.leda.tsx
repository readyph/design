import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ArrowSquareOut, ArrowsDownUp, ArrowsLeftRight, ChatCircleText } from '@phosphor-icons/react';
import { Chat, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, usePersistedChat, type ChatBlock, type ChatChip, type ChatMessageData } from '../components/Chat';
import { CommandPalette, type CommandPaletteGroup } from '../components/CommandPalette';
import type { createMovementsModel } from './Movements.data';

/* RDY-407 (f). Ask Leda for Movements: the conversation (movements.js 592-609 reply, 703 leda config) and the palette (movements.js 610-625 paletteGroups).
   Left out on purpose: the "Prototype states" group (movements.js 619-623) and "Pretend ... checked in" rows, which reload the workshop page with URL params; Storybook stories are those states. */
type Model = ReturnType<typeof createMovementsModel>;
export interface MovementsLedaCtx {
  M: Model;
  openTr: (id: string) => void;
  openRecord: () => void;
  startForm: () => void;
  go: (name: string) => void;
}

const chips = (qs: string[]): ChatChip[] => qs.map((q) => ({ id: q, label: q }));

function reply(M: Model, qs: string): ChatBlock[] | null {
  const { D, can, plr, TST, isA, mgr, Mgr } = M;
  const Q = String(qs).trim().toLowerCase();
  const refuse = (line: string, way: string): ChatBlock[] => [{ type: 'refuse', text: line }, { type: 'chips', chips: chips([way]) }];
  const m = /tr-\d{3,4}/.exec(Q), t = m ? M.trs().find((x) => x.id.toLowerCase() === m[0]) : null;
  if (t) return [{ type: 'text', text: `${t.id} ${t.out ? 'to' : 'from'} ${t.other.name} is ${TST[t.status].toLowerCase()}. ${M.qtyWords(t)}: ${M.namesOf(t)}.` }, { type: 'actions', actions: [{ id: `tr:${t.id}`, label: `Open ${t.id}` }] }];
  if (/\b(value|valuation|worth)\b/.test(Q)) return refuse(`Stock value is for managers. ${Mgr()} can see it.`, 'See units on hand instead');
  if (/\b(write off|written off|count|correct|damaged)\b/.test(Q)) {
    if (!can('adjust_stock')) return refuse(`Damaged stock and count corrections are for managers. ${Mgr()} can record them.`, `Leave it for ${mgr()}`);
    return [{ type: 'text', text: 'I never change stock on my own. Open Record movement and choose Damaged or lost, or Count correction. It asks you to confirm, and you can undo it.' }, { type: 'actions', actions: [{ id: 'record', label: 'Record movement' }] }];
  }
  if (/transfer|send|distribute|branch|kapitolyo|marikina|kiosk|katipunan/.test(Q)) {
    const o = M.open();
    return [{ type: 'text', text: o.length ? `${plr(o.length, 'transfer is', 'transfers are')} open: ${o.map((x) => `${x.id} ${x.out ? 'to' : 'from'} ${x.other.short} (${TST[x.status].toLowerCase()})`).join(', ')}.` : 'No transfer is open.' }];
  }
  if (/moved|movement|today|happen/.test(Q)) {
    const td = (D.movements as { day: string; qty: number; p: string }[]).filter((r) => r.day === 'today');
    const first = td[0];
    return [{ type: 'text', text: td.length ? `${plr(td.length, 'movement')} today: ${td.filter((r) => r.qty > 0).length} in, ${td.filter((r) => r.qty < 0).length} out. The latest is ${first.qty > 0 ? '+' : '−'}${Math.abs(first.qty)} ${(M.prod(first.p) as { name?: string } | undefined)?.name}.` : 'Nothing has moved today yet.' }];
  }
  const x = (D.ask as { q: string; kind: string; a: string }[]).find((y) => y.q.toLowerCase() === Q);
  if (x && x.kind === 'text') return [{ type: 'text', text: x.a }];
  void isA;
  return null;
}

/** The palette and the conversation. `open()` takes the place of the shell's command bar; `ask(q)` is `Sh.ask`. */
export function useMovementsLeda(c: MovementsLedaCtx, trId: string | null): { open: () => void; ask: (q: string) => void; active: boolean; node: ReactNode } {
  const [palette, setPalette] = useState(false);
  const [chat, setChat] = useState(false);
  const [messages, setMessages] = usePersistedChat<ChatMessageData[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const opener = useRef<HTMLElement | null>(null);
  const seq = useRef(0);
  const chatOpen = useRef(false);
  chatOpen.current = chat;
  const returnRef = useRef({ get current() { return chatOpen.current ? document.querySelector<HTMLElement>('[data-chat-composer]') : opener.current; } }).current as { current: HTMLElement | null };
  const ref = useRef(c);
  ref.current = c;
  const { M } = c;
  const { can, isA } = M;
  const scopeLabel = trId ? `About ${trId}` : 'About stock movements';
  const open = () => { opener.current = document.activeElement as HTMLElement | null; setPalette(true); };
  const openChat = () => { opener.current = document.activeElement as HTMLElement | null; setPalette(false); setChat(true); };
  const send = useCallback((q: string) => {
    if (busy || !q.trim()) return;
    const id = `m${++seq.current}`;
    const cur = ref.current.M;
    setText(''); setBusy(true);
    const owner = { name: (cur.D.viewer as { name?: string; short: string }).name ?? (cur.D.viewer as { short: string }).short };
    const time = cur.D.now.time as string;
    setMessages((m) => [...m, { id, from: 'owner', name: owner.name, time, scope: scopeLabel, blocks: [{ type: 'text', text: q }] }, { id: `${id}l`, from: 'leda', name: 'Leda', time, thinking: true, blocks: [] }]);
    window.setTimeout(() => {
      const r = reply(ref.current.M, q) ?? [{ type: 'text', text: 'I can answer questions about the movements and transfers on this page. Try one of these.' } as ChatBlock, { type: 'chips', chips: chips(['What moved today?']) } as ChatBlock];
      setMessages((m) => m.map((x) => (x.id === `${id}l` ? { ...x, thinking: false, blocks: r } : x)));
      setBusy(false);
    }, 1000);
  }, [busy, scopeLabel, setMessages]);
  const ask = (q: string) => { if (!q.trim()) return; openChat(); send(q); };
  const where = `Where is ${isA ? 'TR-0030' : 'TR-0013'}?`;
  const suggest = ['What moved today?', where].concat(can('adjust_stock') ? [] : ['Write off damaged stock']).slice(0, 3);
  const act = (id: string) => {
    const k = ref.current;
    if (id.startsWith('tr:')) { setChat(false); k.openTr(id.slice(3)); }
    else if (id === 'record') { setChat(false); k.openRecord(); }
  };
  const match = (s: string) => !query.trim() || query.trim().toLowerCase().split(/\s+/).every((w) => s.toLowerCase().includes(w));
  const groups: CommandPaletteGroup[] = [
    { id: 'actions', label: 'Actions', items: [
      ...(can('stock_out') && match('Record movement') ? [{ id: 'act:record', label: 'Record movement', icon: ArrowsDownUp }] : []),
      ...(can('transfer') && match('New transfer') ? [{ id: 'act:newtr', label: 'New transfer', icon: ArrowSquareOut }] : []),
    ] },
    { id: 'transfers', label: 'Transfers', items: M.trs().filter((t) => match(t.id) || match(t.other.name)).slice(0, 5).map((t) => ({ id: `tr:${t.id}`, label: `${t.id} · ${t.out ? 'to' : 'from'} ${t.other.name}`, icon: ArrowsLeftRight, meta: M.TST[t.status] })) },
    { id: 'ask', label: 'Ask Leda', items: ['What moved today?', where].filter(match).map((x) => ({ id: `q:${x}`, label: x, icon: ChatCircleText })) },
    { id: 'go', label: 'Go to', items: ['Home', 'Products', 'Purchase orders', 'Reports'].filter(match).map((n) => ({ id: `go:${n}`, label: n, icon: ArrowRight })) },
  ].filter((g) => g.items.length);
  const node = (
    <>
      <CommandPalette
        open={palette}
        onOpenChange={setPalette}
        groups={groups}
        filter={false}
        placeholder="Ask Leda or tell it what to do"
        onAsk={ask}
        query={query}
        onQueryChange={setQuery}
        conversationMessages={messages.length}
        onOpenConversation={openChat}
        returnFocusRef={returnRef}
        onSelect={(item) => {
          if (item.id.startsWith('q:')) ask(item.id.slice(2));
          else if (item.id === 'act:record') { setPalette(false); c.openRecord(); }
          else if (item.id === 'act:newtr') { setPalette(false); c.startForm(); }
          else if (item.id.startsWith('tr:')) { setPalette(false); c.openTr(item.id.slice(3)); }
          else if (item.id.startsWith('go:')) { setPalette(false); c.go(item.id.slice(3)); }
        }}
      />
      {chat && (
        <Chat onClose={() => setChat(false)} returnFocusTo={opener}>
          <ChatHeader busy={busy} empty={messages.length === 0} onNewConversation={() => setMessages([])} onClose={() => setChat(false)} />
          {messages.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto"><ChatEmpty scope={trId ?? 'Movements'} chips={chips(suggest)} onPick={(x) => send(x.label)} /></div>
          ) : (
            <ChatThread>
              {messages.map((m) => (<ChatMessage key={m.id} message={m} onChip={(x) => send(x.label)} onAction={(a) => act(a.id)} />))}
            </ChatThread>
          )}
          <ChatComposer value={text} onChange={setText} onSend={send} busy={busy} scope={scopeLabel} />
        </Chat>
      )}
    </>
  );
  return { open, ask, active: palette || chat, node };
}
