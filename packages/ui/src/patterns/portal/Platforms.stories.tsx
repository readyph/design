import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Package,
  Storefront,
  Bank,
  DeviceMobile,
  Calculator,
  Truck,
  Gift,
  Plus,
  DotsThree,
  ArrowClockwise,
  Gear,
  ArrowSquareOut,
  CaretLeft,
  LinkSimple,
  LinkBreak,
  ShareNetwork,
  Warning,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Badge } from '../../components/Badge';
import { Menu } from '../../components/Menu';
import { Icon } from '../../components/Icon';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Drawer } from '../../components/Drawer';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Notice } from '../../components/Notice';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PortalShell, StatusDot, type Status } from './shell';

/**
 * Platform Links — the reworked "Connected platforms" page (03 §6), built to the
 * `platform-links.contract.md` spec. A tenant holds MANY instances (incl.
 * several of one kind — branches) and links them so one SHARES DATA with another.
 *
 * A link is directional and typed by a **capability** (a stable string like
 * `inventory.stock`), NOT hardwired to inventory — any future platform plugs in
 * by declaring what it `provides` / `requires`. One provider serves many
 * consumers (shared stock for every branch); a consumer reads one source PER
 * capability (each branch its own stock); no link = not connected (null).
 *
 * Interactive mock: switch Platforms ⇄ Connections, add a platform from the
 * marketplace, open the Link editor from a card's **Connect data**, add a data
 * connection, change a source and watch the cards + the map update.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Portal/Platforms',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

// ── Model (mirrors the contract's shapes) ───────────────────────────────────

type Capability = 'inventory.stock' | 'inventory.catalog' | 'crm.customers' | 'pos.sales';

interface Requirement {
  capability: Capability;
  required: boolean;
}

interface Instance {
  id: string;
  kind: string;
  icon: PhosphorIcon;
  label: string;
  status: Status;
  version: string | null;
  metrics: Record<string, number>;
  provides: Capability[];
  requires: Requirement[];
}

interface Link {
  consumerId: string;
  capability: Capability;
  providerId: string;
}

const CAP: Record<Capability, { title: string; short: string; shares: string }> = {
  'inventory.stock': { title: 'Inventory · Stock', short: 'Stock', shares: 'Products, stock levels and movements.' },
  'inventory.catalog': { title: 'Inventory · Catalog', short: 'Catalog', shares: 'Product catalog and pricing.' },
  'crm.customers': { title: 'Customers · CRM', short: 'Customers', shares: 'Customer profiles and contact details.' },
  'pos.sales': { title: 'POS · Sales', short: 'Sales', shares: 'In-store sales and receipts.' },
};

// What each kind CAN consume (the superset). `requires` below is the mandatory
// subset shown by default; the rest are added on demand in the editor.
const CONSUMES: Record<string, Capability[]> = {
  Storefront: ['inventory.stock', 'inventory.catalog', 'crm.customers'],
  POS: ['inventory.stock', 'crm.customers'],
  Inventory: [],
};

const statusLabel: Record<Status, string> = { active: 'Active', degraded: 'Degraded', offline: 'Offline' };

const STOREFRONT_REQS: Requirement[] = [{ capability: 'inventory.stock', required: true }];

const SEED_INSTANCES: Instance[] = [
  { id: 'st-makati', kind: 'Storefront', icon: Storefront, label: 'Makati branch', status: 'active', version: '1.2.0', metrics: { orders: 128 }, provides: [], requires: STOREFRONT_REQS },
  { id: 'st-bgc', kind: 'Storefront', icon: Storefront, label: 'BGC branch', status: 'active', version: '1.2.0', metrics: { orders: 96 }, provides: [], requires: STOREFRONT_REQS },
  { id: 'st-cebu', kind: 'Storefront', icon: Storefront, label: 'Cebu branch', status: 'offline', version: null, metrics: {}, provides: [], requires: STOREFRONT_REQS },
  { id: 'inv-central', kind: 'Inventory', icon: Package, label: 'Central stock', status: 'active', version: '2.4.1', metrics: { products: 412, low_stock: 7 }, provides: ['inventory.stock', 'inventory.catalog'], requires: [] },
  { id: 'inv-davao', kind: 'Inventory', icon: Package, label: 'Davao stock', status: 'active', version: '2.4.1', metrics: { products: 88, low_stock: 1 }, provides: ['inventory.stock', 'inventory.catalog'], requires: [] },
];

const SEED_LINKS: Link[] = [
  { consumerId: 'st-makati', capability: 'inventory.stock', providerId: 'inv-central' },
  { consumerId: 'st-bgc', capability: 'inventory.stock', providerId: 'inv-central' },
];

const KIND_CATALOG: Record<string, { icon: PhosphorIcon; provides: Capability[]; requires: Requirement[] }> = {
  Storefront: { icon: Storefront, provides: [], requires: STOREFRONT_REQS },
  Inventory: { icon: Package, provides: ['inventory.stock', 'inventory.catalog'], requires: [] },
  POS: { icon: Bank, provides: ['pos.sales'], requires: [{ capability: 'inventory.stock', required: true }] },
};

// The marketplace catalog shown in the Add-a-platform modal. Entries with a
// `kind` are connectable; `comingSoon` entries are display-only.
interface CatalogEntry {
  kind?: string;
  name: string;
  icon: PhosphorIcon;
  category: string;
  description: string;
  comingSoon?: boolean;
}

const MARKETPLACE: CatalogEntry[] = [
  { kind: 'Storefront', name: 'Storefront', icon: Storefront, category: 'Sales', description: 'An online store or branch for web orders.' },
  { kind: 'Inventory', name: 'Inventory', icon: Package, category: 'Operations', description: 'Products, stock levels and movements.' },
  { kind: 'POS', name: 'POS', icon: Bank, category: 'Sales', description: 'In-store point of sale and terminals.' },
  { name: 'Mobile app', icon: DeviceMobile, category: 'Sales', description: 'Your branded customer app for orders and messages.', comingSoon: true },
  { name: 'Accounting', icon: Calculator, category: 'Finance', description: 'Sync sales and expenses to your books.', comingSoon: true },
  { name: 'Delivery', icon: Truck, category: 'Operations', description: 'Assign riders and track drop-offs.', comingSoon: true },
  { name: 'Loyalty', icon: Gift, category: 'Growth', description: 'Points and rewards for repeat customers.', comingSoon: true },
];

function metricSummary(metrics: Record<string, number>, status: Status): string {
  const parts = Object.entries(metrics).slice(0, 3).map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`);
  if (parts.length > 0) return parts.join(' · ');
  return status === 'offline' ? 'Setup needed' : 'No metrics yet';
}

// ── Prototype ────────────────────────────────────────────────────────────────

function PlatformLinksPrototype() {
  const [instances, setInstances] = useState<Instance[]>(SEED_INSTANCES);
  const [links, setLinks] = useState<Link[]>(SEED_LINKS);
  const [extraCaps, setExtraCaps] = useState<Record<string, Capability[]>>({});
  const [view, setView] = useState('platforms');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const byId = useMemo(() => Object.fromEntries(instances.map((i) => [i.id, i])), [instances]);
  const providersFor = (cap: Capability) => instances.filter((i) => i.provides.includes(cap));
  const linkFor = (consumerId: string, cap: Capability) => links.find((l) => l.consumerId === consumerId && l.capability === cap) ?? null;
  const consumersOf = (providerId: string) => links.filter((l) => l.providerId === providerId);

  function setLink(consumerId: string, cap: Capability, providerId: string | null) {
    setLinks((prev) => {
      const rest = prev.filter((l) => !(l.consumerId === consumerId && l.capability === cap));
      return providerId ? [...rest, { consumerId, capability: cap, providerId }] : rest;
    });
  }

  function addCap(instanceId: string, cap: Capability) {
    setExtraCaps((prev) => ({ ...prev, [instanceId]: [...new Set([...(prev[instanceId] ?? []), cap])] }));
  }
  function removeCap(instanceId: string, cap: Capability) {
    setLink(instanceId, cap, null);
    setExtraCaps((prev) => ({ ...prev, [instanceId]: (prev[instanceId] ?? []).filter((c) => c !== cap) }));
  }

  function addInstance(kind: string, label: string) {
    const def = KIND_CATALOG[kind];
    if (!def) return;
    const id = `${kind.toLowerCase()}-${Date.now()}`;
    const name = label.trim() || `${kind} ${instances.filter((p) => p.kind === kind).length + 1}`;
    setInstances((prev) => [
      ...prev,
      { id, kind, icon: def.icon, label: name, status: 'offline', version: null, metrics: {}, provides: def.provides, requires: def.requires },
    ]);
    setAdding(false);
    // Jump straight into connecting its data (mirrors the onboarding contract).
    if (CONSUMES[kind]?.length) setEditingId(id);
  }

  const groups = useMemo(() => {
    const order = ['Storefront', 'Inventory', 'POS'];
    const map = new Map<string, Instance[]>();
    for (const i of instances) {
      if (!map.has(i.kind)) map.set(i.kind, []);
      map.get(i.kind)!.push(i);
    }
    return [...map.entries()].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  }, [instances]);

  const branchCount = groups.reduce((n, [, items]) => n + (items.length > 1 ? items.length : 0), 0);
  const summary = `${instances.length} platforms · ${branchCount} branches · ${links.length} data links`;

  const editing = editingId ? byId[editingId] : null;
  const confirmInst = confirmId ? byId[confirmId] : null;
  const confirmDeps = confirmInst ? consumersOf(confirmInst.id) : [];

  const cardCaps = (inst: Instance): Capability[] => {
    const req = inst.requires.map((r) => r.capability);
    const linked = links.filter((l) => l.consumerId === inst.id).map((l) => l.capability);
    return [...new Set([...req, ...linked])];
  };

  const editorCaps = (inst: Instance): Capability[] => {
    const req = inst.requires.map((r) => r.capability);
    const linked = links.filter((l) => l.consumerId === inst.id).map((l) => l.capability);
    const extra = extraCaps[inst.id] ?? [];
    return [...new Set([...req, ...linked, ...extra])];
  };

  function DataStrip({ inst }: { inst: Instance }) {
    const caps = cardCaps(inst);
    if (caps.length === 0 && CONSUMES[inst.kind]?.length) {
      return (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="text-xs font-medium text-ink-subtle">Data</span>
          <span className="text-xs text-ink-subtle">Not connected</span>
        </div>
      );
    }
    if (caps.length === 0) return null;
    return (
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-ink-subtle">Data</span>
        {caps.map((cap) => {
          const link = linkFor(inst.id, cap);
          const provider = link ? byId[link.providerId] : null;
          const required = inst.requires.some((r) => r.capability === cap && r.required);
          return (
            <button
              key={cap}
              onClick={() => setEditingId(inst.id)}
              className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink transition-colors hover:bg-surface-subtle focus-visible:ring-focus"
            >
              {provider ? (
                <>
                  <Icon icon={LinkSimple} size="sm" className="text-primary-600" />
                  {CAP[cap].short} ← {provider.label}
                </>
              ) : (
                <>
                  <Icon icon={Warning} size="sm" className={required ? 'text-warning-fg' : 'text-ink-subtle'} />
                  <span className="text-ink-muted">{CAP[cap].short}: not connected</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  function SharedStrip({ inst }: { inst: Instance }) {
    if (inst.provides.length === 0) return null;
    const names = [...new Set(consumersOf(inst.id).map((l) => byId[l.consumerId]?.label).filter(Boolean))];
    return (
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-ink-subtle">Shared with</span>
        {names.length > 0 ? (
          <>
            <span className="text-xs text-ink">{names.join(', ')}</span>
            <Badge tone="info" size="sm">Shared · {names.length}</Badge>
          </>
        ) : (
          <span className="text-xs text-ink-subtle">Not shared yet</span>
        )}
      </div>
    );
  }

  function InstanceCard({ inst }: { inst: Instance }) {
    const version = inst.version ? `v${inst.version}` : 'No version';
    const isProvider = inst.provides.length > 0;
    const isConsumer = CONSUMES[inst.kind]?.length > 0;
    const isSetup = inst.status === 'offline' && Object.keys(inst.metrics).length === 0;
    return (
      <Card>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink">
            <Icon icon={inst.icon} size="md" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-ink">{inst.label}</span>
              <span className="flex items-center gap-1 text-xs text-ink-muted">
                <StatusDot status={inst.status} /> {isSetup ? 'Setup needed' : statusLabel[inst.status]}
              </span>
              {isProvider && consumersOf(inst.id).length > 0 && (
                <span className="ml-auto"><Badge tone="info" size="sm">Shared source</Badge></span>
              )}
            </div>
            <p className="mt-1 text-sm text-ink">{metricSummary(inst.metrics, inst.status)}</p>
            <p className="text-xs text-ink-subtle">{inst.kind} · {version}</p>
          </div>
        </div>

        <DataStrip inst={inst} />
        <SharedStrip inst={inst} />

        <div className="mt-4 flex items-center gap-2">
          {isSetup ? (
            <Button size="sm" variant="primary" leftIcon={ArrowClockwise}>Finish setup</Button>
          ) : (
            <Button size="sm" leftIcon={ArrowSquareOut} disabled={inst.status === 'offline'}>Open</Button>
          )}
          <Button size="sm" variant="secondary" leftIcon={isConsumer ? LinkSimple : Gear} onClick={() => setEditingId(inst.id)}>
            {isConsumer ? 'Connect data' : 'Configure'}
          </Button>
          <Menu
            trigger={<IconButton icon={DotsThree} label="Platform actions" variant="subtle" size="sm" className="ml-auto" />}
            items={[
              { label: 'Rename', icon: Gear },
              { label: 'View activity', icon: ArrowClockwise },
              { type: 'separator' },
              { label: 'Disconnect', danger: true, onSelect: () => setConfirmId(inst.id) },
            ]}
          />
        </div>
      </Card>
    );
  }

  const addable = editing ? (CONSUMES[editing.kind] ?? []).filter((c) => !editorCaps(editing).includes(c)) : [];

  return (
    <PortalShell active="platforms" title="Connected platforms">
      <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
        <PageHeader
          title="Connected platforms"
          description={summary}
          actions={
            <div className="flex items-center gap-2">
              <SegmentedControl
                aria-label="View"
                value={view}
                onChange={setView}
                options={[
                  { value: 'platforms', label: 'Platforms' },
                  { value: 'connections', label: 'Connections' },
                ]}
              />
              <Button leftIcon={Plus} onClick={() => setAdding(true)}>Add platform</Button>
            </div>
          }
        />

        {view === 'platforms' ? (
          <div className="space-y-8">
            {groups.map(([kind, items]) => (
              <section key={kind} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{kind}</h2>
                  <Badge tone="neutral" size="sm">{items.length}</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((inst) => <InstanceCard key={inst.id} inst={inst} />)}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <ConnectionsMap
            instances={instances}
            links={links}
            hovered={hovered}
            onHover={setHovered}
            onPickNode={(id) => setEditingId(id)}
            consumersOf={consumersOf}
          />
        )}
      </div>

      {/* Link editor */}
      <Drawer
        open={editing != null}
        onOpenChange={(o) => !o && setEditingId(null)}
        title={editing ? `Connect data — ${editing.label}` : ''}
        description={editing ? `${editing.kind} · choose where this platform reads and shares data` : undefined}
        width="26rem"
      >
        {editing && (
          <div className="space-y-6 px-5 py-4">
            {CONSUMES[editing.kind]?.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Reads data from</h3>
                {editorCaps(editing).map((cap) => {
                  const current = linkFor(editing.id, cap);
                  const options = providersFor(cap);
                  const required = editing.requires.some((r) => r.capability === cap && r.required);
                  const missing = required && !current;
                  return (
                    <div key={cap} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink">{CAP[cap].title}</span>
                        <Badge tone={required ? 'warning' : 'neutral'} size="sm">{required ? 'required' : 'optional'}</Badge>
                        {!required && (
                          <IconButton icon={LinkBreak} label="Remove this connection" variant="subtle" size="sm" className="ml-auto" onClick={() => removeCap(editing.id, cap)} />
                        )}
                      </div>
                      <Select
                        value={current?.providerId ?? 'none'}
                        onValueChange={(v) => setLink(editing.id, cap, v === 'none' ? null : v)}
                        options={[
                          { value: 'none', label: 'Not connected' },
                          ...options.map((p) => ({ value: p.id, label: p.label })),
                        ]}
                      />
                      <p className="text-xs text-ink-subtle">Shares: {CAP[cap].shares}</p>
                      {options.length === 0 && (
                        <p className="text-xs text-ink-muted">No source available — add a platform that provides this first.</p>
                      )}
                      {missing && options.length > 0 && (
                        <Notice tone="warning">{CAP[cap].short} features stay hidden until a source is connected.</Notice>
                      )}
                    </div>
                  );
                })}

                {addable.length > 0 ? (
                  <Menu
                    trigger={<Button variant="secondary" size="sm" leftIcon={Plus} fullWidth>Add a data connection</Button>}
                    items={addable.map((c) => ({ label: CAP[c].title, onSelect: () => addCap(editing.id, c) }))}
                  />
                ) : (
                  <p className="text-xs text-ink-subtle">All available data connections added.</p>
                )}
              </section>
            )}

            {editing.provides.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">Shares data with</h3>
                {editing.provides.map((cap) => {
                  const consumers = consumersOf(editing.id).filter((l) => l.capability === cap);
                  return (
                    <div key={cap} className="rounded-xl bg-surface-subtle p-3">
                      <p className="text-sm font-medium text-ink">{CAP[cap].title}</p>
                      {consumers.length > 0 ? (
                        <ul className="mt-2 space-y-1.5">
                          {consumers.map((l) => (
                            <li key={l.consumerId} className="flex items-center justify-between gap-2 text-sm text-ink">
                              <span className="flex items-center gap-1.5"><Icon icon={LinkSimple} size="sm" className="text-primary-600" />{byId[l.consumerId]?.label}</span>
                              <IconButton icon={LinkBreak} label="Remove link" variant="subtle" size="sm" onClick={() => setLink(l.consumerId, cap, null)} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-1 text-xs text-ink-subtle">Not shared with any platform yet.</p>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setEditingId(null)}>Done</Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add a platform — marketplace */}
      <MarketplaceModal open={adding} onOpenChange={setAdding} onAdd={addInstance} />

      {/* Disconnect — guarded for shared sources */}
      <ConfirmDialog
        open={confirmInst != null}
        onOpenChange={(o) => !o && setConfirmId(null)}
        tone="danger"
        title={confirmInst && confirmDeps.length > 0 ? `${confirmInst.label} is shared` : `Disconnect ${confirmInst?.label ?? ''}?`}
        description={
          confirmInst && confirmDeps.length > 0
            ? `${confirmDeps.length} platform${confirmDeps.length > 1 ? 's' : ''} read data from it: ${[...new Set(confirmDeps.map((l) => byId[l.consumerId]?.label))].join(', ')}. Reconnect them to another source or remove those links before disconnecting.`
            : 'This removes the platform and its connections. This cannot be undone.'
        }
        confirmLabel={confirmInst && confirmDeps.length > 0 ? 'View connections' : 'Disconnect'}
        onConfirm={() => {
          if (confirmInst && confirmDeps.length > 0) setView('connections');
          else if (confirmInst) setInstances((prev) => prev.filter((i) => i.id !== confirmInst.id));
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
    </PortalShell>
  );
}

// ── Add-a-platform marketplace modal ─────────────────────────────────────────

function MarketplaceModal({ open, onOpenChange, onAdd }: {
  open: boolean; onOpenChange: (o: boolean) => void; onAdd: (kind: string, label: string) => void;
}) {
  const [pickedKind, setPickedKind] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const picked = MARKETPLACE.find((m) => m.kind === pickedKind) ?? null;
  const browsing = picked == null;

  function reset() { setPickedKind(null); setLabel(''); }
  function handleOpenChange(o: boolean) { if (!o) reset(); onOpenChange(o); }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      size="2xl"
      title={browsing ? 'Add a platform' : `Name your ${picked?.name}`}
      description={
        browsing
          ? 'Connect a platform to your company. Add several of one kind for branches.'
          : 'Give this platform a name so you can tell your branches apart.'
      }
      footer={
        browsing ? (
          <Button variant="secondary" onClick={() => handleOpenChange(false)}>Cancel</Button>
        ) : (
          <>
            <Button variant="secondary" leftIcon={CaretLeft} onClick={reset}>Back</Button>
            <Button leftIcon={Plus} onClick={() => { onAdd(picked!.kind!, label); reset(); }}>Add platform</Button>
          </>
        )
      }
    >
      {browsing ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MARKETPLACE.map((m) => (
            <Card key={m.name} className="flex h-full flex-col border border-border bg-surface-subtle">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-ink">
                  <Icon icon={m.icon} size="md" />
                </span>
                {m.comingSoon && <Badge tone="neutral" size="sm">Coming soon</Badge>}
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">{m.name}</p>
              <p className="text-xs text-ink-subtle">{m.category}</p>
              <p className="mt-1 flex-1 text-xs text-ink-muted">{m.description}</p>
              <Button
                className="mt-4"
                size="sm"
                variant={m.comingSoon ? 'secondary' : 'primary'}
                fullWidth
                leftIcon={Plus}
                disabled={m.comingSoon || !m.kind}
                onClick={() => m.kind && setPickedKind(m.kind)}
              >
                {m.comingSoon ? 'Coming soon' : 'Connect'}
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-md space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-surface-subtle p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-ink">
              <Icon icon={picked!.icon} size="md" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{picked!.name}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{picked!.description}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-ink">Name</label>
            <Input placeholder={`e.g. ${picked!.name} 2`} value={label} onChange={(e) => setLabel(e.target.value)} />
            <p className="text-xs text-ink-subtle">A label so you can tell branches apart (e.g. &ldquo;Makati branch&rdquo;).</p>
          </div>
          {picked!.kind && CONSUMES[picked!.kind]?.length > 0 && (
            <Notice tone="info">After adding, you&rsquo;ll connect its data sources (stock, customers) next.</Notice>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Connections map (consumers → providers, edge per capability link) ─────────

interface MapProps {
  instances: Instance[];
  links: Link[];
  hovered: string | null;
  onHover: (id: string | null) => void;
  onPickNode: (id: string) => void;
  consumersOf: (providerId: string) => Link[];
}

// One shared coordinate space: an SVG viewBox + percent-positioned nodes, so the
// lines and the cards always line up regardless of the rendered width.
const VB_W = 760;
const VB_H = 420;
const NODE_W = 230; // viewBox x-units
const NODE_H = 72; // px
const LEFT_X = 16;
const RIGHT_X = VB_W - NODE_W - 16; // 514
const EDGE_X0 = LEFT_X + NODE_W; // 246 (consumer right edge)
const EDGE_X1 = RIGHT_X; // 514 (provider left edge)
const pct = (v: number, total: number) => `${(v / total) * 100}%`;

function ConnectionsMap({ instances, links, hovered, onHover, onPickNode, consumersOf }: MapProps) {
  const consumers = instances.filter((i) => (CONSUMES[i.kind]?.length ?? 0) > 0);
  const providers = instances.filter((i) => i.provides.length > 0);

  if (links.length === 0 && consumers.length === 0) {
    return (
      <Card className="py-12 text-center">
        <div className="mx-auto max-w-sm space-y-3">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-muted text-ink-subtle"><Icon icon={ShareNetwork} size="lg" /></span>
          <p className="text-sm font-semibold text-ink">No connections yet</p>
          <p className="text-sm text-ink-muted">Connect a platform to a data source to share inventory, customers, and more between them.</p>
        </div>
      </Card>
    );
  }

  const yOf = (i: number, n: number) => (VB_H * (i + 1)) / (n + 1);
  const consumerY = new Map(consumers.map((c, i) => [c.id, yOf(i, consumers.length)]));
  const providerY = new Map(providers.map((p, i) => [p.id, yOf(i, providers.length)]));

  return (
    <Card>
      <div className="relative w-full" style={{ height: VB_H }}>
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          {links.map((l) => {
            const y0 = consumerY.get(l.consumerId);
            const y1 = providerY.get(l.providerId);
            if (y0 == null || y1 == null) return null;
            const key = `${l.consumerId}:${l.capability}`;
            const hot = hovered === l.consumerId || hovered === l.providerId || hovered === key;
            const d = `M ${EDGE_X0} ${y0} C ${EDGE_X0 + 120} ${y0}, ${EDGE_X1 - 120} ${y1}, ${EDGE_X1} ${y1}`;
            return (
              <g
                key={key}
                className={hot ? 'text-primary-600' : 'text-ink-subtle'}
                onMouseEnter={() => onHover(key)}
                onMouseLeave={() => onHover(null)}
              >
                <path d={d} fill="none" stroke="transparent" strokeWidth={18} vectorEffect="non-scaling-stroke" />
                <path d={d} fill="none" stroke="currentColor" strokeWidth={hot ? 2.5 : 1.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>

        {consumers.map((c) => {
          const y = consumerY.get(c.id)!;
          const needs = (CONSUMES[c.kind] ?? []).some((cap) => c.requires.some((r) => r.capability === cap && r.required) && !links.find((l) => l.consumerId === c.id && l.capability === cap));
          return (
            <MapNode key={c.id} inst={c} leftPct={pct(LEFT_X, VB_W)} topPct={pct(y, VB_H)} widthPct={pct(NODE_W, VB_W)}
              sub={needs ? 'needs a source' : 'connected'} onHover={onHover} onClick={() => onPickNode(c.id)} />
          );
        })}
        {providers.map((p) => {
          const y = providerY.get(p.id)!;
          const n = [...new Set(consumersOf(p.id).map((l) => l.consumerId))].length;
          return (
            <MapNode key={p.id} inst={p} leftPct={pct(RIGHT_X, VB_W)} topPct={pct(y, VB_H)} widthPct={pct(NODE_W, VB_W)}
              sub={n > 0 ? `shared · ${n}` : 'no consumers'} onHover={onHover} onClick={() => onPickNode(p.id)} />
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-ink-subtle">
        <span>Consumers</span>
        <span className="h-px w-8 bg-border-strong" />
        <span>Providers · hover a line to trace a capability</span>
      </div>
    </Card>
  );
}

function MapNode({ inst, leftPct, topPct, widthPct, sub, onHover, onClick }: {
  inst: Instance; leftPct: string; topPct: string; widthPct: string; sub: string;
  onHover: (id: string | null) => void; onClick: () => void;
}) {
  return (
    <button
      onMouseEnter={() => onHover(inst.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      style={{ left: leftPct, top: topPct, width: widthPct, height: NODE_H, transform: 'translateY(-50%)' }}
      className="absolute flex items-center gap-2.5 rounded-xl bg-surface-subtle px-3 text-left shadow-sm transition-colors hover:bg-surface-muted focus-visible:ring-focus"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink"><Icon icon={inst.icon} size="md" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <StatusDot status={inst.status} />
          <span className="truncate text-sm font-semibold text-ink">{inst.label}</span>
        </span>
        <span className="block truncate text-xs text-ink-subtle">{inst.kind} · {sub}</span>
      </span>
    </button>
  );
}

export const Platforms: Story = {
  name: 'Connected platforms',
  render: () => <PlatformLinksPrototype />,
};
