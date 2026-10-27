import { sampleCatalog } from '../components/Marketplace.sample';
import { logoAutoworks, logoCafe } from './Platforms.logos';

/**
 * Data for the Portal Platforms story. Copied from the workshop prototype (data.js, data-ext.js, platforms-core.js):
 * the same platforms, places, figures, links, health words and wording, per data set (duo, few = ?set=few, many = ?set=many).
 */

export type DataKind = 'stock' | 'catalog' | 'sales' | 'ledger';
export type MapStatus = 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
export type HealthState = 'SETUP' | 'NEW' | 'DEGRADED' | 'OFFLINE' | 'ACTIVE';

export interface PlatformData {
  id: string;
  /** The label ('Dela Cruz Auto Works'). */
  name: string;
  /** Short name used in sentences, chips and the status bar. */
  short: string;
  /** Marketplace key: 'inventory', 'repair_shop', 'pos', 'storefront', 'mobile_app', 'accounting', ... */
  kind: string;
  place: string;
  status: MapStatus;
  since?: string;
  isNew?: boolean;
  color: string;
  mono: string;
  logo?: string;
  /** Figures as [value, label]; the page reads them as "12 open jobs". */
  kpis: [string, string][];
}

export interface DataLink {
  from: string;
  to: string;
  kind: DataKind;
  /** The road: working or slow. */
  road: 'ok' | 'slow';
}

export interface Owner {
  name: string;
  email: string;
  initials: string;
  role: string;
}

export interface PlatformSet {
  owner: Owner;
  people: number;
  plan: string;
  usedRequests: number;
  /** Map lots in order; null is an empty lot. */
  slots: (string | null)[];
  platforms: PlatformData[];
  links: DataLink[];
}

/** What a data kind is called and what it shares (data-ext.js kinds). Ledger is not shareable yet. */
export const dataKinds: Record<DataKind, { name: string; shares: string | null }> = {
  stock: { name: 'Stock', shares: 'Products, stock levels and movements' },
  catalog: { name: 'Catalog', shares: 'Product catalog and pricing' },
  sales: { name: 'Sales', shares: 'In-store sales and receipts' },
  ledger: { name: 'Ledger', shares: null },
};
export const kname = (k: DataKind) => dataKinds[k].name;
export const kshares = (k: DataKind) => dataKinds[k].shares ?? 'Nothing to share yet';
export const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const RAMON: Owner = { name: 'Ramon Dela Cruz', email: 'mon@delacruzauto.ph', initials: 'RD', role: 'Owner' };
const BEA: Owner = { name: 'Bea Santos', email: 'bea@brewandbutter.ph', initials: 'BS', role: 'Owner' };
const duo: PlatformSet = {
  owner: RAMON,
  people: 9, plan: "Starter", usedRequests: 1742,
  slots: ["stockroom","autoworks",null,null],
  platforms: [
    { id: "autoworks", name: "Dela Cruz Auto Works", short: "Auto Works", kind: "repair_shop", place: "Aurora Blvd, Cubao", status: "ACTIVE", color: "#c2471f", mono: "DC", logo: logoAutoworks, kpis: [["12","open jobs"],["4","inquiries"],["3","for pickup"]] },
    { id: "stockroom", name: "Parts Stockroom", short: "Stockroom", kind: "inventory", place: "Aurora Blvd, Cubao", status: "ACTIVE", color: "#6d48c6", mono: "PS", kpis: [["612","products"],["9","low stock"],["2","POs open"]] },
  ],
  links: [
    { from: "stockroom", to: "autoworks", kind: "catalog", road: "ok" },
  ],
};
const few: PlatformSet = {
  owner: BEA,
  people: 9, plan: "Starter", usedRequests: 610,
  slots: ["inventory","cafepos","books",null],
  platforms: [
    { id: "inventory", name: "Inventory", short: "Café Inventory", kind: "inventory", place: "Café + kitchen", status: "ACTIVE", color: "#6d48c6", mono: "IN", kpis: [["68","products"],["8","low stock"],["4","out of stock"]] },
    { id: "cafepos", name: "Café POS", short: "Café POS", kind: "pos", place: "Maginhawa St", status: "ACTIVE", color: "#7a4a2e", mono: "CP", logo: logoCafe, kpis: [["₱6,120","sales today"],["38","orders"]] },
    { id: "books", name: "Books", short: "Books", kind: "accounting", place: "", status: "OFFLINE", since: "Wed 18:05", color: "#3a6d8c", mono: "BO", kpis: [] },
  ],
  links: [
    { from: "inventory", to: "cafepos", kind: "stock", road: "ok" },
  ],
};
const many: PlatformSet = {
  owner: RAMON,
  people: 23, plan: "Business", usedRequests: 1742,
  slots: ["marikina","cubao","inventory","kapitolyo","stockroom","cafepos","counter",null,"books"],
  platforms: [
    { id: "stockroom", name: "Parts Stockroom", short: "Stockroom", kind: "inventory", place: "Cubao, QC", status: "ACTIVE", color: "#6d48c6", mono: "PS", kpis: [["612","products"],["9","low stock"],["2","POs open"]] },
    { id: "cubao", name: "Cubao", short: "Cubao", kind: "repair_shop", place: "Aurora Blvd, QC", status: "ACTIVE", color: "#c2471f", mono: "CU", logo: logoAutoworks, kpis: [["11","jobs today"],["3","for pickup"]] },
    { id: "kapitolyo", name: "Kapitolyo", short: "Kapitolyo", kind: "repair_shop", place: "Brixton St, Pasig", status: "ACTIVE", color: "#3a6d8c", mono: "KA", kpis: [["8","jobs today"],["1","waiting for parts"]] },
    { id: "marikina", name: "Marikina", short: "Marikina", kind: "repair_shop", place: "J.P. Rizal St, Marikina", status: "DEGRADED", since: "7:40", color: "#85408f", mono: "MA", kpis: [["9","jobs today"]] },
    { id: "counter", name: "Cubao Parts Counter", short: "Parts Counter", kind: "pos", place: "Aurora Blvd, QC", status: "ACTIVE", color: "#5c6b22", mono: "CP", kpis: [["₱23,480","sales today"],["31","receipts"]] },
    { id: "inventory", name: "Café Inventory", short: "Café Inventory", kind: "inventory", place: "Café + kitchen", status: "ACTIVE", color: "#52607a", mono: "CI", kpis: [["68","products"],["8","low stock"],["4","out of stock"]] },
    { id: "cafepos", name: "Café POS", short: "Café POS", kind: "pos", place: "Maginhawa St", status: "ACTIVE", color: "#7a4a2e", mono: "CF", logo: logoCafe, kpis: [["₱6,120","sales today"],["38","orders"]] },
    { id: "books", name: "Books", short: "Books", kind: "accounting", place: "", status: "OFFLINE", since: "Wed 18:05", color: "#4f6b4a", mono: "BO", kpis: [] },
  ],
  links: [
    { from: "stockroom", to: "cubao", kind: "catalog", road: "ok" },
    { from: "stockroom", to: "kapitolyo", kind: "catalog", road: "ok" },
    { from: "stockroom", to: "marikina", kind: "catalog", road: "slow" },
    { from: "inventory", to: "cafepos", kind: "stock", road: "ok" },
  ],
};

export const sets = { duo, few, many, empty: { owner: RAMON, people: 9, plan: 'Starter', usedRequests: 1742, slots: [null, null, null, null], platforms: [], links: [] } as PlatformSet };
export type PlatformSetKey = keyof typeof sets;
export const LAST_LOADED = '9:10 AM';
export const NOW = '9:12 AM';
export const USAGE = { limit: 2000, daysLeft: 7 };

/* ---------- reads (platforms-core.js) ---------- */
export const plural = (n: number, w: string, ws?: string) => `${n} ${n === 1 ? w : ws ?? `${w}s`}`;
export const count = (n: number, w: string) => (n ? plural(n, w) : `No ${w}s`);
export const andList = (a: string[]) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

export const catalogItem = (key: string) => sampleCatalog.find((i) => i.key === key)!;
export const kindName = (key: string) => catalogItem(key).name;
export const hasApp = (key: string) => !!catalogItem(key).hasApp;
const readsOf = (key: string) => (catalogItem(key).reads ?? []) as DataKind[];
const providesOf = (key: string) => (catalogItem(key).shares ?? []) as DataKind[];
/** Kinds a platform may be added as (no "coming soon"). */
export const addableKinds = () => sampleCatalog.filter((i) => !i.comingSoon);

export const byId = (set: PlatformSet, id: string) => set.platforms.find((p) => p.id === id)!;
export const sourcesOf = (set: PlatformSet, id: string, k?: DataKind) => set.links.filter((l) => l.to === id && (!k || l.kind === k));
export const sharesOf = (set: PlatformSet, id: string) => set.links.filter((l) => l.from === id);
export const missing = (set: PlatformSet, p: PlatformData) => readsOf(p.kind).filter((k) => !sourcesOf(set, p.id, k).length);
export const setupNeeded = (set: PlatformSet, p: PlatformData) => readsOf(p.kind).length > 0 && !set.links.some((l) => l.to === p.id);
export const shareable = (p: PlatformData) => providesOf(p.kind).filter((k) => dataKinds[k].shares);

export interface Health {
  st: HealthState;
  text: string;
  word: string;
}
export function health(set: PlatformSet, p: PlatformData): Health {
  if (setupNeeded(set, p)) return { st: 'SETUP', text: 'Setup needed', word: 'needs setup' };
  if (p.isNew) return { st: 'NEW', text: 'Setting up', word: 'setting up' };
  if (p.status === 'DEGRADED') return { st: 'DEGRADED', text: `Slow since ${p.since}`, word: 'slow' };
  if (p.status === 'OFFLINE') return { st: 'OFFLINE', text: `Offline since ${p.since}`, word: 'offline' };
  return { st: 'ACTIVE', text: 'Running', word: 'running' };
}
const RANK: Record<HealthState, number> = { OFFLINE: 0, SETUP: 1, DEGRADED: 2, NEW: 3, ACTIVE: 4 };
/** Problem first: offline, setup needed, slow, setting up, running; data order within each. */
export const ordered = (set: PlatformSet) =>
  set.platforms.map((p, i) => [p, i] as const).sort((a, b) => RANK[health(set, a[0]).st] - RANK[health(set, b[0]).st] || a[1] - b[1]).map((x) => x[0]);
export const noFigures = (p: PlatformData) => (p.status === 'OFFLINE' && p.since && !p.isNew ? `No figures since ${p.since}` : 'No activity yet');

/** The line under "All platforms". */
export function healthLine(set: PlatformSet): string {
  const odd = ordered(set).filter((p) => health(set, p).st !== 'ACTIVE');
  const n = set.platforms.length;
  if (!odd.length) return n === 2 ? 'Both running.' : n === 1 ? 'Running.' : `All ${n} running.`;
  return `${n - odd.length} of ${n} running · ${odd.slice(0, 3).map((p) => `${p.short} ${health(set, p).word}`).join(' · ')}${odd.length > 3 ? ` · ${odd.length - 3} more` : ''}`;
}

/** Leda's finding line in the place column. */
export function headline(set: PlatformSet): string {
  if (!set.platforms.length) return 'No platforms yet.';
  const need = set.platforms.filter((p) => setupNeeded(set, p));
  if (need.length) return `${count(set.links.length, 'data link')}. ${need[0].name} needs a ${lower(kname(missing(set, need[0])[0]))} source${need.length > 1 ? `, and ${need.length - 1} more` : ''}.`;
  if (!set.links.length) return 'No data links yet.';
  if (set.links.length === 1) {
    const l = set.links[0];
    return `${byId(set, l.from).name} shares its ${lower(kname(l.kind))} with ${byId(set, l.to).name}.`;
  }
  return `${plural(set.links.length, 'data link')}, all set up.`;
}

export interface IdleShare {
  platform: PlatformData;
  kind: DataKind;
  /** Marketplace keys of the kinds that can read it (every addable kind that reads it). */
  readers: string[];
}
export function idleList(set: PlatformSet): IdleShare[] {
  return set.platforms
    .flatMap((p) =>
      shareable(p)
        .filter((k) => !sharesOf(set, p.id).some((l) => l.kind === k))
        .map((k) => ({ platform: p, kind: k, readers: addableKinds().filter((i) => (i.reads ?? []).includes(k)).map((i) => i.key) })),
    )
    .filter((x) => x.readers.length);
}

export const caption = (set: PlatformSet) => `${plural(set.platforms.length, 'platform')} · ${count(set.links.length, 'data link').replace('No d', 'no d')}`;
