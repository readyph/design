import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, ChatCircleText, Package, Prohibit } from '@phosphor-icons/react';
import { Chat, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, usePersistedChat, type ChatBlock, type ChatChip, type ChatMessageData } from '../components/Chat';
import { CommandPalette, type CommandPaletteGroup } from '../components/CommandPalette';
import type { PData, PProduct } from './Products.data';

/* RDY-404. Ask Leda for Products: the palette (products.js 668-683 paletteGroups) and the conversation (products.js 631-667 reply, 758 leda config).
   The tenant's questions are data.js 188-196 (a) and 294-298 (b); `needs` decides who may ask. */
type Ask = { q: string; needs: string; kind: 'table' | 'text' | 'figure' | 'proposal'; of?: string; a?: string };
const ASK: Record<'a' | 'b', Ask[]> = {
  a: [
    { q: "What's running low?", needs: 'low_stock', kind: 'table', of: 'lowStock' },
    { q: 'What moved today?', needs: 'movements', kind: 'table', of: 'movements' },
    { q: 'Ilan pa ang oil filter?', needs: 'lookup', kind: 'text', a: '4 na lang ang FF-OF20, sa Aisle B. May 6 jobs na naka-book ngayon.' },
    { q: 'How much is our stock worth?', needs: 'valuation', kind: 'figure', of: 'valuation' },
    { q: 'Accept the Petron short', needs: 'accept_variance', kind: 'proposal' },
    { q: 'Reorder oil filters', needs: 'draft_po', kind: 'proposal' },
    { q: 'Is the alternator for JO-0412 ready?', needs: 'lookup', kind: 'text', a: 'Yes, 1 in the Cage. It needs your manager to send transfer TR-0032 before 10:15.' },
  ],
  b: [
    { q: "What's running low?", needs: 'low_stock', kind: 'table', of: 'lowStock' },
    { q: 'What expires this week?', needs: 'lookup', kind: 'table', of: 'expiring' },
    { q: 'How much is our stock worth?', needs: 'valuation', kind: 'figure', of: 'valuation' },
    { q: 'Write off the croissant dough', needs: 'adjust_stock', kind: 'proposal' },
  ],
};

export interface ProductsLedaCtx {
  D: PData;
  tenant: 'a' | 'b';
  can: (p: string) => boolean;
  products: PProduct[];
  total: number;
  onHand: (p: PProduct) => number;
  status: (p: PProduct) => 'ok' | 'low' | 'out';
  addable: (p: PProduct) => boolean;
  suggestQty: (p: PProduct) => number;
  onList: (pid: string) => { list: { sup: string }; line: { qty: number } } | null;
  ordered: (pid: string) => { po: { no: string; expected: string }; qty: number }[];
  shortSup: (id: string) => string;
  supName: (id: string) => string;
  locName: (id: string) => string;
  shortDate: (po: { expected: string }) => string;
  unitOf: (p: { unit: string }, n: number) => string;
  openProduct: (id: string, panel?: 'adjust' | 'list') => void;
  addToList: (pid: string) => void;
  draftAll: () => void;
  go: (name: string) => void;
}

const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`;
const chips = (qs: string[]): ChatChip[] => qs.map((q) => ({ id: q, label: q }));
const table = (caption: string, head: string[], rows: string[][]): ChatBlock => ({ type: 'table', caption, columns: head.map((h, i) => ({ key: `c${i}`, label: h, align: i ? 'right' : 'left' })), rows: rows.map((r) => Object.fromEntries(r.map((c, i) => [`c${i}`, c]))) });

function reply(c: ProductsLedaCtx, qs: string): ChatBlock[] | null {
  const { D } = c, Q = qs.trim().toLowerCase(), Mgr = 'Your manager', mgr = 'your manager';
  const refuse = (line: string, way: string): ChatBlock[] => [{ type: 'refuse', text: line }, { type: 'chips', chips: chips([way]) }];
  const all = c.products;
  if (/\b(value|valuation|worth)\b/.test(Q)) {
    if (!c.can('valuation')) return refuse(`Stock value is for managers. ${Mgr} can do it.`, 'See units on hand instead');
    return [{ type: 'text', text: `${peso((D.categories as { value?: number }[]).reduce((s, x) => s + (x.value || 0), 0))} at cost across ${c.total.toLocaleString('en-US')} products.` }];
  }
  if (Q === "what's running low?" || Q === 'what is running low?') {
    const need = all.filter((p) => c.status(p) !== 'ok').sort((a, b) => c.onHand(a) / a.reorder - c.onHand(b) / b.reorder);
    return [{ type: 'text', text: `${need.length} ${need.length === 1 ? 'product is' : 'products are'} low or out of stock.` }, table('Products low or out of stock', ['Product', 'Left', 'Reorder at'], need.map((p) => [p.name, String(c.onHand(p)), String(p.reorder)]))];
  }
  if (Q === 'how many units are on hand?') return [table('Units on hand', ['Product', 'On hand'], all.slice(0, 8).map((p) => [p.name, String(c.onHand(p))]))];
  if (Q.startsWith('leave it for')) return [{ type: 'text', text: `Okay. It stays in ${mgr}'s list until he decides.` }];
  if (Q === 'read a supplier list') {
    if (!c.can('setup')) return refuse(`Adding products is for managers. ${Mgr} can do it.`, `Leave it for ${mgr}`);
    return [{ type: 'text', text: 'Send me a supplier price list (a photo or a PDF). I list the products I find with their units and costs, and nothing is added until you confirm.' }];
  }
  const t = Q.replace(/[?.!]/g, '');
  const p = all.find((x) => t.includes(x.sku.toLowerCase()) || t.includes(x.name.toLowerCase())) || all.find((x) => x.name.toLowerCase().split(' ').some((w) => w.length > 4 && t.includes(w)));
  if (/\b(send|place|submit)\b.*\b(order|list|po)\b|\bmark\b.*\bsent\b/.test(Q)) {
    if (!c.can('confirm_po')) return refuse(`Marking an order list as sent is for managers. ${Mgr} can do it.`, `Leave it for ${mgr}`);
    return [{ type: 'text', text: 'I never send an order to a supplier. I add to the lists. You print a list and mark it sent when it has gone.' }, { type: 'actions', actions: [{ id: 'order-list', label: 'Open order lists', href: '#order-list' }] }];
  }
  if (/^(draft|make|fill|start)\b.*\b(order lists?|lists)\b|^what needs ordering|^draft the order lists/.test(Q)) {
    const need = all.filter(c.addable);
    if (!need.length) return [{ type: 'text', text: 'Every product that needs stock is on an order list or a purchase order already.' }, { type: 'actions', actions: [{ id: 'order-list', label: 'Open order lists', href: '#order-list' }] }];
    return [
      { type: 'text', text: `${need.length} ${need.length === 1 ? 'product needs' : 'products need'} stock and ${need.length === 1 ? 'is' : 'are'} on no list. I would add ${need.length === 1 ? 'it' : 'them'} to ${need.length === 1 ? 'its supplier’s' : 'each supplier’s'} list. Nothing is sent: ${c.can('confirm_po') ? 'you print each list and mark it sent' : `${Mgr} prints it and marks it sent`}.` },
      table('Products to add', ['Product', 'Supplier', 'Add'], need.map((x) => [x.name, c.shortSup(x.supplier), String(c.suggestQty(x))])),
      { type: 'actions', actions: [{ id: 'draft-all', label: 'Add them all' }] },
    ];
  }
  if (/^(reorder|order|add|draft an order for|draft a reorder for)\b/.test(Q)) {
    if (!p) return [{ type: 'text', text: 'Which product? Tell me its name or SKU.' }];
    const qty = c.suggestQty(p), on = c.onList(p.id);
    if (on) return [{ type: 'text', text: `${p.name} is on the ${c.shortSup(on.list.sup)} order list already: ${on.line.qty}.` }, { type: 'actions', actions: [{ id: 'order-list', label: 'View the list', href: '#order-list' }] }];
    return [{ type: 'text', text: `For ${p.name} I would add ${qty} to the ${c.shortSup(p.supplier)} order list. Nothing is sent: ${c.can('confirm_po') ? 'you print the list and mark it sent' : `${Mgr} prints it and marks it sent`}.` }, { type: 'actions', actions: [{ id: `add:${p.id}`, label: `Add ${qty} to the list` }, { id: `list:${p.id}`, label: 'Change the quantity' }] }];
  }
  if (/\b(adjust|write off|count|correct)\b/.test(Q)) {
    if (!c.can('adjust_stock')) return refuse(`Changing stock counts is for managers. ${Mgr} can do it.`, `Leave it for ${mgr}`);
    return [{ type: 'text', text: p ? `Open ${p.name} and choose Adjust stock. I never change a count on my own.` : 'Open the product and choose Adjust stock. I never change a count on my own.' }, ...(p ? [{ type: 'actions', actions: [{ id: `adjust:${p.id}`, label: `Adjust ${p.sku}` }] } as ChatBlock] : [])];
  }
  if (p && /(where|how many|ilan|on hand|left|stock)/.test(Q)) {
    const n = c.onHand(p), s = c.status(p), ord = c.ordered(p.id)[0];
    return [{ type: 'text', text: `${p.name}: ${n} ${c.unitOf(p, n)} in ${c.locName(p.loc)}. Reorder level ${p.reorder}${s !== 'ok' ? `, so it is ${s === 'out' ? 'out of stock' : 'low on stock'}` : ''}.${ord ? ` ${ord.po.no} brings ${ord.qty} on ${c.shortDate(ord.po)}.` : ''}` }, { type: 'actions', actions: [{ id: `open:${p.id}`, label: `Open ${p.sku}` }] }];
  }
  const a = ASK[c.tenant].find((x) => x.q.toLowerCase() === Q);
  if (a && a.kind === 'text') return [{ type: 'text', text: a.a! }];
  return null;
}

/** The palette and the conversation. `open()` takes the place of the shell's command bar; `ask(q)` is `Sh.ask`. */
export function useProductsLeda(c: ProductsLedaCtx, scope: string, hereId: string | null): { open: () => void; ask: (q: string) => void; active: boolean; node: ReactNode } {
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
  const chatScope = hereId ? `About ${c.products.find((p) => p.id === hereId)?.sku ?? scope}` : `About ${c.D.business.platform} products`;
  const open = () => { opener.current = document.activeElement as HTMLElement | null; setPalette(true); };
  const openChat = () => { opener.current = document.activeElement as HTMLElement | null; setPalette(false); setChat(true); };
  const send = useCallback((q: string) => {
    if (busy || !q.trim()) return;
    const id = `m${++seq.current}`;
    setText(''); setBusy(true);
    const D = ref.current.D, owner = D.viewers[ref.current.can('setup') ? 'manager' : 'clerk'].viewer;
    setMessages((m) => [...m, { id, from: 'owner', name: owner.name, time: D.now.time, scope: chatScope, blocks: [{ type: 'text', text: q }] }, { id: `${id}l`, from: 'leda', name: 'Leda', time: D.now.time, thinking: true, blocks: [] }]);
    window.setTimeout(() => {
      const r = reply(ref.current, q) ?? [{ type: 'text', text: 'I can answer questions about the products on this page. Try one of these.' } as ChatBlock, { type: 'chips', chips: chips(["What's running low?"]) } as ChatBlock];
      setMessages((m) => m.map((x) => (x.id === `${id}l` ? { ...x, thinking: false, blocks: r } : x)));
      setBusy(false);
    }, 1000);
  }, [busy, chatScope, setMessages]);
  const ask = (q: string) => { if (!q.trim()) return; openChat(); send(q); };
  const lowP = c.products.filter(c.addable)[0];
  const suggest = ["What's running low?"].concat(lowP ? [`How many ${lowP.sku} are on hand?`, `Add ${lowP.name} to the order list`, 'Draft the order lists'] : []).slice(0, 4);
  const act = (id: string) => {
    const k = ref.current;
    if (id === 'draft-all') k.draftAll();
    else if (id.startsWith('add:')) k.addToList(id.slice(4));
    else if (id.startsWith('list:')) { setChat(false); k.openProduct(id.slice(5), 'list'); }
    else if (id.startsWith('adjust:')) { setChat(false); k.openProduct(id.slice(7), 'adjust'); }
    else if (id.startsWith('open:')) { setChat(false); k.openProduct(id.slice(5)); }
  };
  const match = (s: string) => !query.trim() || query.trim().toLowerCase().split(/\s+/).every((w) => s.toLowerCase().includes(w));
  const groups: CommandPaletteGroup[] = [
    { id: 'products', label: 'Products', items: c.products.filter((p) => match(p.name) || match(p.sku)).slice(0, 6).map((p) => ({ id: `open:${p.id}`, label: p.name, icon: Package, meta: `${c.onHand(p)} left` })) },
    { id: 'ask', label: 'Ask Leda', items: ASK[c.tenant].filter((a) => a.kind !== 'proposal' && a.of !== 'expiring' && match(a.q)).map((a) => ({ id: `q:${a.q}`, label: a.q, icon: c.can(a.needs) ? ChatCircleText : Prohibit, meta: c.can(a.needs) ? '' : 'Managers only' })) },
    { id: 'go', label: 'Go to', items: [['Home', 'home'], ['Purchase orders', 'pos'], ['Movements', 'moves'], ['Reports', 'reports']].filter(([n]) => match(n)).map(([n, id]) => ({ id: `go:${id}`, label: n, icon: ArrowRight })) },
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
          else if (item.id.startsWith('open:')) { setPalette(false); c.openProduct(item.id.slice(5)); }
          else if (item.id.startsWith('go:')) { setPalette(false); c.go(item.id.slice(3)); }
        }}
      />
      {chat && (
        <Chat onClose={() => setChat(false)} returnFocusTo={opener}>
          <ChatHeader busy={busy} empty={messages.length === 0} onNewConversation={() => setMessages([])} onClose={() => setChat(false)} />
          {messages.length === 0 ? (
            <div className="min-h-0 flex-1 overflow-y-auto"><ChatEmpty scope={scope} chips={chips(suggest)} onPick={(x) => send(x.label)} /></div>
          ) : (
            <ChatThread>
              {messages.map((m) => (<ChatMessage key={m.id} message={m} onChip={(x) => send(x.label)} onAction={(a) => { if (a.href) c.go(a.href.replace(/^#/, '')); else act(a.id); }} />))}
            </ChatThread>
          )}
          <ChatComposer value={text} onChange={setText} onSend={send} busy={busy} scope={chatScope} />
        </Chat>
      )}
    </>
  );
  return { open, ask, active: palette || chat, node };
}
