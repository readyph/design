/** PROTOTYPE (RDY-120) - shared sample data. Content mirrors the audit in hq/handoffs/RDY-120.md. */
export type AppKey = 'portal' | 'inventory' | 'repair';
export type PlatformStatusKey = 'active' | 'degraded' | 'offline';

export interface DemoPlatform {
  id: string;
  label: string;
  kind: 'inventory' | 'repair_shop' | 'storefront';
  status: PlatformStatusKey;
  /** App URL the API must expose per platform instance (new: `app_url`). */
  appUrl: string;
  /** Instance still has no data source linked. */
  setupNeeded?: boolean;
  metric: string;
}

export const COMPANY = 'Sunrise Auto Parts';

export const PLATFORMS: DemoPlatform[] = [
  { id: 'inv', label: 'Main inventory', kind: 'inventory', status: 'active', appUrl: 'inventory.readyph.app', metric: '214 products - 6 low stock' },
  { id: 'rs-dvo', label: 'Davao branch', kind: 'repair_shop', status: 'active', appUrl: 'inventory.readyph.app/repair-shop/davao', metric: '9 jobs open - 2 need attention' },
  { id: 'rs-cdo', label: 'Cagayan branch', kind: 'repair_shop', status: 'offline', appUrl: 'inventory.readyph.app/repair-shop/cagayan', metric: '', setupNeeded: true },
];

export type FindingStatus = 'dead' | 'placeholder' | 'fake-data' | 'missing';
export interface Finding {
  app: 'Portal' | 'Inventory' | 'Repair shop' | 'All apps';
  where: string;
  today: string;
  kind: FindingStatus;
  resolution: string;
  story: string;
}

/** The audit, one row per dead or placeholder item. Story names refer to this prototype folder. */
export const FINDINGS: Finding[] = [
  { app: 'Portal', where: 'Platforms > Open', today: 'No handler; API has no app URL', kind: 'dead', resolution: 'Open the platform app (signed-in handoff). Needs app_url on the platform response.', story: 'Portal/Platform launch' },
  { app: 'Portal', where: 'Platforms > Finish setup', today: 'No handler', kind: 'dead', resolution: 'Opens the Connect data panel for that instance.', story: 'Portal/Platform launch' },
  { app: 'Portal', where: 'Platforms > menu > View activity', today: 'No handler', kind: 'dead', resolution: 'Remove until an activity feed exists (no placeholder entries).', story: 'Portal/Platform launch' },
  { app: 'Portal', where: 'Rail platform tiles', today: 'Every tile goes to /platforms', kind: 'dead', resolution: 'Each tile opens its own platform app.', story: 'Inventory/Connected settings' },
  { app: 'Portal', where: 'Team > Invite member, Resend', today: 'No handler (POST /invitations exists)', kind: 'dead', resolution: 'Invite modal; Resend re-sends and shows a toast.', story: 'Portal/Team invite' },
  { app: 'Portal', where: 'Reports > Export', today: 'No handler', kind: 'dead', resolution: 'Export the open report as CSV, or remove until supported.', story: 'Portal/Platform connection audit' },
  { app: 'Portal', where: 'Top bar: search, bell; mobile menu button', today: 'No handler; below lg there is no navigation', kind: 'dead', resolution: 'Mobile menu opens the nav drawer. Search and notifications hidden until backed.', story: 'Inventory/Connected settings' },
  { app: 'Portal', where: 'Account menu > Account', today: 'No handler', kind: 'dead', resolution: 'New Settings > Account tab (name, password, sign out everywhere).', story: 'Portal/Account and billing' },
  { app: 'Portal', where: 'Settings > Company: email, phone, address, website', today: 'Hard-coded sunrise.ph values, never saved', kind: 'fake-data', resolution: 'Persist on the tenant profile (new fields) with real empty/error states.', story: 'Portal/Account and billing' },
  { app: 'Portal', where: 'Settings > Billing', today: '"Coming soon" card; Ask Leda no-op; plan fallback "Growth" is not a tier', kind: 'placeholder', resolution: 'Real Plan and usage: tier (Free/Starter/Pro), Leda usage vs limit, Request plan change.', story: 'Portal/Account and billing' },
  { app: 'Portal', where: 'Dashboard activity feed and Today KPIs', today: 'Story sample content; rows are buttons that do nothing', kind: 'fake-data', resolution: 'Feed from real platform events; each row opens its record in the owning app. Hide feed until the endpoint exists.', story: 'Portal/Platform connection audit' },
  { app: 'Portal', where: 'Sign in/up: Google, Terms, Privacy links', today: '"Coming soon" toast; href="#"', kind: 'placeholder', resolution: 'Remove Google until built; Terms and Privacy link to real pages.', story: 'Portal/Platform connection audit' },
  { app: 'Inventory', where: 'Account menu > Account, Billing', today: 'No handler', kind: 'dead', resolution: 'Deep-link to Portal Settings > Account / Billing.', story: 'Inventory/Connected settings' },
  { app: 'Inventory', where: 'Rail: Mobile app, Storefront, "+"', today: 'Hard-coded decoration with fake status', kind: 'fake-data', resolution: 'Rail from real platforms; "+" opens Portal > Platforms > Add.', story: 'Inventory/Connected settings' },
  { app: 'Inventory', where: 'Sidebar header "Inventory" switcher, search icon, bell, mobile menu', today: 'No handler', kind: 'dead', resolution: 'Switcher lists real platforms; mobile menu opens nav; search and bell hidden until backed.', story: 'Inventory/Connected settings' },
  { app: 'Inventory', where: 'Settings > Units', today: 'Static chips, "informational"', kind: 'placeholder', resolution: 'Cut the tab. Unit stays a per-product select.', story: 'Inventory/Connected settings' },
  { app: 'Inventory', where: 'Settings > Reorder defaults', today: 'Notice says "planned for a later release"', kind: 'placeholder', resolution: 'Cut the tab until a tenant default exists.', story: 'Inventory/Connected settings' },
  { app: 'Inventory', where: 'Settings > Platform', today: 'Hard-coded "Connected to Portal"', kind: 'fake-data', resolution: 'Show real instance name, status, shared-with list and a Manage in Portal link.', story: 'Inventory/Connected settings' },
  { app: 'Inventory', where: 'Login: Google, Sign up', today: '"Coming soon" toast', kind: 'placeholder', resolution: 'Sign up links to the Portal sign-up; Google removed.', story: 'Portal/Platform connection audit' },
  { app: 'Inventory', where: 'Anywhere', today: 'No entry to the Repair shop branches', kind: 'missing', resolution: 'Repair shop branches appear in the rail and switcher.', story: 'Inventory/Connected settings' },
  { app: 'Repair shop', where: 'Today > New quotation', today: 'Routes to /jobs/new, which is read as a job id and errors', kind: 'dead', resolution: 'Opens the quotation intake (prototype RDY-18); Jobs list gets the same CTA.', story: 'Repair shop/Settings and parts' },
  { app: 'Repair shop', where: 'Catalogue > Parts "No inventory linked"', today: 'Empty state with no action', kind: 'dead', resolution: 'Action: Connect inventory (Portal > Platforms > Connect data).', story: 'Repair shop/Settings and parts' },
  { app: 'Repair shop', where: 'Settings / Account / Billing', today: 'Do not exist; account menu has Sign out only', kind: 'missing', resolution: 'Branch Settings page; Account and Billing link to the Portal.', story: 'Repair shop/Settings and parts' },
  { app: 'All apps', where: 'Session', today: 'Tokens in per-origin localStorage, so each app asks to sign in again', kind: 'missing', resolution: 'Signed-in handoff on every cross-app link, with expired and unreachable states.', story: 'Portal/App handoff' },
];
