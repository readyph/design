import { useId, useState } from 'react';
import { Camera, PaperPlaneRight } from '@phosphor-icons/react';
import { Button } from './Button';
import { cn } from '../utils/cn';
import { manager, type Job, type Mechanic } from './sms/data';
import { agoWord, feedOf, type FeedKind, type MechState } from './sms/mechModel';
import { NotifyItem } from './NotifyItem';
import { PersonAvatar } from './avatarTone';

const TAG: Partial<Record<FeedKind, { label: string; tone: 'neutral' | 'accent' | 'warn' }>> = {
  note: { label: 'Note', tone: 'neutral' }, found: { label: 'Found a problem', tone: 'warn' }, part: { label: 'Part request', tone: 'accent' }, question: { label: 'Question', tone: 'accent' },
};
export const QUICK = ['Yes', 'No', 'On my way', 'Call me'] as const;

/** The service's thread: the same posts the mechanic sees in the Updates feed (oldest first here, like a chat), then the reply box. */
export function RequestThread({ job, s, mech, itemKey, onSend }: { job: Job | null; s: MechState; mech: Mechanic; itemKey?: string; onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const id = useId();
  const posts = job ? feedOf(s, job).slice().reverse() : [];
  const send = (t: string) => { if (!t.trim()) return; onSend(t.trim()); setText(''); };
  return (
    <section aria-label="Service thread" className="px-4 pb-6 pt-5">
      <h3 className="flex items-baseline gap-2 border-b border-control pb-1 text-[13px] font-semibold">Service thread<span className="font-normal text-muted">{posts.length}</span></h3>
      {posts.length === 0 && <p className="py-3 text-[13px] text-muted">{job ? 'Nothing posted on this service yet.' : 'This request is not tied to a service, so there is no thread. Replies are not available.'}</p>}
      <ul className="mt-2">
        {posts.map((p) => {
          const mine = p.by === 'you'; const who = mine ? mech : manager; const tag = TAG[p.kind];
          return (
            <NotifyItem
              key={p.id} leading={<PersonAvatar personId={who.id} name={who.name} initials={who.initials} size={32} />}
              title={mine ? mech.short : `${manager.short} (you)`} time={agoWord(p.at)} wrap tag={tag?.label} tagTone={tag?.tone}
              className={cn(itemKey && itemKey.endsWith(`:${p.id}`) && '[&>div]:bg-raised')}
              detail={<>{p.text || (p.photos ? 'Photos' : '')}{p.meta && <><br /><span className="text-faint">{p.meta}</span></>}{!!p.photos && <span className="mt-2 flex gap-2">{Array.from({ length: Math.min(p.photos, 3) }, (_, i) => <span key={i} role="img" aria-label="Photo" className="grid h-16 w-20 place-items-center rounded-control bg-raised-2 text-muted"><Camera size={20} aria-hidden /></span>)}</span>}</>}
            />
          );
        })}
      </ul>
      {job && (
        <div data-composer className="mt-3 rounded-control border border-control bg-surface focus-within:border-accent">
          <div className="flex items-start gap-3 p-3 pb-2">
            <PersonAvatar personId={manager.id} name={manager.name} initials={manager.initials} size={32} decorative />
            <textarea id={id} aria-label={`Reply to ${mech.short}`} rows={2} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(text); }} placeholder={`Reply to ${mech.short}...`} className="min-h-[48px] min-w-0 flex-1 resize-none bg-transparent py-1 text-[14px] leading-5 text-ink placeholder:text-muted focus:outline-none [field-sizing:content]" />
          </div>
          <hr className="border-0 border-t border-rule" />
          <div className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div role="group" aria-label="Quick replies" className="flex flex-wrap gap-2">
              {QUICK.map((q) => <Button key={q} variant="secondary" aria-label={`Quick reply: ${q}`} onClick={() => send(q)}>{q}</Button>)}
            </div>
            <Button variant="primary" leftIcon={PaperPlaneRight} disabled={!text.trim()} onClick={() => send(text)}>Send</Button>
          </div>
        </div>
      )}
    </section>
  );
}
