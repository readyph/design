import type { Meta, StoryObj } from '@storybook/react';
import { Package, Wrench, House, ArrowsLeftRight, ArrowRight } from '@phosphor-icons/react';
import { Badge, type BadgeTone } from '../../components/Badge';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { Table, type TableColumn } from '../../components/Table';
import { Page } from '../sms/Page';
import { FINDINGS, type Finding } from './data';

/** PROTOTYPE (RDY-120) - the audit of dead links, no-op buttons and placeholders, with the resolution for each. */
const meta: Meta = { title: 'Portal/Platform connection audit', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

const KIND: Record<Finding['kind'], { tone: BadgeTone; label: string }> = {
  dead: { tone: 'error', label: 'Dead CTA' },
  placeholder: { tone: 'warning', label: 'Placeholder' },
  'fake-data': { tone: 'warning', label: 'Fake data' },
  missing: { tone: 'info', label: 'Missing' },
};

const columns: TableColumn<Finding>[] = [
  { key: 'app', header: 'App', width: 110, render: (f) => <span className="font-medium text-ink">{f.app}</span> },
  { key: 'where', header: 'Where', render: (f) => <span className="text-ink">{f.where}</span> },
  { key: 'today', header: 'Today', render: (f) => <span className="text-ink-muted">{f.today}</span> },
  { key: 'kind', header: 'Type', width: 120, render: (f) => <Badge tone={KIND[f.kind].tone} size="sm">{KIND[f.kind].label}</Badge> },
  { key: 'res', header: 'Resolution', render: (f) => <span className="text-ink">{f.resolution}</span> },
  { key: 'story', header: 'Prototype', width: 160, render: (f) => <span className="text-xs text-ink-subtle">{f.story}</span> },
];

export const AuditTable: Story = {
  name: 'Audit - every dead item and its fix',
  render: () => (
    <div className="ds-root min-h-screen bg-surface-canvas font-sans text-ink">
      <Page className="max-w-7xl">
        <PageHeader title="Platform connection audit" description={`${FINDINGS.length} findings across Portal, Inventory and SMS`} />
        <Table columns={columns} data={FINDINGS} rowKey={(f) => `${f.app}-${f.where}`} />
      </Page>
    </div>
  ),
};

function Node({ icon, title, lines }: { icon: typeof Package; title: string; lines: string[] }) {
  return (
    <Card className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-primary-700"><Icon icon={icon} size="md" /></span><h3 className="text-sm font-semibold">{title}</h3></div>
      <ul className="flex flex-col gap-2 text-sm text-ink-muted">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
    </Card>
  );
}

function Edge({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-2 text-xs text-ink-subtle"><Icon icon={ArrowsLeftRight} size="sm" />{label}</div>;
}

export const ConnectionMap: Story = {
  name: 'How the platforms connect',
  render: () => (
    <div className="ds-root min-h-screen bg-surface-canvas font-sans text-ink">
      <Page>
        <PageHeader title="How the platforms connect" description="Portal is the control plane. Inventory and each SMS branch are platform instances of the same company." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Node icon={House} title="Portal" lines={['Owns: company, team, billing, account, platform connections and data links', 'Opens every platform from Platforms and the rail', 'Shows cross-platform KPIs and Leda']} />
          <Node icon={Package} title="Inventory" lines={['Owns: products, stock, movements, purchase orders, suppliers', 'Provides: stock and catalog to linked SMS branches', 'Account and Billing open the Portal']} />
          <Node icon={Wrench} title="SMS (per branch)" lines={['Owns: jobs, customers, services catalogue', 'Consumes: parts from a linked Inventory (set in Portal)', 'Account and Billing open the Portal']} />
        </div>
        <div className="flex flex-col gap-2">
          <Edge label="Portal to any platform: rail tile or Platforms > Open (signed-in handoff)" />
          <Edge label="Any platform to Portal: R tile, Back to Portal, Account, Billing, Add platform" />
          <Edge label="SMS to Inventory: parts picker reads stock; Parts empty state links to Portal > Connect data" />
          <Edge label="Inventory to SMS: branches in rail and switcher (jobs consume stock via the data link)" />
        </div>
        <Notice tone="neutral" title="Rules">
          One rail from GET /platforms on every app. A tile is either a working link or absent: no decorative tiles, no Coming soon buttons. A feature without a backend is hidden, not shown disabled.
        </Notice>
        <div className="flex items-center gap-2 text-sm text-ink-muted"><Icon icon={ArrowRight} size="sm" /> Journeys: sign in once, open any platform, reach Billing from anywhere in two clicks.</div>
      </Page>
    </div>
  ),
};
