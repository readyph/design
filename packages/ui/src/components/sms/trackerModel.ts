/**
 * Customer tracker model, chat subset only (RDY-552). RDY-551 brings the rest of the file from the source (design prototypes/sms/trackerModel.ts).
 * Reads the SAME shared store as the Mechanic app and Requests (mechModel).
 */
import { nextId, nowIso, patchMech, type CustMsg, type MechState } from './mechModel';

// ---------- chat with the manager ----------
export const threadOf = (s: MechState, jobId: string): CustMsg[] => s.custMsgs.filter((m) => m.jobId === jobId);
/** Messages from the manager the customer has not opened yet. */
export const customerUnread = (s: MechState, jobId: string) => s.custMsgs.filter((m) => m.jobId === jobId && m.from === 'manager' && !m.read).length;
export function sendCustomerMessage(jobId: string, text: string) {
  const body = text.trim(); if (!body) return;
  patchMech((s) => ({ custMsgs: [...s.custMsgs, { id: nextId('cm'), jobId, from: 'customer', text: body, at: nowIso() }] }));
}
export function markCustomerRead(jobId: string) {
  patchMech((s) => (s.custMsgs.some((m) => m.jobId === jobId && m.from === 'manager' && !m.read) ? { custMsgs: s.custMsgs.map((m) => (m.jobId === jobId && m.from === 'manager' ? { ...m, read: true } : m)) } : {}));
}
/** Studio-only: the mechanic or the manager posts something, to watch it arrive on the tracker. */
