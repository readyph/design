import type { SettingsChannel, SettingsNotification, SettingsValue } from '../components/SettingsModal';

/* RDY-409. Sample data from inventory-home FINAL: data.js 20-26 (ROLES), 52-61 and 207-215 (tenants, people), settings.js 22-41 (ITEMS, CHANNELS), 84-92 (ledaScope),
   PHONE/EMAIL (settings.js 27-28). Invented in the prototype; replace with real data. */
export type MySettingsTenant = 'a' | 'b';
export type MySettingsRole = 'manager' | 'clerk' | 'owner';

interface Person { name: string; initials: string; title: string; roleLabel: string; email: string; phone: string }

export const TENANTS: Record<MySettingsTenant, { platform: string; initials: string; company: string; people: Record<MySettingsRole, Person> }> = {
  a: {
    platform: 'Parts Stockroom',
    initials: 'PS',
    company: 'Dela Cruz Auto Works',
    people: {
      manager: { name: 'Berto Villanueva', initials: 'BV', title: 'Stockroom manager', roleLabel: 'Manager', email: 'berto@delacruzauto.ph', phone: '0917 555 0142' },
      clerk: { name: 'Joy Mendoza', initials: 'JM', title: 'Stock clerk', roleLabel: 'Stock clerk', email: 'joy@delacruzauto.ph', phone: '0918 555 0177' },
      owner: { name: 'Ramon Dela Cruz', initials: 'RD', title: 'Owner', roleLabel: 'Owner', email: 'mon@delacruzauto.ph', phone: '0917 555 0101' },
    },
  },
  b: {
    platform: 'Café Inventory',
    initials: 'CI',
    company: 'Brew & Butter',
    people: {
      manager: { name: 'Carlo Reyes', initials: 'CR', title: 'Kitchen manager', roleLabel: 'Manager', email: 'carlo@brewandbutter.ph', phone: '0919 555 0123' },
      clerk: { name: 'Mika Torres', initials: 'MT', title: 'Stock clerk', roleLabel: 'Stock clerk', email: 'mika@brewandbutter.ph', phone: '0918 555 0164' },
      owner: { name: 'Bea Santos', initials: 'BS', title: 'Owner', roleLabel: 'Owner', email: 'bea@brewandbutter.ph', phone: '0917 555 0188' },
    },
  },
};

/* ITEMS (settings.js 33-41) in group order; `show` is the permission gate (ROLES, data.js 22-24). */
const ITEMS: (SettingsNotification & { roles: MySettingsRole[] })[] = [
  { id: 'low', group: 'Stock and deliveries', label: 'Stock is low or out', help: 'A part reaches its reorder level or runs out.', roles: ['owner', 'manager', 'clerk'] },
  { id: 'due', group: 'Stock and deliveries', label: 'A delivery is due', help: 'An order is due today, or it is late.', roles: ['owner', 'manager', 'clerk'] },
  { id: 'approve', group: 'Transfers', label: 'A transfer needs approval', help: 'Someone asked to move stock to another place.', roles: ['owner', 'manager'] },
  { id: 'check', group: 'Transfers', label: 'A transfer is on its way to check in', help: 'Stock sent from another place is coming here. Count it when it arrives.', roles: ['owner', 'manager', 'clerk'] },
  { id: 'setup', group: 'Requests', label: 'New product to set up', help: 'A stocker scanned a barcode we do not have and is waiting for someone to set it up.', roles: ['owner', 'manager'] },
];

export const notificationsFor = (role: MySettingsRole): SettingsNotification[] =>
  ITEMS.filter((i) => i.roles.includes(role)).map(({ roles: _roles, ...n }) => n);

export const channelsFor = (email: string): SettingsChannel[] => [
  { id: 'app', label: 'In the app', help: 'A note on your screen when you open the app.' },
  { id: 'sms', label: 'Text message' },
  { id: 'email', label: 'Email', help: `Goes to ${email}. Change the address in the Portal.` },
];

export const valueFor = (role: MySettingsRole, phone: string): SettingsValue => ({
  phone,
  notify: Object.fromEntries(notificationsFor(role).map((n) => [n.id, true])),
  channels: { app: true, sms: false, email: false },
  leda: true,
});

/* ledaScope() (settings.js 84-92), written out per role. */
export const ledaScopeFor = (role: MySettingsRole): string[] =>
  role === 'clerk'
    ? [
        'Look up parts, stock levels and where things are.',
        'Read what moved and when.',
        'Draft order lists. Your manager marks them sent.',
        "Leda cannot change a count, approve a transfer or show costs for you. That is your manager's.",
      ]
    : [
        'Look up parts, stock levels and where things are.',
        'Read what moved and when.',
        'Draft order lists and orders. You confirm them; Leda never sends one.',
        'Prepare a stock count change for you to confirm.',
      ];
