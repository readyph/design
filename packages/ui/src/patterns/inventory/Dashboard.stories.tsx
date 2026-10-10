import type { Meta, StoryObj } from '@storybook/react';
import { useState, type FormEvent } from 'react';
import {
  WaveTriangle,
  ArrowElbowDownLeft,
  Package,
  XCircle,
  CurrencyDollar,
  Camera,
  ArrowDown,
  ArrowUp,
  Warning,
  TrendUp,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { InventoryShell } from './shell';

/**
 * Inventory Dashboard — a Leda command centre for this platform. Leda holds the
 * centre with room for a conversation; a stock-health rail (SKUs, low/out of
 * stock, value), a needs-attention feed, and today's movements run down the
 * right. Inventory-specific, distinct from the Portal control room. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Inventory/Dashboard',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const hr = new Date().getHours();
const period = hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening';

const suggestions = ['What’s low on stock?', 'Receive a delivery', 'New PO from photo', 'Today’s movements'];

const health: { label: string; value: string; delta?: string; icon: PhosphorIcon; tone: string }[] = [
  { label: 'Total SKUs', value: '128', icon: Package, tone: 'text-primary-600' },
  { label: 'Low stock', value: '7', delta: '+2', icon: Warning, tone: 'text-warning' },
  { label: 'Out of stock', value: '2', delta: '+1', icon: XCircle, tone: 'text-error' },
  { label: 'Stock value', value: '₱482k', delta: '+3%', icon: CurrencyDollar, tone: 'text-success' },
];
const deltaColor = (label: string) => (label === 'Low stock' || label === 'Out of stock' ? 'text-error' : 'text-success');

const attention: { icon: PhosphorIcon; tone: 'error' | 'warning'; title: string; detail: string }[] = [
  { icon: XCircle, tone: 'error', title: 'Mango boxes out of stock', detail: 'Reorder point 10 · 0 on hand' },
  { icon: Warning, tone: 'warning', title: 'PO-1043 short-delivered', detail: 'Ordered 12, received 10' },
  { icon: Camera, tone: 'warning', title: 'Unreadable receipt lines', detail: '2 lines need a quick check' },
];

const movements: { product: string; qty: number; reason: string; time: string }[] = [
  { product: 'Calamansi 1kg', qty: 40, reason: 'received · PO-1043', time: '10m' },
  { product: 'Mango boxes', qty: -6, reason: 'sold · ORD-882', time: '22m' },
  { product: 'Pomelo pack', qty: -2, reason: 'damaged', time: '1h' },
  { product: 'Rice 25kg', qty: 15, reason: 'received · PO-1038', time: '2h' },
];

interface Msg { id: number; role: 'user' | 'assistant'; text: string; pending?: boolean }

export const Dashboard: Story = {
  name: 'Dashboard',
  render: function InventoryDashboard() {
    const [draft, setDraft] = useState('');
    const [messages, setMessages] = useState<Msg[]>([]);
    const chatting = messages.length > 0;

    const ask = (text: string) => {
      const t = text.trim();
      if (!t) return;
      const uid = Date.now();
      const aid = uid + 1;
      setMessages((p) => [...p, { id: uid, role: 'user', text: t }, { id: aid, role: 'assistant', text: '', pending: true }]);
      setDraft('');
      window.setTimeout(
        () => setMessages((p) => p.map((m) => (m.id === aid ? { ...m, pending: false, text: '7 items are below their reorder point and 2 are out of stock. Want me to draft reorder POs for them?' } : m))),
        900,
      );
    };
    const submit = (e: FormEvent) => {
      e.preventDefault();
      ask(draft);
    };

    return (
      <InventoryShell active="dashboard" title="Dashboard" scroll={false} hideLeda>
        <div className="flex min-h-0 flex-1">
          {/* Leda command centre */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex max-w-2xl flex-col gap-5 px-6 py-7">
                {!chatting ? (
                  <>
                    <div className="flex items-center gap-3.5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm">
                        <Icon icon={WaveTriangle} size="lg" weight="bold" />
                      </span>
                      <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Good {period}, Maria</h1>
                        <p className="mt-0.5 text-sm text-ink-muted">Ask about stock, or snap a receipt to stock in.</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-surface p-5">
                      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <Icon icon={TrendUp} size="sm" className="text-primary-600" /> Today in inventory
                      </div>
                      <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                        7 items are low and 2 are out of stock. Two purchase orders came in short, and a delivery receipt needs a quick check.
                      </p>
                      <Button className="mt-3" size="sm" variant="subtle" rightIcon={ArrowElbowDownLeft} onClick={() => ask('What needs my attention today?')}>
                        Ask Leda to sort it out
                      </Button>
                    </div>

                    <div>
                      <p className="mb-2.5 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-subtle">Try asking</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => ask(s)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-sm text-ink transition-colors hover:border-primary-300 hover:text-primary-600"
                          >
                            <Icon icon={WaveTriangle} size="sm" className="text-primary-500" weight="bold" />
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((m) =>
                      m.role === 'user' ? (
                        <div key={m.id} className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-primary-600 px-3.5 py-2.5 text-sm text-white">
                          {m.text}
                        </div>
                      ) : (
                        <div key={m.id} className="flex gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white">
                            <Icon icon={WaveTriangle} size="sm" weight="bold" />
                          </span>
                          <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-surface px-3.5 py-2.5 text-sm text-ink">
                            {m.pending ? <span className="text-ink-muted">Thinking…</span> : m.text}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Composer */}
            <div className="px-6 pb-6">
              <div className="mx-auto max-w-2xl">
                <form onSubmit={submit} className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pl-3 pr-2 transition-colors focus-within:border-primary-300">
                  <Icon icon={WaveTriangle} size="md" className="shrink-0 text-primary-500" weight="bold" />
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Stock in a delivery, create a PO, check a product…"
                    className="h-9 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
                  />
                  <button type="submit" aria-label="Send" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-primary-600">
                    <Icon icon={ArrowElbowDownLeft} size="sm" />
                  </button>
                </form>
                <p className="mt-2.5 text-center text-xs text-ink-subtle">Leda can stock in, create POs, and flag variances for you.</p>
              </div>
            </div>
          </div>

          {/* Inventory rail */}
          <aside className="hidden w-[21rem] shrink-0 flex-col gap-6 overflow-y-auto p-5 xl:flex">
            <section>
              <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-subtle">Stock health</p>
              <div className="grid grid-cols-2 gap-3">
                {health.map((s) => (
                  <div key={s.label} className="rounded-xl bg-surface p-3.5">
                    <div className="flex items-center gap-2">
                      <Icon icon={s.icon} size="sm" className={s.tone} />
                      <span className="truncate text-xs text-ink-muted">{s.label}</span>
                    </div>
                    <div className="mt-2 text-xl font-extrabold tabular-nums text-ink">{s.value}</div>
                    {s.delta && <div className={`text-xs font-semibold ${deltaColor(s.label)}`}>{s.delta}</div>}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-subtle">Needs attention</p>
                <Badge tone="warning" size="sm">{attention.length}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {attention.map((a, i) => (
                  <button key={i} className="flex w-full items-start gap-3 rounded-xl bg-surface p-3 text-left transition-colors hover:bg-surface-subtle">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.tone === 'error' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                      <Icon icon={a.icon} size="sm" weight="fill" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug text-ink">{a.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-subtle">{a.detail}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-ink-subtle">Today’s movements</p>
              <div className="flex flex-col gap-1">
                {movements.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-1 py-2">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${m.qty > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      <Icon icon={m.qty > 0 ? ArrowDown : ArrowUp} size="sm" weight="bold" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{m.product}</p>
                      <p className="text-xs text-ink-subtle">{m.reason}</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${m.qty > 0 ? 'text-success' : 'text-error'}`}>{m.qty > 0 ? `+${m.qty}` : m.qty}</span>
                    <span className="w-9 text-right text-xs text-ink-subtle">{m.time}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </InventoryShell>
    );
  },
};
