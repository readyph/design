import { useSyncExternalStore } from 'react';


// ---------- the tracking link (token store) ----------
export const LINK_BASE = 'https://track.readyph.example/t/';
export const LINK_EXPIRY_DAYS = 7;
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** 24 characters from a 31-letter alphabet (about 119 bits) from the browser's secure random source (Math.random only as a last resort in odd test hosts). */
export function makeToken(): string {
  const out: string[] = [];
  const c = (globalThis as { crypto?: Crypto }).crypto;
  const bytes = new Uint8Array(24);
  if (c?.getRandomValues) c.getRandomValues(bytes); else for (let i = 0; i < 24; i++) bytes[i] = Math.floor(Math.random() * 256);
  for (const b of bytes) out.push(ALPHABET[b % ALPHABET.length]);
  return out.join('');
}

interface LinkStore { current: Record<string, string>; revoked: Record<string, string> }
let links: LinkStore = { current: {}, revoked: {} };
const subs = new Set<() => void>();
const emit = () => { links = { ...links }; subs.forEach((f) => f()); };
export const getLinks = () => links;
export const resetTracker = () => { links = { current: {}, revoked: {} }; subs.forEach((f) => f()); };
export const useLinks = () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb); }; }, getLinks, getLinks);


/** The service's current token. Created the first time it is needed (in the real product: when the job order is created). */
export function ensureLink(jobId: string): string {
  const have = links.current[jobId];
  if (have) return have;
  const token = makeToken();
  links.current = { ...links.current, [jobId]: token };
  return token;
}
export const urlOf = (token: string) => `${LINK_BASE}${token}`;
export const pathOf = (token: string) => `/t/${token}`;
/** Old link stops working at once; a new token is issued. */
export function regenerateLink(jobId: string): string {
  const old = links.current[jobId];
  const token = makeToken();
  links.current = { ...links.current, [jobId]: token };
  if (old) links.revoked = { ...links.revoked, [old]: jobId };
  emit();
  return token;
}
