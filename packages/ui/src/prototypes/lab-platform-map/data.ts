/** PROTOTYPE (RDY-225, epic RDY-222) - sample data for the Lab platform map page. */
import { HANDOFF_OPENING, storyHref } from '../platform-connection/data';

export type LabStatus = 'active' | 'degraded' | 'offline';
export type LabKind = 'inventory' | 'sms';

export interface LabLink {
  id: string;
  label: string;
  /** What this platform shares with the linked one (from the platform link capabilities). */
  capabilities: string[];
}

export interface LabPlatform {
  id: string;
  label: string;
  kind: LabKind;
  status: LabStatus;
  alerts: number;
  version: string;
  lastSync: string;
  connectedAt: string;
  links: LabLink[];
  /**
   * Placeholder anchor over the scene (Tailwind position classes). The real page gets the anchor
   * from the Town Scene (RDY-224) projection of each building.
   */
  anchor: string;
}

export const KIND_LABEL: Record<LabKind, string> = { inventory: 'Inventory', sms: 'Service Management' };
export const KIND_SHORT: Record<LabKind, string> = { inventory: 'Inventory', sms: 'SMS' };
export const STATUS_LABEL: Record<LabStatus, string> = { active: 'Active', degraded: 'Degraded', offline: 'Offline' };
export const STATUS_TONE = { active: 'success', degraded: 'warning', offline: 'neutral' } as const;

/**
 * Real routes: `/open/:id` (Open platform), `/platforms?connect=<id>` (Manage connections),
 * `/platforms?add=1` (Add a platform), `/` (back to Portal). In Storybook they point at the matching
 * prototype stories so a click stays inside Storybook.
 */
export const ROUTES = {
  portal: storyHref('portal-platform-launch--default'),
  open: (_id: string) => HANDOFF_OPENING,
  connect: (_id: string) => storyHref('portal-platform-launch--connect-data'),
  add: storyHref('portal-platform-launch--default'),
};

export const LAB_PLATFORMS: LabPlatform[] = [
  {
    id: 'inv', label: 'Main inventory', kind: 'inventory', status: 'active', alerts: 6,
    version: '1.8.2', lastSync: '2 min ago', connectedAt: 'Mar 4, 2026',
    links: [
      { id: 'rs-dvo', label: 'Davao branch', capabilities: ['Stock read', 'Catalog read'] },
      { id: 'rs-ceb', label: 'Cebu branch', capabilities: ['Stock read'] },
    ],
    anchor: 'left-[24%] top-[34%]',
  },
  {
    id: 'rs-dvo', label: 'Davao branch', kind: 'sms', status: 'active', alerts: 2,
    version: '0.9.4', lastSync: '5 min ago', connectedAt: 'Jun 12, 2026',
    links: [{ id: 'inv', label: 'Main inventory', capabilities: ['Stock read', 'Catalog read'] }],
    anchor: 'left-[62%] top-[26%]',
  },
  {
    id: 'rs-ceb', label: 'Cebu branch', kind: 'sms', status: 'degraded', alerts: 1,
    version: '0.9.3', lastSync: '3 h ago', connectedAt: 'Aug 30, 2026',
    links: [{ id: 'inv', label: 'Main inventory', capabilities: ['Stock read'] }],
    anchor: 'left-[42%] top-[66%]',
  },
  {
    id: 'rs-cdo', label: 'Cagayan branch', kind: 'sms', status: 'offline', alerts: 0,
    version: '0.9.4', lastSync: 'Never', connectedAt: 'Oct 20, 2026',
    links: [],
    anchor: 'left-[78%] top-[62%]',
  },
];

/** Count words for the bubble and list ("1 alert", "2 links"). */
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
