import type { BlockedQuestionItem } from '../components/BlockedQuestions';
import type { DayHours, DayKey, OpeningHoursValue, PublicHoliday } from '../components/OpeningHours';
import type { RoleOption } from '../components/RolePicker';
import type { TryItAbout, TryItQuestion } from '../components/TryIt';

/** Sample data for the Platform page prototype (RDY-257). Not exported from the package. */

export type KindKey = 'repair' | 'inventory' | 'pos' | 'loyalty';
export type SectionId = 'general' | 'system' | 'team' | 'connections' | 'leda';
export type DataKind = 'stock' | 'catalog';

export interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'toggle' | 'select';
  hint?: string;
  unit?: string;
  options?: string[];
  def: string | number | boolean;
}

export interface Kind {
  key: KindKey;
  name: string;
  /** Lower-case form for running text ("how repair shop works for Auto Works"). */
  lower: string;
  mapType?: 'service' | 'warehouse' | 'store';
  hasApp: boolean;
  /** Which basics the kind asks for. */
  basics: BasicKey[];
  settings: SettingField[];
  roles: RoleOption[];
  provides: DataKind[];
  reads: DataKind[];
}

export type BasicKey = 'address' | 'phone' | 'email' | 'contact';
export const basicLabels: Record<BasicKey, [string, string]> = {
  address: ['Address', 'Where customers find it.'],
  phone: ['Phone', 'Shown to customers in your mobile app.'],
  email: ['Email', 'Where customers write to.'],
  contact: ['Contact person', 'Who staff ask for here.'],
};

export const SECTIONS: { id: SectionId; name: string; optional: boolean; save?: string }[] = [
  { id: 'general', name: 'General info', optional: false, save: 'general info' },
  { id: 'system', name: 'System', optional: true, save: 'system settings' },
  { id: 'team', name: 'Team', optional: true },
  { id: 'connections', name: 'Connections', optional: true },
  { id: 'leda', name: 'Leda & Memory', optional: true },
];
export const sectionName = (id: SectionId) => SECTIONS.find((s) => s.id === id)!.name;

const genericRoles: RoleOption[] = [
  { id: 'manager', name: 'Manager', about: 'Runs it day to day and changes its settings.' },
  { id: 'staff', name: 'Staff', about: 'Works in it every day.' },
  { id: 'viewer', name: 'Viewer', about: 'Can look, not change.' },
];

export const kinds: Record<KindKey, Kind> = {
  repair: {
    key: 'repair',
    name: 'Repair shop',
    lower: 'repair shop',
    mapType: 'service',
    hasApp: true,
    basics: ['address', 'phone', 'email'],
    settings: [
      { key: 'prefix', label: 'Job number prefix', type: 'text', hint: 'Starts every job number, like JOB-1042.', def: 'JOB' },
      { key: 'warranty', label: 'Default warranty', type: 'number', unit: 'days', hint: 'Used when a job does not set its own.', def: 30 },
      { key: 'labour', label: 'Labour rate', type: 'number', unit: '₱ per hour', def: 650 },
      { key: 'bays', label: 'Service bays', type: 'number', hint: 'How many jobs can run at once.', def: 4 },
    ],
    roles: [
      { id: 'manager', name: 'Manager', about: 'Runs the shop and changes its settings.' },
      { id: 'advisor', name: 'Service advisor', about: 'Writes up jobs and talks to customers.' },
      { id: 'mechanic', name: 'Mechanic', about: 'Works the jobs given to them.' },
      { id: 'viewer', name: 'Viewer', about: 'Can look, not change.' },
    ],
    provides: [],
    reads: ['stock', 'catalog'],
  },
  inventory: {
    key: 'inventory',
    name: 'Inventory',
    lower: 'inventory',
    mapType: 'warehouse',
    hasApp: true,
    basics: ['address', 'contact', 'phone'],
    settings: [
      { key: 'reorder', label: 'Default reorder level', type: 'number', hint: 'Low-stock alerts start below this.', def: 5 },
      { key: 'unit', label: 'Default unit', type: 'select', options: ['Piece', 'Box', 'Litre', 'Kilogram'], def: 'Piece' },
      { key: 'alerts', label: 'Low-stock alerts', type: 'toggle', hint: 'Tell the manager when an item runs low.', def: true },
    ],
    roles: [
      { id: 'manager', name: 'Manager', about: 'Runs the stockroom and changes its settings.' },
      { id: 'clerk', name: 'Stock clerk', about: 'Receives, counts and moves stock.' },
      { id: 'viewer', name: 'Viewer', about: 'Can look, not change.' },
    ],
    provides: ['stock', 'catalog'],
    reads: [],
  },
  pos: {
    key: 'pos',
    name: 'Point of sale',
    lower: 'point of sale',
    mapType: 'store',
    hasApp: true,
    basics: ['address', 'phone'],
    settings: [
      { key: 'footer', label: 'Receipt footer', type: 'text', hint: 'Printed at the bottom of every receipt.', def: 'Thank you! Come again.' },
      { key: 'vat', label: 'Prices include VAT', type: 'toggle', def: true },
      { key: 'terminals', label: 'Terminals', type: 'number', hint: 'Tills that can take payment at once.', def: 2 },
    ],
    roles: genericRoles,
    provides: ['catalog'],
    reads: ['stock'],
  },
  loyalty: {
    key: 'loyalty',
    name: 'Loyalty',
    lower: 'loyalty program',
    hasApp: false,
    basics: ['address', 'phone'],
    settings: [
      { key: 'summary', label: 'Daily summary', type: 'toggle', hint: 'Email the team a summary each evening.', def: false },
      { key: 'note', label: 'Note for the team', type: 'text', hint: 'Shown at the top of this platform for staff.', def: '' },
    ],
    roles: genericRoles,
    provides: [],
    reads: ['catalog'],
  },
};

export const dataKinds: Record<DataKind, { name: string; shares: string }> = {
  stock: { name: 'Stock', shares: 'products, stock levels and movements' },
  catalog: { name: 'Catalog', shares: 'product names, prices and photos' },
};

/* ---------- people and roles ---------- */
export interface Person {
  id: string;
  name: string;
  initials: string;
  /** Portal access line: "Owner", "Admin" or the job title. */
  title: string;
  access: 'owner' | 'admin' | 'member';
}
export const people: Person[] = [
  { id: 'maria', name: 'Maria Santos', initials: 'MS', title: 'Owner', access: 'owner' },
  { id: 'jun', name: 'Jun Reyes', initials: 'JR', title: 'Admin', access: 'admin' },
  { id: 'ana', name: 'Ana Cruz', initials: 'AC', title: 'Service advisor', access: 'member' },
  { id: 'ben', name: 'Ben Lim', initials: 'BL', title: 'Stock clerk', access: 'member' },
  { id: 'carla', name: 'Carla Diaz', initials: 'CD', title: 'Mechanic', access: 'member' },
  { id: 'dan', name: 'Dan Ocampo', initials: 'DO', title: 'Cashier', access: 'member' },
];
export const person = (id: string) => people.find((p) => p.id === id)!;
export interface Invite {
  id: string;
  name: string;
  platformId: string;
  roleId: string;
  sent: boolean;
}
export const invites: Invite[] = [{ id: 'eli', name: 'Eli Tan', platformId: 'autoworks', roleId: 'mechanic', sent: true }];

/** Role of each person on each platform, as the Team page holds it. */
export const teamRoles: Record<string, Record<string, string>> = {
  autoworks: { maria: 'manager', jun: 'manager', ana: 'advisor', carla: 'mechanic' },
  stockroom: { maria: 'manager', ben: 'clerk' },
  cafe: { dan: 'staff' },
};

/* ---------- platforms ---------- */
export type Health = 'ok' | 'slow' | 'offline' | 'setup' | 'setting-up';
export interface PlatformRec {
  id: string;
  label: string;
  kind: KindKey;
  place: string;
  health: Health;
  note?: string;
  version?: string;
  synced?: string;
  connected: string;
  /** Created in onboarding and not finished yet. */
  isNew?: boolean;
  index: number;
}
export const platformsStart: PlatformRec[] = [
  { id: 'autoworks', label: 'Dela Cruz Auto Works', kind: 'repair', place: 'Quezon City', health: 'ok', version: '2.4.1', synced: '9:12 AM', connected: '3 Aug 2026', index: 1 },
  { id: 'stockroom', label: 'Parts Stockroom', kind: 'inventory', place: 'Manila', health: 'ok', version: '2.4.1', synced: '9:12 AM', connected: '3 Aug 2026', index: 2 },
  { id: 'cafe', label: 'Café POS', kind: 'pos', place: 'Makati', health: 'slow', note: 'Slow since 7:40', version: '2.3.9', synced: '9:10 AM', connected: '17 Aug 2026', index: 3 },
];
export const shortName = (p: { label: string }) => p.label.replace(/^Dela Cruz /, '').replace(/^Parts /, '').replace(/ POS$/, '');

/** `to` reads `kind` from `from`. */
export interface DataLink {
  from: string;
  to: string;
  kind: DataKind;
  status: 'linked' | 'slow' | 'pending';
}
export const linksStart: DataLink[] = [
  { from: 'stockroom', to: 'autoworks', kind: 'catalog', status: 'linked' },
  { from: 'stockroom', to: 'cafe', kind: 'stock', status: 'slow' },
];

/* ---------- opening hours ---------- */
const day = (from: string, to: string, open = true): DayHours => ({ open, from, to });
export const companyWeek: Record<DayKey, DayHours> = {
  mon: day('08:00', '18:00'),
  tue: day('08:00', '18:00'),
  wed: day('08:00', '18:00'),
  thu: day('08:00', '18:00'),
  fri: day('08:00', '18:00'),
  sat: day('08:00', '18:00'),
  sun: day('08:00', '18:00', false),
};
export const hoursSame: OpeningHoursValue = { sameAsCompany: true, week: { ...companyWeek }, holidays: { closed: true, openOn: [] }, closures: [] };
export const hoursOwn: OpeningHoursValue = {
  sameAsCompany: false,
  week: { ...companyWeek, sat: day('09:00', '14:00') },
  holidays: { closed: true, openOn: [] },
  closures: [{ id: 'c1', date: '2026-11-02', reason: 'Stock count' }],
};
export const publicHolidays: PublicHoliday[] = [
  { date: '2026-11-01', name: 'All Saints’ Day' },
  { date: '2026-11-02', name: 'All Souls’ Day' },
  { date: '2026-11-30', name: 'Bonifacio Day' },
  { date: '2026-12-08', name: 'Feast of the Immaculate Conception' },
  { date: '2026-12-25', name: 'Christmas Day' },
];
export const today = '2026-10-22';
export const nowSample = { day: 'thu' as DayKey, minutes: 552, date: today };

/* ---------- Leda: topics, requests, blocked questions ---------- */
export interface DataTopic {
  key: string;
  title: string;
  text: string;
  ask: string;
  /** Off by default; why. */
  sensitive?: string;
  /** Where to change it: a tab of this page, or text for "app only". */
  edit: { tab: SectionId; label: string } | { app: string };
}
export const dataTopics: Record<KindKey, DataTopic[]> = {
  repair: [
    { key: 'services', title: 'Services and prices', text: 'Oil change from ₱1,200, brake pads from ₱2,800, aircon cleaning ₱1,500. Prices are before parts.', ask: 'How much is an oil change?', sensitive: 'Prices can be out of date.', edit: { app: 'Edit in the Repair shop app' } },
    { key: 'hours', title: 'Opening hours', text: 'Open Monday to Saturday, 8:00 AM to 6:00 PM, and closed on Sundays and public holidays.', ask: 'Are you open now?', edit: { tab: 'system', label: 'Edit opening hours' } },
    { key: 'status', title: 'Job status', text: 'Customers can ask where their car is: waiting, in the bay, done or ready for pick-up.', ask: 'Is my car ready?', edit: { app: 'Comes from jobs in the app' } },
    { key: 'where', title: 'Address and directions', text: 'On the address on the General info tab, with the phone number to call when lost.', ask: 'Where are you?', edit: { tab: 'general', label: 'Edit address' } },
  ],
  inventory: [
    { key: 'stock', title: 'Parts in stock', text: 'Whether a part is in stock, never how many are left or what it cost.', ask: 'Do you have brake pads?', edit: { app: 'Comes from stock in the app' } },
    { key: 'hours', title: 'Opening hours', text: 'The hours the stockroom takes pick-ups.', ask: 'When can I pick up?', edit: { tab: 'system', label: 'Edit opening hours' } },
    { key: 'cost', title: 'Costs and suppliers', text: 'What parts cost the business and who supplies them.', ask: 'Who is your supplier?', sensitive: 'Business-only details.', edit: { app: 'Comes from stock in the app' } },
  ],
  pos: [
    { key: 'menu', title: 'Menu and prices', text: 'Everything on the menu with today’s price.', ask: 'How much is a latte?', edit: { app: 'Edit in the POS app' } },
    { key: 'hours', title: 'Opening hours', text: 'The hours the café takes orders.', ask: 'Are you open?', edit: { tab: 'system', label: 'Edit opening hours' } },
  ],
  loyalty: [
    { key: 'points', title: 'Points and rewards', text: 'What a customer earns, and what the next reward costs.', ask: 'How many points do I have?', edit: { app: 'Comes from the program’s data' } },
    { key: 'hours', title: 'Opening hours', text: 'The hours the rewards desk is open.', ask: 'When can I claim a reward?', edit: { tab: 'system', label: 'Edit opening hours' } },
  ],
};
export const requestDefs: Record<KindKey, [string, string, string, string][]> = {
  repair: [
    ['book', 'Book a job', 'A customer asks for a slot. Staff confirm the time.', 'Can I book for Saturday?'],
    ['quote', 'Ask for a quote', 'A customer describes the problem and staff reply.', 'Can I get a quote for a brake job?'],
  ],
  inventory: [['hold', 'Hold a part', 'A customer asks to put a part aside for pick-up.', 'Can you hold a set of brake pads?']],
  pos: [['order', 'Order ahead', 'A customer orders and staff accept it.', 'Can I order a latte for 8:30?']],
  loyalty: [['claim', 'Claim a reward', 'A customer asks to use points.', 'Can I claim my free coffee?']],
};
export const neverShared = 'Other customers’ details, staff notes and pay are never used for customers.';
export const memoryCap = 4000;
export interface CustomTopic {
  id: string;
  title: string;
  content: string;
  updated: string;
}
export interface LedaState {
  /** On or off per topic key (`key` for data topics, `c:<id>` for custom ones). */
  data: Record<string, boolean>;
  requests: Record<string, boolean>;
  custom: CustomTopic[];
  blocked: BlockedQuestionItem[];
  reply: string;
}
export const everyBusinessBlocked = 2;

export function ledaStart(kind: KindKey, label: string): LedaState {
  const data: Record<string, boolean> = {};
  dataTopics[kind].forEach((t) => (data[t.key] = !t.sensitive));
  const requests: Record<string, boolean> = {};
  requestDefs[kind].forEach((r) => (requests[r[0]] = true));
  return {
    data,
    requests,
    custom: [],
    blocked: [],
    reply: `I can't help with that here. Please ask the team at ${label}.`,
  };
}

export const ledaAutoworks = (): LedaState => ({
  ...ledaStart('repair', 'Dela Cruz Auto Works'),
  data: { services: false, hours: true, status: true, where: true, 'c:k1': true },
  custom: [{ id: 'k1', title: 'Warranty on repairs', content: 'Every repair carries a 30-day warranty on labour. Parts follow the maker’s warranty.', updated: 'Tue' }],
  blocked: [
    { id: 'b1', question: 'Who is your parts supplier?', scope: 'autoworks' },
    { id: 'b2', question: 'How much do you pay your mechanics?', scope: 'autoworks' },
  ],
});

export const tryAbouts = (label: string, id: string): TryItAbout[] => [{ value: id, label }];
export const tryQuestions = (kind: KindKey, blocked: BlockedQuestionItem[], custom: CustomTopic[]): TryItQuestion[] => [
  ...dataTopics[kind].map((t) => ({ value: `t:${t.key}`, label: t.ask })),
  ...custom.map((c) => ({ value: `c:${c.id}`, label: `What should I know about ${c.title.toLowerCase()}?` })),
  ...requestDefs[kind].map((r) => ({ value: `r:${r[0]}`, label: r[3] })),
  ...blocked.map((b) => ({ value: `b:${b.id}`, label: b.question })),
];

/* ---------- details held per platform ---------- */
export interface Detail {
  label: string;
  basics: Partial<Record<BasicKey, string>>;
  /** Uploaded logo as a data URL; `undefined` = the default monogram. */
  logo?: string;
  settings: Record<string, string | number | boolean>;
  hours: OpeningHoursValue;
  team: Record<string, string>;
  leda: LedaState;
  skipped: SectionId[];
}
export const settingsDefaults = (kind: KindKey): Record<string, string | number | boolean> =>
  Object.fromEntries(kinds[kind].settings.map((f) => [f.key, f.def]));

export const detailsStart = (): Record<string, Detail> => ({
  autoworks: {
    label: 'Dela Cruz Auto Works',
    basics: { address: '14 Aurora Blvd, Quezon City', phone: '0917 555 0142', email: 'shop@delacruzauto.ph' },
    settings: { ...settingsDefaults('repair'), warranty: 30 },
    hours: hoursOwn,
    team: { ...teamRoles.autoworks },
    leda: ledaAutoworks(),
    skipped: [],
  },
  stockroom: {
    label: 'Parts Stockroom',
    basics: { address: '88 Recto Ave, Manila', contact: 'Ben Lim', phone: '0917 555 0188' },
    settings: settingsDefaults('inventory'),
    hours: hoursSame,
    team: { ...teamRoles.stockroom },
    leda: ledaStart('inventory', 'Parts Stockroom'),
    skipped: [],
  },
  cafe: {
    label: 'Café POS',
    basics: { address: '5 Jupiter St, Makati', phone: '0917 555 0105' },
    settings: settingsDefaults('pos'),
    hours: hoursSame,
    team: { ...teamRoles.cafe },
    leda: ledaStart('pos', 'Café POS'),
    skipped: [],
  },
});

export const plural = (n: number, one: string, many?: string) => `${n} ${n === 1 ? one : (many ?? `${one}s`)}`;
export const andList = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
