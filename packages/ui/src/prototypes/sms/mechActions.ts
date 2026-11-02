import { NOW } from './data';
import type { Job, PendingReason } from './data';
import { nextId, nowIso, patchMech, type PartRequest } from './mechModel';

/** Every mechanic move writes to the shared store; the manager's Today reads `ov`, `requests`, `messages` and `proposals` from it. */
export function setJob(job: Job, to: Partial<Job>) {
  patchMech((s) => ({ ov: { ...s.ov, [job.id]: { ...s.ov[job.id], ...to, statusSince: NOW } } }));
}
export function tickService(job: Job, i: number) {
  const services = job.services.map((x, k) => (k === i ? { ...x, done: !x.done } : x));
  patchMech((s) => ({ ov: { ...s.ov, [job.id]: { ...s.ov[job.id], services } } }));
}
export function startWork(job: Job) { setJob(job, { status: 'IN_PROGRESS' }); }
export function pauseWork(job: Job, reason: PendingReason, note: string) {
  setJob(job, { status: 'PENDING', pendingReason: reason, pendingNote: note || (reason === 'WAITING_FOR_PARTS' ? 'Part needed' : undefined) });
}
export function resumeWork(job: Job) { setJob(job, { status: 'IN_PROGRESS', pendingReason: undefined, pendingNote: undefined }); }
export function markDone(job: Job) { setJob(job, { status: 'FOR_PICKUP', services: job.services.map((x) => ({ ...x, done: true })) }); }
export function addNote(jobId: string, text: string, photos: number) {
  patchMech((s) => ({ notes: { ...s.notes, [jobId]: [{ id: nextId('n'), text, photos, at: nowIso() }, ...(s.notes[jobId] ?? [])] } }));
}
export function propose(jobId: string, mechId: string, text: string, photos: number) {
  patchMech((s) => ({ proposals: [{ id: nextId('pp'), jobId, mechId, text, photos, at: nowIso() }, ...s.proposals] }));
}
export function sendMessage(jobId: string, mechId: string, text: string) {
  patchMech((s) => ({ messages: [...s.messages, { id: nextId('ms'), jobId, mechId, from: 'mechanic', kind: 'text', text, at: nowIso() }] }));
}
export function answerQuestion(id: string, text: string) {
  patchMech((s) => {
    const q = s.messages.find((m) => m.id === id)!;
    return { messages: [...s.messages.map((m) => (m.id === id ? { ...m, answered: true } : m)), { id: nextId('ms'), jobId: q.jobId, mechId: q.mechId, from: 'mechanic', kind: 'text', text, at: nowIso(), answer: true }] };
  });
}
export function requestPart(r: Pick<PartRequest, 'productId' | 'qty' | 'jobId' | 'by' | 'note'>) {
  patchMech((s) => ({ requests: [{ ...r, id: nextId('rq'), at: nowIso(), status: 'Requested' }, ...s.requests] }));
}
export function setPref(k: string, v: boolean) { patchMech((s) => ({ prefs: { ...s.prefs, [k]: v } })); }
/** Opening a service marks the manager's messages on it as read, so the unread indicator on the card clears. */
export function markRead(jobId: string) { patchMech((s) => (s.messages.some((m) => m.jobId === jobId && m.from === 'manager' && !m.read) ? { messages: s.messages.map((m) => (m.jobId === jobId && m.from === 'manager' ? { ...m, read: true } : m)) } : {})); }
export function toggleHave(jobId: string, productId: string) { patchMech((s) => { const cur = s.have[jobId] ?? []; return { have: { ...s.have, [jobId]: cur.includes(productId) ? cur.filter((x) => x !== productId) : [...cur, productId] } }; }); }
