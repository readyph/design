import { platformInitialsFor } from '../components/PlatformLogo';
import { sampleCatalog } from '../components/Marketplace.sample';
import type { StatusTone } from '../components/StatusDot';
import type { TownMapLink, TownMapPlatform, TownMapSlot } from '../components/TownMap';
import { hq as hqSlot } from '../components/TownMap.data';

const hq: TownMapPlatform = { ...hqSlot, count: undefined };

/** Story data for the Portal Platforms page (RDY-256). Prototype only: not exported from the package. */

export type DataKind = 'stock' | 'catalog' | 'sales';
export type LinkStatus = 'ok' | 'slow' | 'broken';

export interface PlatformData {
  id: string;
  name: string;
  /** Short name used inside sentences. */
  short: string;
  /** Marketplace key: 'inventory', 'repair_shop', 'pos', 'storefront', 'mobile_app'. */
  kind: string;
  place: string;
  /** Health. A platform missing a data source reads "Setup needed" unless it is offline. */
  health: StatusTone;
  since?: string;
  metrics: [string, string][];
}

export interface DataLink {
  from: string;
  to: string;
  kind: DataKind;
  status: LinkStatus;
}

export interface PlatformSet {
  platforms: PlatformData[];
  links: DataLink[];
}

export const dataKindName: Record<DataKind, string> = { stock: 'Stock', catalog: 'Catalog', sales: 'Sales' };
export const dataKindShares: Record<DataKind, string> = {
  stock: 'Products and levels',
  catalog: 'Parts and services',
  sales: 'Receipts and totals',
};
const lower = (s: string) => s.toLowerCase();
export const lowerKind = (k: DataKind) => lower(dataKindName[k]);

export const catalogItem = (key: string) => sampleCatalog.find((i) => i.key === key)!;
export const kindName = (key: string) => catalogItem(key).name;
export const hasApp = (key: string) => !!catalogItem(key).hasApp;
const readsOf = (key: string) => (catalogItem(key).reads ?? []) as DataKind[];
const sharesOf = (key: string) => (catalogItem(key).shares ?? []) as DataKind[];

const stockroom: PlatformData = { id: 'stockroom', name: 'Parts Stockroom', short: 'Stockroom', kind: 'inventory', place: 'Cubao, QC', health: 'ok', metrics: [['Products', '612'], ['Low stock', '4'], ['POs open', '2']] };
const autoWorks: PlatformData = { id: 'autoworks', name: 'Dela Cruz Auto Works', short: 'Auto Works', kind: 'repair_shop', place: 'Quezon City', health: 'ok', metrics: [['Jobs today', '11'], ['For pickup', '3']] };
const slowAutoWorks: PlatformData = { ...autoWorks, health: 'warn', since: '7:40' };
const counter: PlatformData = { id: 'counter', name: 'Cubao Parts Counter', short: 'Parts Counter', kind: 'pos', place: 'Aurora Blvd, QC', health: 'ok', metrics: [] };
const cebu: PlatformData = { id: 'cebu', name: 'Cebu Parts Stockroom', short: 'Cebu Parts', kind: 'inventory', place: 'Cebu City', health: 'bad', since: 'Wed 18:05', metrics: [] };
const kapitolyo: PlatformData = { id: 'kapitolyo', name: 'Kapitolyo Repair Shop', short: 'Kapitolyo', kind: 'repair_shop', place: 'Pasig', health: 'ok', metrics: [['Jobs today', '8'], ['Waiting for parts', '1']] };
const marikina: PlatformData = { id: 'marikina', name: 'Marikina Repair Shop', short: 'Marikina', kind: 'repair_shop', place: 'Marikina', health: 'warn', since: '7:40', metrics: [['Jobs today', '9']] };
const storefront: PlatformData = { id: 'storefront', name: 'Pasig Online Store', short: 'Online Store', kind: 'storefront', place: 'Pasig', health: 'accent', metrics: [] };

export const sets: Record<'duo' | 'few' | 'many' | 'empty', PlatformSet> = {
  duo: {
    platforms: [stockroom, autoWorks],
    links: [{ from: 'stockroom', to: 'autoworks', kind: 'catalog', status: 'ok' }],
  },
  few: {
    platforms: [stockroom, slowAutoWorks, counter],
    links: [{ from: 'stockroom', to: 'autoworks', kind: 'catalog', status: 'slow' }],
  },
  many: {
    platforms: [stockroom, cebu, autoWorks, kapitolyo, marikina, counter, storefront],
    links: [
      { from: 'stockroom', to: 'autoworks', kind: 'catalog', status: 'ok' },
      { from: 'stockroom', to: 'kapitolyo', kind: 'catalog', status: 'ok' },
      { from: 'stockroom', to: 'marikina', kind: 'catalog', status: 'slow' },
      { from: 'stockroom', to: 'storefront', kind: 'stock', status: 'ok' },
    ],
  },
  empty: { platforms: [], links: [] },
};

export const byId = (set: PlatformSet, id: string) => set.platforms.find((p) => p.id === id)!;
export const sourcesOf = (set: PlatformSet, id: string, k: DataKind) => set.links.filter((l) => l.to === id && l.kind === k);
export const sharedBy = (set: PlatformSet, id: string) => set.links.filter((l) => l.from === id);
/** The data kinds a platform reads but has no source for. */
export const missing = (set: PlatformSet, p: PlatformData) => readsOf(p.kind).filter((k) => !sourcesOf(set, p.id, k).length);
export const setupNeeded = (set: PlatformSet, p: PlatformData) => p.health !== 'bad' && missing(set, p).length > 0;

export function healthOf(set: PlatformSet, p: PlatformData): { tone: StatusTone; word: string } {
  if (p.health === 'bad') return { tone: 'bad', word: `Offline since ${p.since}` };
  if (setupNeeded(set, p)) return { tone: 'neutral', word: 'Setup needed' };
  if (p.health === 'warn') return { tone: 'warn', word: `Slow since ${p.since}` };
  if (p.health === 'accent') return { tone: 'accent', word: 'Setting up' };
  return { tone: 'ok', word: 'Running' };
}
const rank = (set: PlatformSet, p: PlatformData) => ['Offline', 'Setup needed', 'Slow', 'Setting up', 'Running'].findIndex((w) => healthOf(set, p).word.startsWith(w));
/** Problem first: Offline, Setup needed, Slow, Setting up, Running. */
export const ordered = (set: PlatformSet) => [...set.platforms].sort((a, b) => rank(set, a) - rank(set, b));
export const noFigures = (p: PlatformData) => (p.health === 'bad' ? `No figures since ${p.since}` : 'No activity yet');

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
export const andList = (parts: string[]) => (parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`);

/** The page's finding line (Leda's). */
export function headline(set: PlatformSet): string {
  if (!set.platforms.length) return 'No platforms yet.';
  const need = set.platforms.filter((p) => setupNeeded(set, p));
  if (need.length) {
    const more = need.length > 1 ? `, and ${need.length - 1} more` : '';
    return `${plural(set.links.length, 'data link')}. ${need[0].name} needs a ${lowerKind(missing(set, need[0])[0])} source${more}.`;
  }
  if (!set.links.length) return 'No data links yet.';
  if (set.links.length === 1) {
    const l = set.links[0];
    return `${byId(set, l.from).name} shares its ${lowerKind(l.kind)} with ${byId(set, l.to).name}.`;
  }
  return `${plural(set.links.length, 'data link')}, all set up.`;
}

/** The line under "All platforms": how many are not running. */
export function healthLine(set: PlatformSet): string {
  const words = set.platforms.map((p) => healthOf(set, p).word);
  const off = words.filter((w) => w.startsWith('Offline')).length;
  const need = words.filter((w) => w === 'Setup needed').length;
  const slow = words.filter((w) => w.startsWith('Slow')).length;
  const parts = [off && `${off} offline`, need && `${need} need setup`, slow && `${slow} slow`].filter(Boolean) as string[];
  return `${plural(set.platforms.length, 'platform')}${parts.length ? ` · ${parts.join(', ')}` : ' · all running'}`;
}

export interface LinkLine {
  key: string;
  need?: boolean;
  text: string;
}
const names = (set: PlatformSet, ids: string[]) => (ids.length <= 2 ? andList(ids.map((id) => byId(set, id).short)) : plural(ids.length, 'platform'));
/** "Reads Stock from A and B", "No stock source", "Shares Catalog with C". */
export function linkLines(set: PlatformSet, p: PlatformData): LinkLine[] {
  const out: LinkLine[] = readsOf(p.kind).map((k) => {
    const from = sourcesOf(set, p.id, k).map((l) => l.from);
    return from.length ? { key: `r-${k}`, text: `Reads ${dataKindName[k]} from ${names(set, from)}` } : { key: `r-${k}`, need: true, text: `No ${lowerKind(k)} source` };
  });
  const to: Partial<Record<DataKind, string[]>> = {};
  sharedBy(set, p.id).forEach((l) => (to[l.kind] ??= []).push(l.to));
  (Object.keys(to) as DataKind[]).forEach((k) => out.push({ key: `s-${k}`, text: `Shares ${dataKindName[k]} with ${names(set, to[k]!)}` }));
  if (!out.length) out.push({ key: 'none', text: sharesOf(p.kind).length ? `Can share ${andList(sharesOf(p.kind).map(lowerKind))}` : "Doesn't share data" });
  return out;
}

export interface IdleShare {
  platform: PlatformData;
  kind: DataKind;
  /** Marketplace keys of the kinds that could read it (not yet owned). */
  readers: string[];
}
/** What a platform could share but nobody reads yet. */
export function idleShares(set: PlatformSet): IdleShare[] {
  const owned = new Set(set.platforms.map((p) => p.kind));
  const out: IdleShare[] = [];
  set.platforms.forEach((p) =>
    sharesOf(p.kind).forEach((k) => {
      if (set.links.some((l) => l.from === p.id && l.kind === k)) return;
      const readers = sampleCatalog.filter((i) => !i.comingSoon && !owned.has(i.key) && (i.reads ?? []).includes(k)).map((i) => i.key);
      if (readers.length) out.push({ platform: p, kind: k, readers });
    }),
  );
  return out;
}

export function roadStatusWord(l: DataLink) {
  return l.status === 'slow' ? 'slow' : l.status === 'broken' ? 'broken' : 'working';
}

const mapType = (kind: string) => ({ inventory: 'warehouse', repair_shop: 'service', pos: 'store' }[kind] as TownMapPlatform['mapType']);
export function mapPlatforms(set: PlatformSet): TownMapSlot[] {
  const slots: TownMapSlot[] = set.platforms.map((p, i) => ({
    id: p.id,
    name: p.name,
    shortName: p.short,
    kind: kindName(p.kind),
    mapType: mapType(p.kind),
    status: p.health === 'bad' ? 'OFFLINE' : p.health === 'warn' ? 'DEGRADED' : 'ACTIVE',
    statusSince: p.health === 'warn' || p.health === 'bad' ? p.since : undefined,
    index: i + 1,
    initials: initialsOf(set)[p.id],
    count: setupNeeded(set, p) ? 1 : undefined,
  }));
  slots.push(hq);
  while (slots.length < 4) slots.push(null);
  return slots;
}
export const mapLinks = (set: PlatformSet): TownMapLink[] => set.links.map((l) => ({ from: l.from, to: l.to, status: l.status }));

/** Collision-safe monograms for the whole set (two platforms never share one). */
export function initialsOf(set: PlatformSet): Record<string, string> {
  const ini = platformInitialsFor(set.platforms.map((p) => p.name));
  return Object.fromEntries(set.platforms.map((p, i) => [p.id, ini[i]]));
}
