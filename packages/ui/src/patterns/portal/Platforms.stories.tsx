import type { Meta, StoryObj } from '@storybook/react';
import { Package, DeviceMobile, Storefront, Bank, Plus, DotsThree, ArrowClockwise, Gear, Calculator, Truck, Gift, ArrowSquareOut, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Badge } from '../../components/Badge';
import { Menu } from '../../components/Menu';
import { Icon } from '../../components/Icon';
import { PortalShell, StatusDot, type Status } from './shell';
import { goToStory, routes } from './../nav';

/**
 * Connected platforms — monitor and manage every platform the company runs,
 * with live status and alerts. A static twin of the production
 * `platforms/portal/src/modules/platforms/PlatformsPage.tsx`: same structure,
 * same card anatomy, data shaped like the real API responses
 * (`PlatformResponse` + `CatalogPlatformResponse`, 03 §6).
 *
 * Reality today: **Inventory is the only connected platform**; everything else
 * in the catalog sits under "Add a platform" (Loyalty is still coming soon).
 * Mirrors the seed in `api/scripts/seed_dev.py` and the catalog in migration
 * `b7e40f3a9c21`. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Portal/Platforms',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const statusLabel: Record<Status, string> = { active: 'Active', degraded: 'Degraded', offline: 'Offline' };

/** Shaped like `PlatformResponse` — one platform this tenant has connected. */
interface Connected {
  name: string;
  icon: PhosphorIcon;
  status: Status;
  /** Raw version as stored (no "v"); null when the platform reports none. */
  version: string | null;
  /** Headline metrics (the API's `metrics` dict), summarised on the card. */
  metrics: Record<string, number | string>;
  /** Relative "last synced" label (derived from `last_sync_at` in the app). */
  sync: string;
  alerts: number;
  /** Prototype story to open; real-app route lives in nav.ts. */
  storyId?: string;
}

/** Shaped like `CatalogPlatformResponse` — a marketplace entry to connect. */
interface CatalogEntry {
  name: string;
  icon: PhosphorIcon;
  description: string;
  comingSoon?: boolean;
}

// Only Inventory is connected today (seed_dev.py). Mobile/Storefront/POS etc.
// live in the catalog below until the owner connects them.
const connected: Connected[] = [
  {
    name: 'Inventory',
    icon: Package,
    status: 'active',
    version: '2.4.1',
    metrics: { products: 128, low_stock: 7 },
    sync: '2m ago',
    alerts: 2,
    storyId: routes.inventoryHome,
  },
];

// The marketplace catalog minus what's connected. Order + copy match the
// seeded catalog (migration b7e40f3a9c21); Loyalty is COMING_SOON.
const available: CatalogEntry[] = [
  { name: 'Mobile app', icon: DeviceMobile, description: 'Your branded customer app for orders and messages.' },
  { name: 'Storefront', icon: Storefront, description: 'Your online store for web orders.' },
  { name: 'POS', icon: Bank, description: 'In-store point of sale and terminals.' },
  { name: 'Accounting', icon: Calculator, description: 'Sync sales and expenses to your books.' },
  { name: 'Delivery', icon: Truck, description: 'Assign riders and track drop-offs.' },
  { name: 'Loyalty', icon: Gift, description: 'Points and rewards for repeat customers.', comingSoon: true },
];

/** `${value} ${humanized key}` for the first few metrics — mirrors production. */
function metricSummary(metrics: Record<string, number | string>, status: Status): string {
  const parts = Object.entries(metrics)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, 3)
    .map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`);
  if (parts.length > 0) return parts.join(' · ');
  return status === 'offline' ? 'Disconnected' : 'No metrics reported';
}

const summary = `${connected.length} connected · ${connected.filter((p) => p.status === 'offline').length} needs attention`;

export const Platforms: Story = {
  name: 'Connected platforms',
  render: () => (
    <PortalShell active="platforms" title="Connected platforms">
      <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
        {/* Connected */}
        <section className="space-y-4">
          <PageHeader
            title="Connected platforms"
            description={summary}
            actions={<Button leftIcon={Plus}>Add a platform</Button>}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {connected.map((p) => {
              const version = p.version ? `v${p.version.replace(/^v/i, '')}` : 'No version';
              return (
                <Card key={p.name}>
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink">
                      <Icon icon={p.icon} size="md" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink">{p.name}</span>
                        <span className="flex items-center gap-1 text-xs text-ink-muted">
                          <StatusDot status={p.status} /> {statusLabel[p.status]}
                        </span>
                        {p.alerts > 0 && (
                          <span className="ml-auto">
                            <Badge tone="warning" size="sm">{p.alerts} alert{p.alerts > 1 ? 's' : ''}</Badge>
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-ink">{metricSummary(p.metrics, p.status)}</p>
                      <p className="text-xs text-ink-subtle">{version} · synced {p.sync}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="sm" leftIcon={ArrowSquareOut} disabled={p.status === 'offline'} onClick={() => p.storyId && goToStory(p.storyId)}>Open</Button>
                    {p.status === 'offline' ? (
                      <Button size="sm" variant="secondary" leftIcon={ArrowClockwise}>Reconnect</Button>
                    ) : (
                      <Button size="sm" variant="secondary" leftIcon={Gear}>Configure</Button>
                    )}
                    <Menu
                      trigger={<IconButton icon={DotsThree} label="Platform actions" variant="subtle" size="sm" className="ml-auto" />}
                      items={[
                        { label: 'View activity', icon: ArrowClockwise },
                        { label: 'Settings', icon: Gear },
                        { type: 'separator' },
                        { label: 'Disconnect', danger: true },
                      ]}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Marketplace */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Add a platform</h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              Browse the marketplace and connect a platform to your company. New platforms are set up through a short onboarding and connected to Leda automatically.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {available.map((a) => (
              <Card key={a.name} className="flex h-full flex-col">
                <div className="flex flex-1 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink-subtle">
                    <Icon icon={a.icon} size="md" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{a.name}</p>
                      {a.comingSoon && <Badge tone="neutral" size="sm">Coming soon</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{a.description}</p>
                  </div>
                </div>
                <Button
                  className="mt-4"
                  size="sm"
                  variant={a.comingSoon ? 'secondary' : 'primary'}
                  leftIcon={Plus}
                  fullWidth
                  disabled={a.comingSoon}
                >
                  {a.comingSoon ? 'Coming soon' : 'Connect'}
                </Button>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PortalShell>
  ),
};
