import { ChatCircleText, Note, Package, Warning, type Icon } from '@phosphor-icons/react';
import type { Job } from '../data';
import { LAST_KIND, agoWord, staffInfoOf, type FeedKind, type MechState } from '../mechModel';
import type { CalCardStaff, CalCardStat } from './CalCard';

export type Step = 'done' | 'now' | 'next' | 'waiting';
const KIND_ICON: Record<FeedKind, Icon> = { note: Note, found: Warning, part: Package, manager: ChatCircleText, question: ChatCircleText, you: ChatCircleText };

/** The staff view of one card, from the same data as the service screen (service items, parts checklist, manager messages, Updates feed). */
export function staffView(s: MechState, job: Job, step: Step): CalCardStaff {
  const i = staffInfoOf(s, job);
  const stats: CalCardStat[] = [];
  if (step !== 'done') {
    if (i.itemsTotal) stats.push({ kind: 'items', short: `${i.itemsDone}/${i.itemsTotal}`, full: `${i.itemsDone} of ${i.itemsTotal} items done` });
    if (i.partsTotal) stats.push({ kind: 'parts', short: `${i.partsReady}/${i.partsTotal}`, full: `${i.partsReady} of ${i.partsTotal} parts ready` });
  }
  const unread = step === 'done' || !i.unread ? null : `${i.unreadAsk ? 'Manager asked you' : 'Manager replied'} - ${i.unread} new ${i.unread > 1 ? 'messages' : 'message'}`;
  const last = i.last ? { icon: KIND_ICON[i.last.kind], who: LAST_KIND[i.last.kind], text: i.last.text || 'Photo', ago: agoWord(i.last.at) } : null;
  return { current: step === 'now', stats, unread, last };
}

/** Height the staff card needs (12px padding, number + plate row, customer, 2-line service, status row, flag chips, divider + last line). Text never clips; about 150-175px with every line. */
export function staffHeight(v: CalCardStaff, hasFlag: boolean): number {
  return 24 + 20 + 16 + 34 + 26 + (hasFlag ? 24 : 0) + (v.last ? 31 : 0) + 4;
}

/** The card step of one service from its status (the service screen shows the same card as the list). */
export function stepOfJob(job: Job): Step {
  return job.status === 'IN_PROGRESS' ? 'now' : job.status === 'PENDING' ? 'waiting' : job.status === 'TODO' ? 'next' : 'done';
}
