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
 * with live status and alerts. Feeds the dashboard's status grid. See
 * 03-Portal.md §6. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Portal/Platforms',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

const statusLabel: Record<Status, string> = { active: 'Active', degraded: 'Degraded', offline: 'Offline' };

interface Connected {
  name: string;
  icon: PhosphorIcon;
  status: Status;
  version: string;
  sync: string;
  alerts: number;
  metric: string;
  /** Prototype story to open; real-app route lives in nav.ts. */
  storyId?: string;
}

const connected: Connected[] = [
  { name: 'Inventory', icon: Package, status: 'active', version: 'v2.4', sync: '2m ago', alerts: 2, metric: '128 products · 7 low', storyId: routes.inventoryHome },
  { name: 'Mobile app', icon: DeviceMobile, status: 'active', version: 'v1.9', sync: 'just now', alerts: 0, metric: '342 users online' },
  { name: 'Storefront', icon: Storefront, status: 'degraded', version: 'v1.2', sync: '12m ago', alerts: 1, metric: 'Sync retrying…' },
  { name: 'POS', icon: Bank, status: 'offline', version: 'v1.0', sync: '3h ago', alerts: 1, metric: 'Disconnected' },
];

const available: { name: string; icon: PhosphorIcon; desc: string }[] = [
  { name: 'Accounting', icon: Calculator, desc: 'Sync sales and expenses to your books.' },
  { name: 'Delivery', icon: Truck, desc: 'Assign riders and track drop-offs.' },
  { name: 'Loyalty', icon: Gift, desc: 'Points and rewards for repeat customers.' },
];

export const Platforms: Story = {
  name: 'Connected platforms',
  render: () => (
    <PortalShell active="platforms" title="Connected platforms">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
          title="Connected platforms"
          description="4 connected · 1 needs attention"
          actions={<Button leftIcon={Plus}>Connect platform</Button>}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {connected.map((p) => (
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
                  <p className="mt-1 text-sm text-ink">{p.metric}</p>
                  <p className="text-xs text-ink-subtle">{p.version} · synced {p.sync}</p>
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
          ))}
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Available to connect</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {available.map((a) => (
              <Card key={a.name}>
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-muted text-ink-subtle">
                  <Icon icon={a.icon} size="md" />
                </span>
                <p className="mt-3 text-sm font-semibold text-ink">{a.name}</p>
                <p className="mt-1 text-sm text-ink-muted">{a.desc}</p>
                <Button className="mt-3" size="sm" variant="secondary" leftIcon={Plus} fullWidth>Connect</Button>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PortalShell>
  ),
};
