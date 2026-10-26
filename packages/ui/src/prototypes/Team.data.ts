import type { CompanyAccess, RoleOption } from '../components/RolePicker';
import { many as manySet, few as fewSet, live as liveSet, type HomePlatform, type HomeSet, type HomeSetKey } from './Home.data';

/**
 * Sample data for the Team prototype (RDY-258): the Dela Cruz set from the handover (9 people, 2 invites, Starter plan).
 * Prototype only, not exported from the package. Replace before real use. Platforms come from the Home sample so the
 * map, ids and names match Home.
 */
export type TeamSetKey = HomeSetKey;
export type TeamState = 'live' | 'loading' | 'error' | 'solo' | 'noaccess' | 'manager' | 'over';

export interface Person {
  id: string;
  name: string;
  short: string;
  initials: string;
  title: string;
  email: string;
  joined: string;
  last: string;
  by: string | null;
  creator?: boolean;
}
export interface MemberState {
  company: CompanyAccess;
  status: 'ACTIVE' | 'SUSPENDED';
  /** Minutes since the sample's clock when a reset link was sent (for the 5 minute rule). */
  resetAt: number | null;
}
export interface Invite {
  id: string;
  name: string;
  email: string;
  company: CompanyAccess;
  roles: Record<string, string>;
  by: string;
  created: string;
  sent: string | null;
  expires: string | null;
  status: 'PENDING' | 'EXPIRED' | 'REVOKED';
  sends: number[];
}
/** The working copy: everything an edit can change, so one snapshot undoes one change. */
export interface Db {
  members: Record<string, MemberState>;
  /** platform id -> person id -> role id. Not listed = not assigned. */
  roles: Record<string, Record<string, string>>;
  invites: Invite[];
  seq: number;
}

export const people: Person[] = [
  { id: 'mon', name: 'Ramon Dela Cruz', short: 'Mon', initials: 'RD', title: 'Owner', email: 'mon@delacruzauto.ph', joined: '3 Aug 2026', last: 'Now', by: null, creator: true },
  { id: 'liza', name: 'Liza Santos', short: 'Liza', initials: 'LS', title: 'Accounting', email: 'liza.santos@delacruzauto.ph', joined: '3 Aug 2026', last: 'Yesterday, 6:10 PM', by: 'mon' },
  { id: 'jun', name: 'Jun Reyes', short: 'Jun', initials: 'JR', title: 'Shop manager', email: 'jun.reyes@delacruzauto.ph', joined: '4 Aug 2026', last: 'Today, 8:02 AM', by: 'mon' },
  { id: 'grace', name: 'Grace Lumbao', short: 'Grace', initials: 'GL', title: 'Service advisor', email: 'grace.lumbao@delacruzauto.ph', joined: '10 Aug 2026', last: 'Today, 7:58 AM', by: 'jun' },
  { id: 'arnel', name: 'Arnel Cruz', short: 'Arnel', initials: 'AC', title: 'Stock clerk', email: 'arnel.cruz@delacruzauto.ph', joined: '5 Aug 2026', last: 'Today, 7:41 AM', by: 'mon' },
  { id: 'ben', name: 'Benjie Aquino', short: 'Benjie', initials: 'BA', title: 'Mechanic', email: 'benjie.aquino@gmail.com', joined: '12 Aug 2026', last: 'Today, 8:30 AM', by: 'jun' },
  { id: 'tonyo', name: 'Antonio Garcia', short: 'Tonyo', initials: 'AG', title: 'Mechanic', email: 'tonyo.garcia@gmail.com', joined: '12 Aug 2026', last: 'Today, 9:05 AM', by: 'jun' },
  { id: 'dennis', name: 'Dennis Ocampo', short: 'Dennis', initials: 'DO', title: 'Mechanic', email: 'dennis.ocampo88@gmail.com', joined: '19 Aug 2026', last: 'Today, 8:47 AM', by: 'jun' },
  { id: 'mark', name: 'Mark Villareal', short: 'Mark', initials: 'MV', title: 'Mechanic', email: 'markvillareal@yahoo.com', joined: '2 Sep 2026', last: 'Today, 8:20 AM', by: 'jun' },
];

export const activity: Record<string, [string, string][]> = {
  mon: [['9:12 AM', 'Opened the Portal'], ['Wed 5:30 PM', 'Approved PO-0214 for the stockroom'], ['Mon 9:00 AM', 'Changed the stockroom’s hours']],
  liza: [['Wed 6:10 PM', 'Exported October sales'], ['Wed 2:40 PM', 'Checked the Petron delivery, PO-0214'], ['Tue 4:15 PM', 'Signed in']],
  jun: [['8:02 AM', 'Assigned JO-0417 and JO-0418'], ['Wed 5:48 PM', 'Added an invite for Rico Lim'], ['Wed 4:20 PM', 'Sent the Hilux clutch quote to Rodel Castro']],
  grace: [['9:10 AM', 'Opened JO-0418, wheel alignment'], ['9:02 AM', 'Wrote quote QT-0092'], ['7:58 AM', 'Signed in']],
  arnel: [['9:05 AM', 'Issued 1 oil filter to JO-0414'], ['7:58 AM', 'Counted spark plugs, 18 to 16'], ['Wed 2:30 PM', 'Received 42 bottles from Petron']],
  ben: [['8:30 AM', 'Started JO-0415, front brakes'], ['Wed 5:30 PM', 'Finished JO-0408, brake fluid flush']],
  tonyo: [['9:05 AM', 'Started JO-0414, PMS 40,000 km'], ['8:40 AM', 'Finished JO-0409, PMS 50,000 km']],
  dennis: [['8:47 AM', 'Marked JO-0412 waiting for parts'], ['Wed 5:05 PM', 'Finished JO-0407, battery and belts']],
  mark: [['8:20 AM', 'Started JO-0413, aircon cleaning'], ['Wed 4:20 PM', 'Asked for approval on the Hilux clutch, JO-0411']],
};

/** Company (Portal) access lines, in the handover's words. */
export const accessCopy: Record<CompanyAccess, { name: string; can: string }> = {
  owner: { name: 'Owner', can: 'Created the company. Everything an admin can do, and the plan stays in their name.' },
  admin: { name: 'Admin', can: 'Runs the Portal: adds platforms, invites people, sets their roles, pays the bill.' },
  member: { name: 'Member', can: 'Uses the platforms they have a role on. Can’t change the Portal.' },
};

/** Roles on one platform, by the platform's kind, from most to least. Kinds not listed use `other`. */
export const roleOptions: Record<string, RoleOption[]> = {
  'Repair shop': [
    { id: 'manager', name: 'Manager', about: 'Runs the shop: every job, prices, settings and who works here.' },
    { id: 'advisor', name: 'Service advisor', about: 'Takes customers in, writes estimates and job orders.' },
    { id: 'mechanic', name: 'Mechanic', about: 'Sees the jobs given to them and updates the work.' },
    { id: 'viewer', name: 'Viewer', about: 'Sees everything here, changes nothing.' },
  ],
  Inventory: [
    { id: 'manager', name: 'Manager', about: 'Runs the stockroom: orders, suppliers, settings and who works here.' },
    { id: 'clerk', name: 'Stock clerk', about: 'Receives, issues and counts stock.' },
    { id: 'viewer', name: 'Viewer', about: 'Sees stock and orders, changes nothing.' },
  ],
  other: [
    { id: 'manager', name: 'Manager', about: 'Runs this platform: its settings and who works here.' },
    { id: 'staff', name: 'Staff', about: 'Creates and updates records.' },
    { id: 'viewer', name: 'Viewer', about: 'Sees everything here, changes nothing.' },
  ],
};
export const rolesOfKind = (kind: string): RoleOption[] => roleOptions[kind] ?? roleOptions.other!;
/** The everyday role of a kind: the one between Manager and Viewer. */
export const workRole = (kind: string): string => {
  const r = rolesOfKind(kind);
  return (r[1] ?? r[0]!).id;
};

/** Seats per plan (shown, not enforced); null = no limit. */
export const seats: Record<string, number | null> = { Free: 3, Starter: 15, Pro: null };

export const platformsOf = (set: TeamSetKey): HomePlatform[] => (set === 'many' ? manySet : set === 'few' ? fewSet : liveSet).platforms;
export const homeSet = (set: TeamSetKey): HomeSet => (set === 'many' ? manySet : set === 'few' ? fewSet : liveSet);

const duoAssign: Record<string, Record<string, string>> = {
  autoworks: { mon: 'manager', liza: 'viewer', jun: 'manager', grace: 'advisor', ben: 'mechanic', tonyo: 'mechanic', dennis: 'mechanic', mark: 'mechanic' },
  stockroom: { mon: 'manager', liza: 'manager', jun: 'viewer', arnel: 'clerk', ben: 'clerk' },
};

export function initialDb(set: TeamSetKey, state: TeamState): Db {
  const members: Record<string, MemberState> = {};
  const keep = state === 'solo' ? ['mon'] : people.map((p) => p.id);
  for (const p of people) if (keep.includes(p.id)) members[p.id] = { company: p.id === 'mon' ? 'owner' : p.id === 'liza' ? 'admin' : 'member', status: 'ACTIVE', resetAt: null };
  const roles: Record<string, Record<string, string>> = {};
  for (const pl of platformsOf(set)) {
    const own = duoAssign[pl.id];
    const r: Record<string, string> = own ? { ...own } : { mon: 'manager', liza: 'viewer' };
    for (const id of Object.keys(r)) if (!members[id]) delete r[id];
    roles[pl.id] = r;
  }
  const invites: Invite[] =
    state === 'solo'
      ? []
      : [
          { id: 'inv-rico', name: 'Rico Lim', email: 'rico.lim.mech@gmail.com', company: 'member', roles: { autoworks: 'mechanic' }, by: 'jun', created: 'Wed 21 Oct, 5:48 PM', sent: null, expires: null, status: 'PENDING', sends: [] },
          { id: 'inv-carlo', name: 'Carlo Mendoza', email: 'carlo.mendoza.qc@gmail.com', company: 'member', roles: { stockroom: 'clerk' }, by: 'mon', created: 'Tue 13 Oct, 10:20 AM', sent: 'Tue 13 Oct, 10:21 AM', expires: 'Tue 20 Oct', status: 'EXPIRED', sends: [] },
        ];
  return { members, roles, invites, seq: 0 };
}

/** What Leda drafts for "Invite ... as a mechanic at Auto Works". */
export const ledaInvite = { name: 'Noel Cruz', email: 'noel.cruz.mech@gmail.com', company: 'member' as CompanyAccess, roles: { autoworks: 'mechanic' } as Record<string, string> };

export const SAMPLE_NOW = 9 * 60 + 12;
export const SENT_UNTIL = 'Thu 29 Oct';
export const LAST_GOOD = '9:10 AM';
