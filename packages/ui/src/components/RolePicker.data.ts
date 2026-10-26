import type { RoleOption, RolePickerPlatform, RolePickerValue } from './RolePicker';

export const roleOptions: Record<string, RoleOption[]> = {
  'Repair shop': [
    { id: 'manager', name: 'Manager', about: 'Runs the shop: jobs, prices, people and settings.' },
    { id: 'advisor', name: 'Service advisor', about: 'Opens jobs, talks to customers and sends estimates.' },
    { id: 'mechanic', name: 'Mechanic', about: 'Sees and updates the jobs assigned to them.' },
    { id: 'viewer', name: 'Viewer', about: 'Can look, cannot change anything.' },
  ],
  Inventory: [
    { id: 'manager', name: 'Manager', about: 'Runs the stockroom: products, orders, people and settings.' },
    { id: 'clerk', name: 'Stock clerk', about: 'Receives, counts and moves stock.' },
    { id: 'viewer', name: 'Viewer', about: 'Can look, cannot change anything.' },
  ],
  other: [
    { id: 'manager', name: 'Manager', about: 'Runs this platform, including its people and settings.' },
    { id: 'staff', name: 'Staff', about: 'Does the daily work.' },
    { id: 'viewer', name: 'Viewer', about: 'Can look, cannot change anything.' },
  ],
};

export const platforms: RolePickerPlatform[] = [
  { id: 'aw', name: 'Quezon City Auto Works', kind: 'Repair shop', index: 1 },
  { id: 'sr', name: 'Cebu Parts Stockroom', kind: 'Inventory', index: 2 },
  { id: 'cf', name: 'Cubao Cafe', kind: 'Point of sale', index: 3 },
];

export const lockedPlatforms: RolePickerPlatform[] = platforms.map((p, i) => (i === 2 ? { ...p, locked: true, reason: 'Only an admin or the Cubao Cafe manager can add people here.' } : p));

export const saved: RolePickerValue = { access: 'member', roles: { aw: 'mechanic', sr: 'clerk', cf: null } };

export const long = 'Metro Manila and Southern Luzon Regional Distribution Centre for Automotive Parts and Accessories';
export const unbreakable = 'SUPERCALIFRAGILISTICEXPIALIDOCIOUS_PLATFORM_NAME_WITHOUT_ANY_BREAKS_0123456789';
export const eight: RolePickerPlatform[] = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, name: i === 1 ? long : i === 2 ? unbreakable : `Branch ${i + 1} ${['Auto Works', 'Stockroom', 'Cafe'][i % 3]}`, kind: ['Repair shop', 'Inventory', 'Point of sale'][i % 3], index: i + 1 }));
export const manyRoles: Record<string, RoleOption[]> = {
  ...roleOptions,
  'Repair shop': Array.from({ length: 14 }, (_, i) => ({ id: `r${i}`, name: i === 3 ? long : `Role number ${i + 1}`, about: i === 3 ? unbreakable : 'A role with a line.' })),
};
