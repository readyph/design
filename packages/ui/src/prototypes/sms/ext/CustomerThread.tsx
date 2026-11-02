import { useId, useState } from 'react';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { Button } from '../../../index';
import { customerOf, manager, type Job } from '../data';
import { threadOf, whenWord } from '../trackerModel';
import type { MechState } from '../mechModel';
import { NotifyItem } from './NotifyItem';
import { PersonAvatar } from './avatarTone';

const QUICK = ['Yes', 'No', 'We will text you', 'Call the shop'] as const;

/** The customer chat of one service, manager side: same look as the Requests thread (RequestThread), a different thread (customer, not mechanic). */
export function CustomerThread({ job, s, onSend }: { job: Job; s: MechState; onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const id = useId();
  const c = customerOf(job); const first = c.name.split(/\s+/)[0]!;
  const posts = threadOf(s, job.id);
  const send = (t: string) => { if (!t.trim()) return; onSend(t.trim()); setText(''); };
  return (
    <section aria-label="Customer chat" className="px-4 pb-6 pt-5">
      <h3 className="flex items-baseline gap-2 border-b border-control pb-1 text-[13px] font-semibold">Chat with {first}<span className="font-normal text-muted">{posts.length}</span></h3>
      <ul className="mt-2">
        {posts.map((p) => {
          const mine = p.from === 'manager';
          return (
            <NotifyItem key={p.id} leading={mine ? <PersonAvatar personId={manager.id} name={manager.name} initials={manager.initials} size={32} /> : <PersonAvatar personId={c.id} name={c.name} initials={c.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()} size={32} />}
              title={mine ? `${manager.short} (you)` : first} time={whenWord(p.at)} wrap detail={p.text} tag={mine ? (p.read ? 'Seen' : 'Sent') : undefined} tagTone="neutral" />
          );
        })}
      </ul>
      <div data-composer className="mt-3 rounded-control border border-control bg-surface focus-within:border-accent">
        <div className="flex items-start gap-3 p-3 pb-2">
          <PersonAvatar personId={manager.id} name={manager.name} initials={manager.initials} size={32} decorative />
          <textarea id={id} aria-label={`Reply to ${first}`} rows={2} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(text); }} placeholder={`Reply to ${first}...`} className="min-h-[48px] min-w-0 flex-1 resize-none bg-transparent py-1 text-[14px] leading-5 text-ink placeholder:text-muted focus:outline-none [field-sizing:content]" />
        </div>
        <hr className="border-0 border-t border-rule" />
        <div className="flex flex-wrap items-center justify-between gap-2 p-3">
          <div role="group" aria-label="Quick replies" className="flex flex-wrap gap-2">
            {QUICK.map((q) => <Button key={q} variant="secondary" aria-label={`Quick reply: ${q}`} onClick={() => send(q)}>{q}</Button>)}
          </div>
          <Button variant="primary" leftIcon={PaperPlaneRight} disabled={!text.trim()} onClick={() => send(text)}>Send</Button>
        </div>
      </div>
    </section>
  );
}
