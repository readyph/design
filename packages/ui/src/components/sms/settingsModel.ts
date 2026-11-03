/**
 * Settings (round 1): the data, validation and small stores behind Shop details, Team and Notifications. Studio only.
 * Sample data to replace: none of this exists in the API yet (see rationale: "Settings page (round 1)").
 * Staff are built from `data.ts` (manager + the four mechanics) so names, phones, bays and shifts agree with Today, Services and Mechanic.
 */
import { useSyncExternalStore } from 'react';
import { branch, businessHours, manager, mechanics, type Mechanic } from './data';

// ---------- Weekdays and hours ----------
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = (typeof DAYS)[number];
export const DAY_LABEL: Record<DayKey, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
export const DAY_SHORT: Record<DayKey, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
export const WEEKDAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
export interface DayHours { open: boolean; from: string; to: string }
export type WeekHours = Record<DayKey, DayHours>;

export const week = (f: (d: DayKey) => DayHours): WeekHours => Object.fromEntries(DAYS.map((d) => [d, f(d)])) as WeekHours;
export const sameHours = (a: DayHours, b: DayHours) => a.open === b.open && (!a.open || (a.from === b.from && a.to === b.to));

/** Half-hour steps, 05:00 to 22:00. */
export const TIME_OPTIONS = Array.from({ length: 35 }, (_, i) => {
  const m = 5 * 60 + i * 30;
  const v = `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`;
  return { value: v, label: fmt12(v) };
});
/** "07:30" -> "7:30 am". */
export function fmt12(hm: string): string {
  const h = Number(hm.slice(0, 2)); const m = hm.slice(3, 5);
  return `${h % 12 || 12}:${m} ${h < 12 ? 'am' : 'pm'}`;
}
const short12 = (hm: string) => { const t = fmt12(hm); return t.replace(':00', ''); };
export const toMin = (hm: string) => Number(hm.slice(0, 2)) * 60 + Number(hm.slice(3, 5));
/** Error for one day: closing must be after opening. */
export const dayError = (d: DayHours): string | undefined => (d.open && toMin(d.to) <= toMin(d.from) ? 'Closing time must be after opening time.' : undefined);
export const weekErrors = (w: WeekHours): Partial<Record<DayKey, string>> => Object.fromEntries(DAYS.flatMap((d) => { const e = dayError(w[d]); return e ? [[d, e]] : []; }));

/** "Mon-Fri 8 am-5 pm, Sat 8 am-12 pm": consecutive days with the same hours are joined. */
export function summarizeWeek(w: WeekHours): string {
  const runs: string[] = [];
  let i = 0;
  while (i < DAYS.length) {
    const d = w[DAYS[i]!]!;
    if (!d.open) { i++; continue; }
    let j = i;
    while (j + 1 < DAYS.length && sameHours(w[DAYS[j + 1]!]!, d)) j++;
    const days = j === i ? DAY_SHORT[DAYS[i]!] : `${DAY_SHORT[DAYS[i]!]}-${DAY_SHORT[DAYS[j]!]}`;
    runs.push(`${days} ${short12(d.from)}-${short12(d.to)}`);
    i = j + 1;
  }
  return runs.length ? runs.join(', ') : 'No shift';
}

// ---------- Validation ----------
const digits = (s: string) => s.replace(/[\s()-]/g, '');
/** Philippine mobile (09xx xxx xxxx, +63 9xx...) or a landline with area code (02 8xxx xxxx). */
export const phoneValid = (s: string) => /^(\+63|0)\d{9,10}$/.test(digits(s));
export const emailValid = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
export const tinValid = (s: string) => { const n = s.replace(/\D/g, '').length; return n === 9 || n === 12; };

// ---------- Shop details ----------
export interface ClosedDay { id: string; date: string; reason: string }
export interface ShopDetails {
  business: string; branchName: string; address: string; phone: string; email: string; tin: string;
  /** Data URL or URL of the uploaded logo; null = the BizMark placeholder. */
  logo: string | null;
  hours: WeekHours;
  closed: ClosedDay[];
}
export type ShopErrors = Partial<Record<'business' | 'branchName' | 'address' | 'phone' | 'email' | 'tin', string>> & { hours?: Partial<Record<DayKey, string>> };

export function validateShop(s: ShopDetails): ShopErrors {
  const e: ShopErrors = {};
  if (!s.business.trim()) e.business = 'Enter your business name. It is printed on receipts and quotations.';
  if (!s.branchName.trim()) e.branchName = 'Enter the branch name, for example Kapitolyo.';
  if (!s.address.trim()) e.address = 'Enter the branch address.';
  if (!s.phone.trim()) e.phone = 'Enter a phone number customers can call.';
  else if (!phoneValid(s.phone)) e.phone = 'Use a Philippine number, for example 0917 555 0142 or 02 8123 4567.';
  if (s.email.trim() && !emailValid(s.email)) e.email = 'This email looks incomplete. Use name@example.com.';
  if (s.tin.trim() && !tinValid(s.tin)) e.tin = 'A TIN has 9 or 12 digits, for example 123-456-789-000.';
  const h = weekErrors(s.hours);
  if (Object.keys(h).length) e.hours = h;
  return e;
}
export const errorCount = (e: ShopErrors) => Object.values(e).reduce((n, v) => n + (typeof v === 'string' ? 1 : Object.keys(v ?? {}).length), 0);

export const SHOP_HOURS: WeekHours = week((d) => d === 'sun' ? { open: false, from: businessHours.open, to: businessHours.close } : { open: true, from: businessHours.open, to: businessHours.close });
export const SEED_SHOP: ShopDetails = {
  business: branch.business, branchName: branch.name, address: branch.address.replace('Pasig City', 'Mandaluyong City'), phone: '0917 555 0142', email: 'kapitolyo@delacruzauto.example', tin: '',
  logo: null, hours: SHOP_HOURS,
  closed: [{ id: 'cd1', date: '2026-11-30', reason: 'Bonifacio Day' }, { id: 'cd2', date: '2026-12-25', reason: 'Christmas Day' }, { id: 'cd3', date: '2027-01-01', reason: 'New Year' }],
};
export const NEW_SHOP: ShopDetails = { business: '', branchName: '', address: '', phone: '', email: '', tin: '', logo: null, hours: week((d) => ({ open: d !== 'sun', from: '08:00', to: '17:00' })), closed: [] };
export const LONG_SHOP: ShopDetails = { ...SEED_SHOP, business: 'Dela Cruz Auto Works and Motorcycle Repair Specialists Incorporated', branchName: 'Kapitolyo, Mandaluyong (beside the Shaw Boulevard overpass)', address: 'Unit 3, Ground Floor, United Street corner Pasig Boulevard Extension, Barangay Kapitolyo, Mandaluyong City, Metro Manila 1550' };

/** A tiny placeholder logo so the "has a logo" states have something to show. Sample data to replace with the uploaded file. */
export const SAMPLE_LOGO = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1e293b"/><path d="M14 44 26 20h6l12 24h-7l-2-5H23l-2 5zm11-11h9l-4.5-10z" fill="#f8fafc"/></svg>')}`;

// ---------- Shared logo store (the only global state: the Mechanic header reads it) ----------
let logo: string | null = null;
const subs = new Set<() => void>();
export const getShopLogo = () => logo;
export function setShopLogo(v: string | null) { if (v === logo) return; logo = v; subs.forEach((f) => f()); }
export const useShopLogo = (): string | null => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, getShopLogo, getShopLogo);

// ---------- Team ----------
export type StaffRole = 'manager' | 'mechanic' | 'front_desk';
export const ROLE_LABEL: Record<StaffRole, string> = { manager: 'Manager', mechanic: 'Mechanic', front_desk: 'Front desk' };
export const ROLE_NOTE: Record<StaffRole, string> = {
  manager: 'Sees everything: jobs, prices, payments, reports and Settings.',
  front_desk: 'Books services, takes payments and talks to customers. Cannot change prices or Settings.',
  mechanic: "Mechanics can't see prices or payments. They see only their own jobs, parts and messages in the mechanic app.",
};
export interface Staff { id: string; name: string; phone: string; email: string; role: StaffRole; active: boolean; hours: WeekHours; bay: string; invited?: boolean; you?: boolean }
export const BAYS = ['', 'Bay 1', 'Bay 2', 'Bay 3', 'Moto bay'];

const parseShift = (s: string): { from: string; to: string } => { const [a, b] = s.split('-') as [string, string]; const p = (x: string) => `${x.split(':')[0]!.padStart(2, '0')}:${x.split(':')[1]}`; return { from: p(a), to: p(b) }; };
const shiftWeek = (from: string, to: string, days: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']): WeekHours => week((d) => ({ open: days.includes(d), from, to }));

export const SEED_STAFF: Staff[] = [
  { id: manager.id, name: manager.name, phone: manager.phone, email: 'mon@delacruzauto.example', role: 'manager', active: true, hours: shiftWeek('07:30', '17:30'), bay: '', you: true },
  ...mechanics.map((m): Staff => ({ id: m.id, name: m.name, phone: m.phone, email: '', role: 'mechanic', active: true, hours: shiftWeek(parseShift(m.shift).from, parseShift(m.shift).to), bay: m.bay })),
  { id: 'p-carmela', name: 'Carmela Dizon', phone: '0917 884 2036', email: 'carmela@delacruzauto.example', role: 'front_desk', active: true, hours: shiftWeek('08:00', '17:00', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']), bay: '' },
  { id: 'p-eddie', name: 'Eddie Ramos', phone: '0926 150 3384', email: '', role: 'mechanic', active: false, hours: shiftWeek('08:00', '17:00'), bay: '' },
];
const FIRST = ['Andres', 'Bianca', 'Cesar', 'Dolores', 'Emmanuel', 'Fe', 'Gilbert', 'Hazel', 'Ian', 'Jocelyn', 'Kenneth', 'Lourdes', 'Marlon', 'Nena', 'Oscar', 'Perla'];
const LAST = ['Aguilar', 'Bernardo', 'Cabrera', 'Domingo', 'Estrada', 'Flores', 'Garcia', 'Hernandez', 'Ilagan', 'Jimenez', 'Lacson', 'Macaraeg'];
export const STRESS_STAFF: Staff[] = [
  ...SEED_STAFF,
  ...Array.from({ length: 30 }, (_, i): Staff => ({
    id: `p-x${i}`, name: `${FIRST[i % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`, phone: `09${String(17 + (i % 10))} ${String(300 + i * 7).padStart(3, '0')} ${String(4000 + i * 13)}`, email: '',
    role: i % 7 === 0 ? 'front_desk' : 'mechanic', active: i % 9 !== 4, hours: shiftWeek('08:00', i % 2 ? '17:00' : '18:00'), bay: '',
  })),
];
export const LONG_STAFF: Staff[] = [
  { ...SEED_STAFF[0]! },
  { id: 'p-long', name: 'Maria Cristina Dela Cruz-Villanueva y Guzman de los Santos', phone: '0917 555 0199', email: 'maria.cristina.dela.cruz.villanueva.guzman@delacruzauto.example', role: 'front_desk', active: true, hours: shiftWeek('08:00', '17:00'), bay: '' },
  ...SEED_STAFF.slice(1, 4),
];
// ---------- Shared staff store (Team -> Today, Services, Mechanic) ----------
const unpad = (hm: string) => `${Number(hm.split(':')[0])}:${hm.split(':')[1]}`;
/** The Mechanic record the rest of the app reads: active mechanics only (a deactivated one is no longer assignable). */
export function mechanicFromStaff(s: Staff, orig?: Mechanic): Mechanic {
  const d = DAYS.map((k) => s.hours[k]).find((h) => h.open);
  return {
    ...orig, id: s.id, name: s.name.trim(), short: s.name.replace(/"[^"]*"/g, '').trim().split(/\s+/)[0] ?? s.name, initials: initialsOf(s.name), role: 'mechanic', phone: s.phone, bay: s.bay || 'No bay',
    onShift: orig?.onShift ?? true, shift: d ? `${unpad(d.from)}-${unpad(d.to)}` : orig?.shift ?? '8:00-17:00',
  };
}
const SEED_MECHANICS: Mechanic[] = mechanics.map((m) => ({ ...m }));
let staffList: Staff[] = SEED_STAFF.map((s) => ({ ...s }));
const staffSubs = new Set<() => void>();
/** Rewrites the shared `mechanics` array in place, so Today, Services and Mechanic (which read it) see the Team page's edits. */
function syncMechanics() {
  const next = staffList.filter((s) => s.role === 'mechanic' && s.active).map((s) => mechanicFromStaff(s, SEED_MECHANICS.find((m) => m.id === s.id)));
  mechanics.splice(0, mechanics.length, ...next);
}
export const getStaff = () => staffList;
export function setStaff(next: Staff[]) { staffList = next; syncMechanics(); staffSubs.forEach((f) => f()); }
export const resetStaff = () => setStaff(SEED_STAFF.map((s) => ({ ...s })));
export const useStaff = (): Staff[] => useSyncExternalStore((f) => { staffSubs.add(f); return () => { staffSubs.delete(f); }; }, getStaff, getStaff);

export const newStaffId = (() => { let n = 1; return () => `p-new${n++}`; })();
export const defaultShift = (role: StaffRole): WeekHours => role === 'manager' ? shiftWeek('07:30', '17:30') : shiftWeek('08:00', '17:00');

export function validateStaff(s: Pick<Staff, 'name' | 'phone' | 'email'>, invite: boolean): Partial<Record<'name' | 'phone' | 'email', string>> {
  const e: Partial<Record<'name' | 'phone' | 'email', string>> = {};
  if (!s.name.trim()) e.name = 'Enter the staff name.';
  if (!s.phone.trim()) e.phone = 'Enter a mobile number.';
  else if (!phoneValid(s.phone)) e.phone = 'Use a Philippine mobile number, for example 0917 555 0142.';
  if (s.email.trim() && !emailValid(s.email)) e.email = 'This email looks incomplete. Use name@example.com.';
  if (invite && !s.phone.trim() && !s.email.trim()) e.phone = 'Add a phone or an email to send the invite to.';
  return e;
}
export const initialsOf = (name: string) => { const p = name.replace(/"[^"]*"/g, '').trim().split(/\s+/); return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1]![0]! : '')).toUpperCase() || '?'; };

// ---------- Notifications ----------
export type Channel = 'app' | 'sms' | 'email';
export const CHANNELS: { id: Channel; label: string }[] = [{ id: 'app', label: 'In-app' }, { id: 'sms', label: 'SMS' }, { id: 'email', label: 'Email' }];
export type NotifRole = 'manager' | 'front_desk' | 'mechanic';
export interface NotifEvent { id: string; label: string; hint: string; roles: NotifRole[] }
export const NOTIF_EVENTS: NotifEvent[] = [
  { id: 'request', label: 'New request from a mechanic', hint: 'A part request, a found problem or a question.', roles: ['manager', 'front_desk'] },
  { id: 'message', label: 'Mechanic message', hint: 'A note or a reply from the mechanic app.', roles: ['manager', 'front_desk'] },
  { id: 'part', label: 'Part ready', hint: 'A requested part is at the stockroom.', roles: ['manager', 'mechanic'] },
  { id: 'quote', label: 'Quote approved by customer', hint: 'The customer said yes to a quotation.', roles: ['manager', 'front_desk', 'mechanic'] },
  { id: 'payment', label: 'Payment received', hint: 'A payment was recorded on a service.', roles: ['manager', 'front_desk'] },
  { id: 'pickup', label: 'Car ready for pick-up', hint: 'The work is done and the car can be collected.', roles: ['manager', 'front_desk'] },
];
export const NOTIF_ROLE_LABEL: Record<NotifRole, string> = { manager: 'Manager', front_desk: 'Front desk', mechanic: 'Mechanic' };
export const NOTIF_ROLE_HINT: Partial<Record<string, string>> = { 'part.mechanic': 'The mechanic who asked', 'quote.mechanic': 'The assigned mechanic' };
/** Key: `${event}.${role}.${channel}` */
export type NotifPrefs = Record<string, boolean>;
export const prefKey = (e: string, r: NotifRole, c: Channel) => `${e}.${r}.${c}`;
export const SEED_PREFS: NotifPrefs = (() => {
  const p: NotifPrefs = {};
  for (const e of NOTIF_EVENTS) for (const r of e.roles) for (const c of CHANNELS) p[prefKey(e.id, r, c.id)] = c.id === 'app' || (c.id === 'sms' && r === 'manager' && (e.id === 'request' || e.id === 'payment'));
  return p;
})();

// ---------- Customer text templates ----------
export const VARIABLES = [
  { id: 'customer', label: '{customer}', sample: 'Maricel', hint: "The customer's first name" },
  { id: 'plate', label: '{plate}', sample: 'NBC 4521', hint: 'The car plate number' },
  { id: 'shop', label: '{shop}', sample: 'Dela Cruz Auto Works', hint: 'Your business name' },
  { id: 'amount', label: '{amount}', sample: 'PHP 4,850', hint: 'The total or the amount paid' },
  { id: 'link', label: '{link}', sample: 'rdy.ph/q/8Kd2', hint: 'A link to the quotation or receipt' },
] as const;
export interface Template { id: string; name: string; when: string; body: string; original: string }
const T = (id: string, name: string, when: string, body: string): Template => ({ id, name, when, body, original: body });
export const SEED_TEMPLATES: Template[] = [
  T('reminder', 'Appointment reminder', 'The day before a booked service', 'Hi {customer}, this is {shop}. A reminder that {plate} is booked with us tomorrow. Reply here if you need to move it.'),
  T('quote', 'Quote ready', 'When you send a quotation', 'Hi {customer}, your quotation for {plate} is ready: {amount}. Review and approve it here: {link}'),
  T('pickup', 'Car ready for pick-up', 'When the work is done', 'Hi {customer}, {plate} is ready for pick-up at {shop}. Total: {amount}. Thank you!'),
  T('receipt', 'Payment receipt', 'When a payment is recorded', 'Thank you, {customer}. We received {amount} for {plate}. Your receipt: {link} - {shop}'),
];
export const LONG_TEMPLATES: Template[] = SEED_TEMPLATES.map((t) => (t.id === 'quote' ? { ...t, body: `${t.body} If anything looks different from what we discussed, call us before approving and we will walk you through every line item, the parts we used and the labour, so there are no surprises when you pick up ${'{plate}'}.` } : t));

export const renderTemplate = (body: string) => VARIABLES.reduce((s, v) => s.split(v.label).join(v.sample), body);
/** GSM-7 text fits 160 characters in one SMS (153 each when joined); anything outside it (emoji, curly quotes) switches to 70 / 67. */
const GSM = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/;
export function smsCount(text: string): { chars: number; segments: number; unicode: boolean; perSegment: number } {
  const unicode = !GSM.test(text);
  const chars = [...text].length;
  const single = unicode ? 70 : 160; const multi = unicode ? 67 : 153;
  const segments = chars === 0 ? 0 : chars <= single ? 1 : Math.ceil(chars / multi);
  return { chars, segments, unicode, perSegment: segments > 1 ? multi : single };
}
export const unknownVariables = (body: string) => [...body.matchAll(/\{([a-z]+)\}/g)].map((m) => m[1]!).filter((v) => !VARIABLES.some((x) => x.id === v));
