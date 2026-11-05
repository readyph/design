import { useId, useRef, useState } from 'react';
import { Camera, ImageSquare, Warning, X } from '@phosphor-icons/react';
import { Button } from './Button';
import { Switch } from './Switch';
import { Checkbox } from './Checkbox';
import { cn } from '../utils/cn';
import { manager, type Mechanic } from './sms/data';
import { answerQuestion } from './sms/mechActions';
import { agoWord, type FeedKind, type FeedPost } from './sms/mechModel';
import { PersonAvatar } from './avatarTone';
import { MechSection } from './MechFrame';
import { NotifyItem } from './NotifyItem';

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

const KIND: Record<FeedKind, { label: string; tone: 'neutral' | 'accent' | 'warn' | 'ok' }> = {
  note: { label: 'Note', tone: 'neutral' },
  found: { label: 'Found a problem', tone: 'warn' },
  part: { label: 'Part request', tone: 'accent' },
  manager: { label: 'Manager', tone: 'neutral' },
  question: { label: 'Question', tone: 'accent' },
  you: { label: 'Message', tone: 'neutral' },
};

/** One post of the work activity log, as the right panel's `NotifyItem` row (as in Today's FloorFeed): 32px avatar, name + time, the text, photo tiles, kind chip; an open question adds Yes / No / Call me under it. */
export function FeedPostRow({ post, me, flash }: { post: FeedPost; me: Mechanic; flash: (m: string) => void }) {
  const mine = post.by === 'you';
  const k = KIND[post.kind];
  const who = mine ? me : post.author ? { id: post.author, name: post.author, initials: initialsOf(post.author) } : manager;
  const text = post.text || (post.photos ? 'Photo' : '');
  const extra = [post.kind === 'part' || post.kind === 'found' ? post.meta : '', post.kind === 'question' && post.answered ? 'You answered.' : ''].filter(Boolean).join('\n');
  const showKind = post.kind !== 'manager' && post.kind !== 'you';
  return (
    <>
      <NotifyItem
        leading={<PersonAvatar personId={who.id} name={who.name} initials={who.initials} size={32} />}
        title={mine ? 'You' : post.author ?? manager.short} time={post.time ?? agoWord(post.at)} wrap
        detail={<>{text}{extra && <><br />{extra}</>}{!!post.photos && <span className="mt-2 flex gap-2">{Array.from({ length: Math.min(post.photos, 3) }, (_, i) => <span key={i} role="img" aria-label="Photo" className="grid h-16 w-20 place-items-center rounded-control bg-raised-2 text-muted"><Camera size={20} aria-hidden /></span>)}</span>}</>}
        tag={showKind ? k.label : undefined} tagTone={k.tone}
      />
      {post.kind === 'question' && !post.answered && (
        <li className="mx-1 mb-2 grid grid-cols-3 gap-2 pl-[56px] pr-3">{['Yes', 'No', 'Call me'].map((a) => <Button key={a} variant="secondary" onClick={() => { answerQuestion(post.id, a); flash('Sent to your manager.'); }}>{a}</Button>)}</li>
      )}
    </>
  );
}

type PostFn = (text: string, photos: number, isProblem: boolean, files?: File[], internal?: boolean) => void;

/** The composer: ONE unit (the one bordered surface, as it is an input). Top row avatar + borderless textarea; photo chips; hairline; footer with ghost Photo + the Found a problem Switch on the left and a small primary Post on the right. All 12px inner padding. */
function Composer({ me, onPost, onPickPhotos, allowInternal }: { me: Mechanic; onPost: PostFn; onPickPhotos?: (files: File[]) => void; allowInternal?: boolean }) {
  const [text, setText] = useState(''); const [photos, setPhotos] = useState(0); const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null); const [problem, setProblem] = useState(false); const [internal, setInternal] = useState(false);
  const sid = useId();
  const ready = !!text.trim() || photos > 0;
  const drop = (i: number) => { setPhotos((n) => n - 1); setFiles((f) => f.filter((_, k) => k !== i)); };
  const ghost = 'inline-flex h-8 items-center gap-1.5 rounded-control px-2 text-[13px] text-muted hover:bg-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent';
  return (
    <div data-composer className={cn('rounded-control border bg-surface', problem ? 'border-warn-ink' : 'border-control focus-within:border-accent')}>
      <div className="flex items-start gap-3 p-3 pb-2">
        <PersonAvatar personId={me.id} name={me.name} initials={me.initials} size={32} />
        <textarea aria-label="Add a note or photo" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note or photo..." className="min-h-[48px] min-w-0 flex-1 resize-none bg-transparent py-1 text-[14px] leading-5 text-ink placeholder:text-muted focus:outline-none [field-sizing:content]" />
      </div>
      {photos > 0 && (
        <ul aria-label="Photos to post" className="flex flex-wrap gap-2 px-3 pb-2 pl-[56px]">
          {Array.from({ length: photos }, (_, i) => (
            <li key={i} className="relative">
              <span role="img" aria-label="Photo ready" className="grid h-14 w-16 place-items-center rounded-control bg-raised-2 text-muted"><Camera size={20} aria-hidden /></span>
              <button type="button" aria-label="Remove photo" onClick={() => drop(i)} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-surface text-muted shadow-sm hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"><X size={12} aria-hidden /></button>
            </li>
          ))}
        </ul>
      )}
      {problem && <p className="px-3 pb-2 pl-[56px] text-[12px] leading-4 text-warn-ink">This will be sent to your manager as a problem.</p>}
      {allowInternal && <div className="px-3 pb-2 pl-[56px]"><Checkbox label="Internal (customer cannot see it)" checked={internal} onChange={(e) => setInternal(e.target.checked)} /></div>}
      <hr className={cn('border-0 border-t', problem ? 'border-warn-ink' : 'border-rule')} />
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex min-w-0 items-center gap-1 -ml-2">
          <button type="button" onClick={() => (onPickPhotos ? fileRef.current?.click() : setPhotos((n) => n + 1))} className={ghost}><ImageSquare size={18} aria-hidden />Photo</button>
          {onPickPhotos && <input ref={fileRef} type="file" accept="image/*" multiple hidden aria-label="Choose photos" onChange={(e) => { const picked = Array.from(e.target.files ?? []); if (picked.length) { setFiles((f) => [...f, ...picked]); setPhotos((n) => n + picked.length); onPickPhotos(picked); } e.target.value = ''; }} />}
          <label htmlFor={sid} className={cn('inline-flex h-8 cursor-pointer items-center gap-2 px-2 text-[13px]', problem ? 'text-warn-ink' : 'text-muted')}>
            <Switch id={sid} aria-label="Found a problem" checked={problem} onCheckedChange={setProblem} />
            <Warning size={16} weight={problem ? 'fill' : 'regular'} aria-hidden /><span aria-hidden className="min-[360px]:hidden">Problem</span><span aria-hidden className="hidden min-[360px]:inline">Found a problem</span>
          </label>
        </div>
        <Button variant="primary" disabled={!ready} onClick={() => { if (allowInternal) onPost(text.trim(), photos, problem, files, internal); else onPost(text.trim(), photos, problem, files); setInternal(false); setText(''); setPhotos(0); setFiles([]); setProblem(false); }}>Post</Button>
      </div>
    </div>
  );
}

/** The Updates feed, Facebook order in Today's look: one composer on top, then the work activity log as panel rows, newest first. */
export function MechFeed({ posts, me, readOnly, onPost, onPickPhotos, allowInternal, flash }: { posts: FeedPost[]; me: Mechanic; readOnly: boolean; onPost: PostFn; /** Real photo selection: when given, Photo opens the file picker and the chosen files are passed here and to `onPost` as its 4th argument. */ onPickPhotos?: (files: File[]) => void; /** Shows an unchecked "Internal (customer cannot see it)" checkbox; its value is the 5th argument of `onPost`. Hidden when not set. */ allowInternal?: boolean; flash: (m: string) => void }) {
  return (
    <MechSection title="Updates" count={posts.length}>
      {!readOnly && <div className="pb-3"><Composer me={me} onPickPhotos={onPickPhotos} allowInternal={allowInternal} onPost={(t, n, pr, f, i) => { if (allowInternal) onPost(t, n, pr, f, i); else onPost(t, n, pr, f); flash(pr ? 'Sent to your manager.' : 'Posted.'); }} /></div>}
      {posts.length ? <ul className="-mx-4">{posts.map((p) => <FeedPostRow key={p.id} post={p} me={me} flash={flash} />)}</ul> : <p className="py-2 text-[14px] text-muted">No updates yet. Add a note or photo, or ask your manager.</p>}
    </MechSection>
  );
}
