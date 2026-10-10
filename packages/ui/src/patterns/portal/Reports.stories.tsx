import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ChartBar, Package, UsersThree, Buildings, Plus, WaveTriangle, Export, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Icon } from '../../components/Icon';
import { cn } from '../../utils/cn';
import { PortalShell } from './shell';

/**
 * Reports — saved reports on the left, a viewer on the right. Ask Leda to
 * generate one ("weekly sales by branch") and save it here. See 03-Portal.md §7.
 * Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Portal/Reports',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

interface Report {
  id: string;
  name: string;
  icon: PhosphorIcon;
  updated: string;
}

const reports: Report[] = [
  { id: 'sales', name: 'Weekly sales', icon: ChartBar, updated: '2h ago' },
  { id: 'lowstock', name: 'Low stock', icon: Package, updated: '1d ago' },
  { id: 'customers', name: 'Customer growth', icon: UsersThree, updated: '3d ago' },
  { id: 'branch', name: 'Revenue by branch', icon: Buildings, updated: '1w ago' },
];

const bars = [
  { d: 'Mon', v: 12 },
  { d: 'Tue', v: 15 },
  { d: 'Wed', v: 13 },
  { d: 'Thu', v: 18 },
  { d: 'Fri', v: 22 },
  { d: 'Sat', v: 28 },
  { d: 'Sun', v: 24 },
];

const branchRows = [
  { branch: 'Makati', orders: 142, revenue: '₱186k', share: '38%' },
  { branch: 'Quezon City', orders: 118, revenue: '₱151k', share: '31%' },
  { branch: 'Pasig', orders: 97, revenue: '₱122k', share: '25%' },
  { branch: 'Online', orders: 31, revenue: '₱28k', share: '6%' },
];

function BarChart() {
  const max = Math.max(...bars.map((b) => b.v));
  return (
    <div className="rounded-xl bg-surface p-5">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink-subtle">Daily sales this week (₱k)</p>
      <div className="flex h-40 items-stretch gap-3">
        {bars.map((b) => (
          <div key={b.d} className="flex h-full flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div className="w-full rounded-t-md bg-primary-500/85" style={{ height: `${(b.v / max) * 100}%` }} title={`${b.d}: ₱${b.v}k`} />
            </div>
            <span className="text-xs text-ink-subtle">{b.d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Reports: Story = {
  name: 'Reports',
  render: function ReportsPage() {
    const [selected, setSelected] = useState('sales');
    const report = reports.find((r) => r.id === selected)!;
    return (
      <PortalShell active="reports" title="Reports" scroll={false}>
        <div className="flex min-h-0 flex-1">
          {/* saved reports */}
          <div className="hidden w-64 shrink-0 flex-col lg:flex">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-semibold text-ink">Saved reports</p>
              <Button size="sm" variant="subtle" leftIcon={Plus}>New</Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm',
                    r.id === selected ? 'bg-primary-50 text-primary-700' : 'text-ink-muted hover:bg-surface-muted hover:text-ink',
                  )}
                >
                  <Icon icon={r.icon} size="md" weight={r.id === selected ? 'fill' : 'regular'} className={r.id === selected ? 'text-primary-600' : 'text-ink-subtle'} />
                  <span className="flex-1 truncate font-medium">{r.name}</span>
                </button>
              ))}
            </div>
            <div className="p-3">
              <Button fullWidth variant="secondary" size="sm" leftIcon={WaveTriangle}>Generate with Leda</Button>
            </div>
          </div>

          {/* viewer */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-ink">{report.name}</h1>
                  <p className="mt-0.5 text-sm text-ink-subtle">Updated {report.updated} · this week</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" leftIcon={Export}>Export</Button>
                  <Button size="sm" leftIcon={WaveTriangle}>Ask Leda</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { label: 'Revenue', value: '₱487k' },
                  { label: 'Orders', value: '388' },
                  { label: 'Avg. order', value: '₱1,255' },
                ].map((k) => (
                  <div key={k.label} className="rounded-xl bg-surface p-4">
                    <p className="text-xs text-ink-subtle">{k.label}</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{k.value}</p>
                  </div>
                ))}
              </div>

              <BarChart />

              <div className="overflow-hidden rounded-xl bg-surface">
                <div className="flex items-center justify-between bg-surface-subtle px-4 py-2.5">
                  <p className="text-sm font-medium text-ink">Revenue by branch</p>
                  <Badge tone="neutral" size="sm">4 branches</Badge>
                </div>
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-ink-subtle">
                      <th className="px-4 py-2 font-medium">Branch</th>
                      <th className="px-4 py-2 text-right font-medium">Orders</th>
                      <th className="px-4 py-2 text-right font-medium">Revenue</th>
                      <th className="px-4 py-2 text-right font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {branchRows.map((b) => (
                      <tr key={b.branch}>
                        <td className="px-4 py-2.5 font-medium text-ink">{b.branch}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink">{b.orders}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink">{b.revenue}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink-muted">{b.share}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            </div>
          </div>
        </div>
      </PortalShell>
    );
  },
};
