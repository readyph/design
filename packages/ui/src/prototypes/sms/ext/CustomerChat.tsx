import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowDown, ChatCircleText, PaperPlaneRight } from '@phosphor-icons/react';
import { Button, cn } from '../../../index';
import { HOURS, NOW_MIN, TODAY, branch, manager, type Job } from '../data';
import { hm } from '../floorModel';
import { type MechState } from '../mechModel';
import { fmt12 } from '../settingsModel';
import { customerUnread, markCustomerRead, sendCustomerMessage, threadOf } from '../trackerModel';
import { PersonAvatar } from './avatarTone';
import { MechSection } from './MechFrame';

const dayLabel = (iso: string) => {
  const d = iso.slice(0, 10);
  if (d === TODAY) return 'Today';
  return new Date(`${d}T12:00:00+08:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });
};
const clock = (iso: string) => fmt12(hm(iso));
const openNote = () => (NOW_MIN < HOURS.close ? `Open until ${fmt12(`${String(Math.floor(HOURS.close / 60)).padStart(2, '0')}:${String(HOURS.close % 60).padStart(2, '0')}`)}, replies here` : 'Closed now, replies when the shop opens');

const Rule = ({ label, tone, ...rest }: { label: string; tone?: 'accent' } & Record<string, unknown>) => (
  <li role="presentation" className={cn('flex items-center gap-3 py-1 text-[12px] font-medium', tone === 'accent' ? 'text-accent' : 'text-muted')} {...rest}>
    <span aria-hidden className="h-px flex-1 bg-rule" />{label}<span aria-hidden className="h-px flex-1 bg-rule" />
  </li>
);

/**
 * The customer's chat with the manager: a real chatbox, always on the page (never a closed section). Header (who, open or not), a scrollable log with the
 * customer's bubbles on the right and the manager's on the left (time under each, day separators, a "New" line over unread replies), a docked composer
 * (Enter sends, Shift+Enter is a new line) and an empty state. Reads and writes the shared store, so replies from Requests arrive here and messages arrive there.
 */
export function ChatPanel({ job, s, className }: { job: Job; s: MechState; className?: string }) {
  const thread = threadOf(s, job.id);
  const unread = customerUnread(s, job.id);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [pinned, setPinned] = useState(true);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');
  const [newFrom, setNewFrom] = useState<string | null>(() => s.custMsgs.find((m) => m.jobId === job.id && m.from === 'manager' && !m.read)?.id ?? null);
  const root = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !root.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting && e.intersectionRatio >= 0.5), { threshold: [0, 0.5, 1] });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);
  // Remember where the unread replies start, so the "New" line stays after they are marked read.
  useEffect(() => {
    if (!newFrom && unread) setNewFrom(s.custMsgs.find((m) => m.jobId === job.id && m.from === 'manager' && !m.read)?.id ?? null);
  }, [unread, newFrom, s.custMsgs, job.id]);
  // Latest message in view (unless the customer scrolled up to read older ones).
  const last = thread[thread.length - 1]?.id;
  useEffect(() => {
    const el = log.current;
    if (el && pinned) el.scrollTop = el.scrollHeight;
  }, [last, pinned]);
  // Replies count as read once the panel is on screen and scrolled to the latest.
  useEffect(() => { if (unread && visible && pinned) markCustomerRead(job.id); }, [unread, visible, pinned, job.id]);

  const onScroll = () => { const el = log.current; if (el) setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 24); };
  const toLatest = () => { const el = log.current; if (el) { el.scrollTop = el.scrollHeight; setPinned(true); } };
  const send = () => {
    const t = text.trim(); if (!t) return;
    sendCustomerMessage(job.id, t); setText(''); setSending(true); setPinned(true);
    clearTimeout(timer.current); timer.current = setTimeout(() => setSending(false), 700);
  };
  const lastMine = [...thread].reverse().find((m) => m.from === 'customer')?.id;
  const waiting = thread.length > 0 && thread[thread.length - 1]!.from === 'customer';

  let day = '';
  return (
    <MechSection title="Ask the manager" hint={unread > 0 ? <span data-unread className="font-medium text-accent">{unread} new</span> : undefined} className={className}>
      <div ref={root} data-chat className="flex h-[420px] flex-col overflow-hidden rounded-control border border-control bg-surface lg:h-[min(560px,calc(100dvh-10rem))]">
        <div data-chat-head className="flex flex-none items-center gap-3 border-b border-rule px-3 py-2">
          <PersonAvatar personId={manager.id} name={manager.name} initials={manager.initials} size={32} decorative />
          <p className="min-w-0 leading-5">
            <span className="block truncate text-[14px] font-medium">{manager.name}<span className="font-normal text-muted"> · Manager</span></span>
            <span className="flex items-center gap-1.5 text-[12px] text-muted"><span aria-hidden className={cn('size-1.5 flex-none rounded-full', NOW_MIN < HOURS.close ? 'bg-ok-dot' : 'bg-control')} /><span className="truncate">{branch.name} · {openNote()}</span></span>
          </p>
        </div>

        <div className="relative min-h-0 flex-1">
          <div ref={log} role="log" aria-label="Chat with the manager" aria-live="polite" tabIndex={0} onScroll={onScroll} className="h-full overflow-y-auto overscroll-contain px-3 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
            {thread.length === 0 ? (
              <div data-chat-empty className="grid h-full place-content-center justify-items-center gap-1 px-4 text-center">
                <ChatCircleText size={28} aria-hidden className="text-muted" />
                <p className="text-[14px] font-medium">Say hi to the shop</p>
                <p className="text-[13px] leading-5 text-muted">Ask about the price, the time or the work. {manager.short} replies here.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {thread.map((m) => {
                  const mine = m.from === 'customer'; const d = m.at.slice(0, 10); const head = d !== day; day = d;
                  return (
                    <Fragment key={m.id}>
                      {head && <Rule label={dayLabel(m.at)} />}
                      {m.id === newFrom && <Rule label="New" tone="accent" data-new-divider="" />}
                      <li className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
                        <p className={cn('max-w-[80%] whitespace-pre-line break-words rounded-control px-3 py-2 text-[14px] leading-5', mine ? 'bg-accent text-accent-ink' : 'bg-raised text-text')}>{m.text}</p>
                        <span className="mt-1 text-[12px] tabular-nums text-muted">{mine ? 'You' : manager.short} · {clock(m.at)}{m.id === lastMine && waiting && <span data-sent-state> · {sending ? 'Sending...' : 'Sent'}</span>}</span>
                      </li>
                    </Fragment>
                  );
                })}
              </ul>
            )}
          </div>
          {unread > 0 && !pinned && (
            <button type="button" onClick={toLatest} className="absolute bottom-2 left-1/2 inline-flex h-8 -translate-x-1/2 items-center gap-1.5 rounded-control bg-accent px-3 text-[13px] font-semibold text-accent-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><ArrowDown size={14} aria-hidden />{unread} new {unread > 1 ? 'messages' : 'message'}</button>
          )}
        </div>

        <div data-composer className="flex-none border-t border-rule p-3">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 rounded-control border border-control bg-surface px-3 focus-within:border-accent">
              <textarea aria-label="Message to the manager" rows={1} value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
                placeholder={`Write to ${manager.short}...`} className="block max-h-24 min-h-10 w-full resize-none bg-transparent py-2 text-[14px] leading-5 text-ink placeholder:text-muted focus:outline-none [field-sizing:content]" />
            </div>
            <Button variant="primary" leftIcon={PaperPlaneRight} disabled={!text.trim()} onClick={send}>Send</Button>
          </div>
          <p className="mt-1.5 hidden text-[12px] text-muted lg:block">Enter to send, Shift+Enter for a new line</p>
        </div>
      </div>
    </MechSection>
  );
}
