import type { SettingsChannel, SettingsNotification, SettingsValue } from './SettingsModal';

/* Sample data from the prototype (inventory-home FINAL/settings.js ITEMS 33-41, CHANNELS, ledaScope; data.js people). Replace with real data. */
export const sampleNotifications: SettingsNotification[] = [
  { id: 'low', group: 'Stock and deliveries', label: 'Stock is low or out', help: 'A part reaches its reorder level or runs out.' },
  { id: 'due', group: 'Stock and deliveries', label: 'A delivery is due', help: 'An order is due today, or it is late.' },
  { id: 'approve', group: 'Transfers', label: 'A transfer needs approval', help: 'Someone asked to move stock to another place.' },
  { id: 'check', group: 'Transfers', label: 'A transfer is on its way to check in', help: 'Stock sent from another place is coming here. Count it when it arrives.' },
  { id: 'setup', group: 'Requests', label: 'New product to set up', help: 'A stocker scanned a barcode we do not have and is waiting for someone to set it up.' },
];
export const sampleChannels: SettingsChannel[] = [
  { id: 'app', label: 'In the app', help: 'A note on your screen when you open the app.' },
  { id: 'sms', label: 'Text message' },
  { id: 'email', label: 'Email', help: 'Goes to berto@delacruzauto.ph. Change the address in the Portal.' },
];
export const sampleValue: SettingsValue = {
  phone: '0917 555 0142',
  notify: { low: true, due: true, approve: true, check: true, setup: true },
  channels: { app: true, sms: false, email: false },
  leda: true,
};
export const sampleLedaScope = [
  'Look up parts, stock levels and where things are.',
  'Read what moved and when.',
  'Draft order lists and orders. You confirm them; Leda never sends one.',
  'Prepare a stock count change for you to confirm.',
  "Leda cannot approve a transfer for you. That is your manager's.",
];
