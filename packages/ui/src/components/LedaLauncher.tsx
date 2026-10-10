import { useState, type FormEvent, type HTMLAttributes } from 'react';
import { WaveTriangle, X, ArrowElbowDownLeft } from '@phosphor-icons/react';
import { cn } from '../utils/cn';
import { Icon } from './Icon';
import { IconButton } from './IconButton';
import { Tooltip } from './Tooltip';

interface Msg {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
}

const SUGGESTIONS = ['How are my platforms doing?', 'Show this week’s sales', 'What’s low on stock?'];

export interface LedaLauncherProps extends HTMLAttributes<HTMLDivElement> {}

/** Floating "Ask Leda" button that opens a compact chat popup. Self-contained. */
export function LedaLauncher({ className, ...rest }: LedaLauncherProps) {
  const [open, setOpen] = useState(false);
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
      () =>
        setMessages((p) =>
          p.map((m) => (m.id === aid ? { ...m, pending: false, text: 'Here’s a quick look across your platforms — want me to open the full report?' } : m)),
        ),
      900,
    );
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(draft);
  };

  return (
    <div className={cn('absolute bottom-6 right-6 z-40 flex flex-col items-end gap-3', className)} {...rest}>
      {open && (
        <div className="flex h-[36rem] max-h-[calc(100vh-6rem)] w-[26rem] max-w-[calc(100vw-2rem)] origin-bottom-right animate-[ds-popover-in_140ms_ease] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl motion-reduce:animate-none">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white">
              <Icon icon={WaveTriangle} size="sm" weight="bold" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-ink">Leda</p>
              <p className="text-xs text-ink-muted">AI assistant</p>
            </div>
            <IconButton icon={X} label="Close" variant="subtle" size="sm" className="rounded-full" onClick={() => setOpen(false)} />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 pb-2">
            {!chatting ? (
              <div className="flex flex-col gap-4 pt-2">
                <div>
                  <p className="text-sm font-semibold text-ink">Hi, I’m Leda</p>
                  <p className="mt-1 text-sm text-ink-muted">Ask me anything across your platforms, or pick a prompt below.</p>
                </div>
                <div className="flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="rounded-lg border border-border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-primary-300 hover:text-primary-600"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2">
                {messages.map((m) =>
                  m.role === 'user' ? (
                    <div key={m.id} className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-primary-600 px-3 py-2 text-sm text-white">
                      {m.text}
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-2">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
                        <Icon icon={WaveTriangle} size="sm" weight="bold" />
                      </span>
                      <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-subtle px-3 py-2 text-sm text-ink">
                        {m.pending ? <span className="text-ink-muted">Thinking…</span> : m.text}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={submit} className="p-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface pl-3.5 pr-2 transition-colors focus-within:border-primary-300">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask Leda…"
                className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
              <button
                type="submit"
                aria-label="Send"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-primary-600 focus:outline-none"
              >
                <Icon icon={ArrowElbowDownLeft} size="sm" />
              </button>
            </div>
          </form>
        </div>
      )}

      <Tooltip content="Ask Leda" side="left">
        <button
          type="button"
          aria-label="Ask Leda"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="grid h-14 w-14 place-items-center rounded-full bg-primary-600 text-white shadow-lg transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas"
        >
          <Icon icon={open ? X : WaveTriangle} size="lg" weight="bold" />
        </button>
      </Tooltip>
    </div>
  );
}
