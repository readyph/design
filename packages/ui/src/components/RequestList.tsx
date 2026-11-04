import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { ChatCircleText, ChatTeardropText, NotePencil, Package, Warning } from '@phosphor-icons/react';
import { Badge, type BadgeProps } from './Badge';
import { cn } from '../utils/cn';
import { KIND_LABEL, type ItemKind, type ItemStatus, type RequestListItem } from './sms/requestTypes';
import { PersonAvatar } from './avatarTone';

export type { ItemKind, ItemStatus, RequestListItem, RequestPerson, RequestDisplay } from './sms/requestTypes';

export const KIND_ICON: Record<ItemKind, typeof Package> = { part: Package, problem: Warning, question: ChatCircleText, note: NotePencil, customer: ChatTeardropText };
export const STATUS_TONE: Record<ItemStatus, BadgeProps['tone']> = { 'Needs you': 'warn', Approved: 'accent', Ready: 'ok', Collected: 'neutral', Declined: 'bad', Quoted: 'accent', Dismissed: 'neutral', Answered: 'ok', Seen: 'neutral' };

/** Kind chip: an icon AND a word, so the kind never rides on colour. */
export function KindChip({ kind }: { kind: ItemKind }) {
  const Ico = KIND_ICON[kind];
  return <Badge tone="neutral" className="gap-1"><Ico size={12} aria-hidden />{KIND_LABEL[kind]}</Badge>;
}
/** Status chip: the word is the status; a leading dot is only decoration. */
export function StatusChip({ status }: { status: ItemStatus }) {
  if (status === 'Seen') return null;
  return <Badge tone={STATUS_TONE[status]} dot={status === 'Needs you'}>{status}</Badge>;
}

/** Row detail line: parts and problems lead with the title; no separator when there is no body. */
export const previewOf = (i: RequestListItem) => {
  const body = i.preview.trim();
  if (i.kind !== 'part' && i.kind !== 'problem') return i.preview;
  return body ? `${i.title}: ${i.preview}` : i.title;
};

export interface RequestListProps {
  /** Rows with plain display fields (plate, jobTitle, sender, agoLabel). Nothing is looked up from studio data. */
  items: RequestListItem[];
  selectedId: string | null;
  onOpen: (id: string) => void;
  /** Shown when the filter leaves nothing. */
  empty?: ReactNode;
}

/**
 * Studio-only RequestList (NEW): the inbox list as an ARIA listbox with roving focus (Up / Down / Home / End move, Enter or Space opens).
 * Rows copy the Today feed row (NotifyItem): no fill at rest, `hover:bg-raised`, a 32px PersonAvatar, 14px title, 13px muted detail; rows waiting for the
 * manager are tinted `bg-warn-bg` (as in Today), the open one is `bg-raised`. Unread = accent dot + a screen-reader-only "Unread". The row has no aria-label: its name comes from its content, so it always equals the visible text (WCAG 2.5.3; axe `label-content-name-mismatch` only inspects an explicit label).
 */
export function RequestList({ items, selectedId, onOpen, empty }: RequestListProps) {
  const ref = useRef<HTMLUListElement>(null);
  const focusIdx = Math.max(0, items.findIndex((i) => i.id === selectedId));
  const move = (to: number) => { const els = ref.current?.querySelectorAll<HTMLElement>('[role="option"]'); els?.[Math.max(0, Math.min((els?.length ?? 1) - 1, to))]?.focus(); };
  const onKey = (e: KeyboardEvent<HTMLUListElement>) => {
    const els = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? []);
    const at = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); move(at + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(at - 1); }
    else if (e.key === 'Home') { e.preventDefault(); move(0); }
    else if (e.key === 'End') { e.preventDefault(); move(els.length - 1); }
  };
  if (items.length === 0) return <>{empty}</>;
  return (
    <ul ref={ref} role="listbox" aria-label="Requests and messages from mechanics" onKeyDown={onKey} className="px-1 py-1">
      {items.map((i, n) => {
        const m = i.sender; const sel = i.id === selectedId;
        return (
          <li
            key={i.id} role="option" aria-selected={sel} tabIndex={n === focusIdx ? 0 : -1}
            onClick={() => onOpen(i.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(i.id); } }}
            className={cn('mx-1 mb-1 flex cursor-pointer gap-3 rounded-control px-3 py-3 text-left transition-colors duration-150 ease-out hover:bg-raised motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent', sel ? 'bg-raised' : i.needsYou && 'bg-warn-bg hover:bg-raised')}
          >
            <PersonAvatar personId={m.id} name={m.name} initials={m.initials} size={32} decorative className="mt-0.5" />
            <span className="min-w-0 flex-1">
              <span className="flex items-start gap-2">
                {i.unread && <span aria-hidden data-unread className="mt-[7px] size-2 flex-none rounded-full bg-accent" />}
                {i.unread && <span className="sr-only">Unread</span>}
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium leading-5"><span className="font-mono text-[13px]">{i.plate ?? 'Shop use'}</span><span className="text-muted"> · </span>{i.jobTitle ?? i.title}</span>
                <span className="flex-none whitespace-nowrap text-[13px] tabular-nums text-muted">{i.agoLabel}</span>
              </span>
              <span className="mt-0.5 block truncate text-[13px] leading-5 text-muted" title={i.preview}>{previewOf(i)}</span>
              <span className="mt-2 flex flex-wrap items-center gap-2"><KindChip kind={i.kind} /><StatusChip status={i.status} /><span className="text-[12px] text-muted">{m.short}</span></span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
