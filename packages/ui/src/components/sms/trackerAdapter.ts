/** Story / prototype adapter: builds the plain tracker view-model from the prototype stores. Not exported from the package. */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TrackerChatManager, TrackerChatMessage, TrackerChatShop, TrackerPaymentView, TrackerQuoteView, TrackerUpdateView, TrackerView } from '../trackerView';
import { HOURS, NOW_MIN, TODAY, branch, customerOf, manager, mechanics, vehicleOf, type Job } from './data';
import { serviceTitle } from './floorModel';
import type { MechState } from './mechModel';
import { fmt12 } from './settingsModel';
import { answerCustomerQuote, carWord, feedForCustomer, firstNameOf, markCustomerRead, maskPlate, moneyFor, promiseWord, quotesFor, sendCustomerMessage, stageOf, threadOf, whenWord } from './trackerModel';

export function updatesView(s: MechState, job: Job): TrackerUpdateView[] {
  const mech = mechanics.find((m) => m.id === job.assigneeId);
  return feedForCustomer(s, job).map((p) => {
    const who = p.by === 'Manager' ? manager : p.kind === 'note' ? mech : null;
    return { id: p.id, kind: p.kind, title: p.title, text: p.text, photos: p.photos, when: whenWord(p.at), by: p.by, person: who ? { id: who.id, name: who.name, initials: who.initials } : null };
  });
}

export function paymentView(job: Job): TrackerPaymentView | null {
  const m = moneyFor(job);
  return m ? { balance: m.balance, paid: m.paid, readyForPickup: job.status === 'FOR_PICKUP' } : null;
}

export const quotesView = (s: MechState, job: Job): TrackerQuoteView[] => quotesFor(s, job).map(({ id, text, photos, amount, note, customer }) => ({ id, text, photos, amount, note, customer }));

export const chatThreadView = (s: MechState, job: Job): TrackerChatMessage[] => threadOf(s, job.id).map(({ id, from, text, at, read }) => ({ id, from, text, at, read }));

export function trackerViewOf(s: MechState, job: Job): TrackerView {
  return {
    who: { firstName: firstNameOf(customerOf(job)), car: carWord(job), plate: maskPlate(vehicleOf(job).plate), service: serviceTitle(job), number: job.number },
    status: { ...stageOf(job), promise: promiseWord(job) },
    quotes: quotesView(s, job),
    items: job.services.map((x) => ({ name: x.name, done: x.done })),
    payment: paymentView(job),
    updates: updatesView(s, job),
    chat: chatThreadView(s, job),
  };
}

const closeLabel = fmt12(`${String(Math.floor(HOURS.close / 60)).padStart(2, '0')}:${String(HOURS.close % 60).padStart(2, '0')}`);
export const chatManager: TrackerChatManager = { id: manager.id, name: manager.name, initials: manager.initials, short: manager.short };
export const chatShop: TrackerChatShop = { name: branch.name, open: NOW_MIN < HOURS.close, note: NOW_MIN < HOURS.close ? `Open until ${closeLabel}, replies here` : 'Closed now, replies when the shop opens' };
export const chatToday = TODAY;

/** Store-backed callbacks for the story and the prototype page. "Sending..." shows for 700 ms after a send, like the original panel. */
export function useChatActions(jobId: string) {
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  const onSend = useCallback((text: string) => {
    sendCustomerMessage(jobId, text); setPending(true);
    clearTimeout(timer.current); timer.current = setTimeout(() => setPending(false), 700);
  }, [jobId]);
  const onMarkRead = useCallback(() => markCustomerRead(jobId), [jobId]);
  return { onSend, onMarkRead, pending };
}
export const answerFromStore = (quoteId: string, answer: 'approved' | 'declined') => answerCustomerQuote(quoteId, answer);
