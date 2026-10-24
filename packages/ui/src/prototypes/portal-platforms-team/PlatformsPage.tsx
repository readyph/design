/**
 * PROTOTYPE (RDY-178, epic RDY-173 features 3, 6, 7) - Portal Platforms page in the Slack-style shell.
 * Same functions as portal `PlatformsPage`: catalog (Add platform), connected list with live status,
 * alerts and last sync, connect data (link editor), rename, disconnect, data links and the
 * connections graph. Layout, density and theme only. Built from @readyph/ui 0.7 components and tokens.
 */
import { useMemo, useState } from 'react';
import {
  ArrowClockwise,
  ArrowSquareOut,
  CaretLeft,
  DotsThree,
  LinkBreak,
  LinkSimple,
  Package,
  PencilSimple,
  Plus,
  WaveTriangle,
  Warning,
} from '@phosphor-icons/react';
import { Badge, type BadgeTone } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ButtonLink } from '../../components/ButtonLink';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Drawer } from '../../components/Drawer';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Menu, type MenuItem } from '../../components/Menu';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { Table, type TableColumn } from '../../components/Table';
import { toast } from '../../components/toast/toastStore';
import { cn, focusRing } from '../../utils/cn';
import type { LedaState, ShellRole, ShellTheme } from '../portal-shell/Shell';
import { PortalFrame, tileClass, useContentWidth, useLedaTrigger } from './common';
import {
  CAP,
  CATALOG,
  KIND,
  SEED_INSTANCES,
  SEED_LINKS,
  type CatalogEntry,
  type DataLink,
  type Instance,
} from './data';

export type PlatformsView = 'platforms' | 'connections';
export type PlatformsDialog = 'none' | 'add' | 'add-name' | 'connect' | 'rename' | 'disconnect' | 'disconnect-shared';
export type LoadState = 'ready' | 'loading' | 'empty' | 'error';

export interface PlatformsPrototypeProps {
  theme?: ShellTheme;
  role?: ShellRole;
  leda?: LedaState;
  view?: PlatformsView;
  dialog?: PlatformsDialog;
  state?: LoadState;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const capInfo = (cap: string) => CAP[cap] ?? { title: cap, short: cap.split('.').pop() ?? cap, shares: 'Shared data.' };

/* -------------------------------------------------------------- the page */

export function PlatformsPrototype({
  theme = 'light',
  role = 'admin',
  leda: initialLeda = 'closed',
  view: initialView = 'platforms',
  dialog = 'none',
  state = 'ready',
}: PlatformsPrototypeProps) {
  const { leda, ask } = useLedaTrigger(initialLeda);
  const { ref, width } = useContentWidth<HTMLDivElement>();
  const wide = width >= 600;
  const [instances, setInstances] = useState<Instance[]>(state === 'empty' ? [] : SEED_INSTANCES);
  const [links, setLinks] = useState<DataLink[]>(SEED_LINKS);
  const [view, setView] = useState<PlatformsView>(initialView);
  const [editingId, setEditingId] = useState<string | null>(dialog === 'connect' ? 'sms-cebu' : null);
  const [renamingId, setRenamingId] = useState<string | null>(dialog === 'rename' ? 'sms-bgc' : null);
  const [confirmId, setConfirmId] = useState<string | null>(
    dialog === 'disconnect' ? 'sms-cebu' : dialog === 'disconnect-shared' ? 'inv-central' : null,
  );
  const [adding, setAdding] = useState(dialog === 'add' || dialog === 'add-name');

  const byId = useMemo(() => new Map(instances.map((i) => [i.id, i])), [instances]);
  const linkFor = (consumerId: string, cap: string) =>
    links.find((l) => l.consumerId === consumerId && l.capability === cap) ?? null;
  const consumersOf = (providerId: string) => links.filter((l) => l.providerId === providerId);
  const providersFor = (cap: string) => instances.filter((i) => i.provides.includes(cap));
  const isSetup = (i: Instance) => i.requires.length > 0 && !i.requires.some((r) => linkFor(i.id, r.capability));

  function setLink(consumerId: string, cap: string, providerId: string | null) {
    setLinks((prev) => {
      const rest = prev.filter((l) => !(l.consumerId === consumerId && l.capability === cap));
      return providerId ? [...rest, { id: `l-${Date.now()}`, consumerId, capability: cap, providerId }] : rest;
    });
  }

  const branchCount = instances.filter((i) => i.kind !== 'inventory').length;
  const summary = `${plural(instances.length, 'platform')} · ${plural(branchCount, 'branch', 'branches')} · ${plural(links.length, 'data link')}`;
  const alerting = instances.filter((i) => i.alerts.length > 0);
  const admin = role === 'admin';

  const ctx: RowCtx = {
    admin,
    byId,
    linkFor,
    consumersOf,
    isSetup,
    onConnect: setEditingId,
    onRename: setRenamingId,
    onDisconnect: setConfirmId,
    onAsk: ask,
  };

  const groups = (['inventory', 'sms'] as const)
    .map((k) => [k, instances.filter((i) => i.kind === k)] as const)
    .filter(([, items]) => items.length > 0);

  const editing = editingId ? byId.get(editingId) ?? null : null;
  const renaming = renamingId ? byId.get(renamingId) ?? null : null;
  const confirmInst = confirmId ? byId.get(confirmId) ?? null : null;
  const confirmDeps = confirmInst ? consumersOf(confirmInst.id) : [];

  return (
    <PortalFrame theme={theme} role={role} page="platforms" leda={leda}>
      <div ref={ref} className="flex min-w-0 flex-col gap-3">
        {/* Toolbar: summary left, view switch + primary action right (top bar holds the title). */}
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-xs text-ink-subtle">{state === 'ready' && instances.length > 0 ? summary : ' '}</p>
          {state === 'ready' && instances.length > 0 && (
            <SegmentedControl
              size="sm"
              className="p-0.5"
              aria-label="View"
              value={view}
              onChange={(v) => setView(v as PlatformsView)}
              options={[
                { value: 'platforms', label: 'Platforms' },
                { value: 'connections', label: 'Connections' },
              ]}
            />
          )}
          {admin && (
            <Button leftIcon={Plus} onClick={() => setAdding(true)}>
              Add platform
            </Button>
          )}
        </div>

        {state === 'loading' ? (
          <LoadingRows />
        ) : state === 'error' ? (
          <Card padding="none">
            <EmptyState
              icon={Warning}
              title="Couldn't load your platforms"
              description="Check your connection and try again."
              action={
                <Button variant="secondary" leftIcon={ArrowClockwise}>
                  Try again
                </Button>
              }
            />
          </Card>
        ) : instances.length === 0 ? (
          <Card padding="none">
            <EmptyState
              icon={Package}
              title="No platforms yet"
              description="Add Inventory or a Service Management System (SMS) branch to start."
              action={
                admin ? (
                  <Button leftIcon={Plus} onClick={() => setAdding(true)}>
                    Add platform
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : view === 'platforms' ? (
          <>
            {alerting.map((i) => (
              <Notice key={i.id} tone="warning" title={`${i.label} needs attention`}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="mr-auto">{i.alerts.join('. ')}. Last sync {i.lastSync}.</span>
                  <span className="flex gap-2">
                    <Button size="sm" variant="secondary" leftIcon={WaveTriangle} onClick={ask}>
                      Ask Leda
                    </Button>
                    <Button size="sm" variant="subtle" leftIcon={LinkSimple} onClick={() => setEditingId(i.id)}>
                      Check data
                    </Button>
                  </span>
                </div>
              </Notice>
            ))}
            {groups.map(([kind, items]) => (
              <section key={kind} aria-labelledby={`grp-${kind}`} className="flex min-w-0 flex-col gap-2">
                <h2 id={`grp-${kind}`} className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                  {KIND[kind].group}
                  <Badge tone="neutral" size="sm">
                    {items.length}
                  </Badge>
                </h2>
                {wide ? (
                  <Table columns={platformColumns(ctx, width)} data={items} rowKey={(r) => r.id} className="[&_table]:table-fixed" />
                ) : (
                  <PlatformList items={items} ctx={ctx} />
                )}
              </section>
            ))}
          </>
        ) : (
          <ConnectionsView
            instances={instances}
            links={links}
            byId={byId}
            admin={admin}
            onPick={setEditingId}
            onUnlink={(l) => setLink(l.consumerId, l.capability, null)}
            onBack={() => setView('platforms')}
            width={width}
          />
        )}
      </div>

      <ConnectDrawer
        editing={editing}
        byId={byId}
        linkFor={linkFor}
        consumersOf={consumersOf}
        providersFor={providersFor}
        setLink={setLink}
        onClose={() => setEditingId(null)}
      />

      <AddPlatformModal
        open={adding}
        initialPick={dialog === 'add-name' ? 'sms' : null}
        onOpenChange={setAdding}
        onAdd={(entry, label) => {
          const kind = entry.kind!;
          const id = `${kind}-${Date.now()}`;
          const name = label.trim() || `${entry.name} ${instances.filter((p) => p.kind === kind).length + 1}`;
          setInstances((prev) => [
            ...prev,
            {
              id,
              kind,
              label: name,
              status: 'offline',
              version: null,
              host: null,
              lastSync: 'Never',
              metrics: 'Offline, no activity yet',
              alerts: [],
              provides: kind === 'inventory' ? ['inventory.stock', 'inventory.catalog'] : [],
              requires: kind === 'sms' ? [{ capability: 'inventory.stock', required: true }] : [],
            },
          ]);
          setAdding(false);
          toast.success(`${name} added.`);
          if (kind === 'sms') setEditingId(id);
        }}
      />

      <RenameModal
        instance={renaming}
        onCancel={() => setRenamingId(null)}
        onSave={(label) => {
          if (!renaming) return;
          setInstances((prev) => prev.map((i) => (i.id === renaming.id ? { ...i, label } : i)));
          setRenamingId(null);
        }}
      />

      <ConfirmDialog
        open={confirmInst != null}
        onOpenChange={(o) => !o && setConfirmId(null)}
        tone="danger"
        title={confirmInst && confirmDeps.length > 0 ? `${confirmInst.label} is shared` : `Disconnect ${confirmInst?.label ?? ''}?`}
        description={
          confirmInst && confirmDeps.length > 0
            ? `${plural(confirmDeps.length, 'platform')} read data from it: ${[
                ...new Set(confirmDeps.map((l) => byId.get(l.consumerId)?.label)),
              ].join(', ')}. Reconnect them to another source or remove those links before disconnecting.`
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
    </PortalFrame>
  );
}

/* ------------------------------------------------------------ list rows */

interface RowCtx {
  admin: boolean;
  byId: Map<string, Instance>;
  linkFor: (consumerId: string, cap: string) => DataLink | null;
  consumersOf: (providerId: string) => DataLink[];
  isSetup: (i: Instance) => boolean;
  onConnect: (id: string) => void;
  onRename: (id: string) => void;
  onDisconnect: (id: string) => void;
  onAsk: () => void;
}

function statusOf(i: Instance, ctx: RowCtx): { tone: BadgeTone; label: string } {
  if (ctx.isSetup(i)) return { tone: 'warning', label: 'Setup needed' };
  if (i.status === 'active') return { tone: 'success', label: 'Active' };
  if (i.status === 'degraded') return { tone: 'warning', label: 'Degraded' };
  return { tone: 'neutral', label: 'Offline' };
}

function StatusCell({ i, ctx, alerts = false, sync = false }: { i: Instance; ctx: RowCtx; alerts?: boolean; sync?: boolean }) {
  const s = statusOf(i, ctx);
  if (sync) {
    return (
      <span className="flex flex-col items-start gap-0.5">
        <Badge tone={s.tone} size="sm" dot className="whitespace-nowrap">
          {s.label}
        </Badge>
        <span className="whitespace-nowrap text-xs text-ink-subtle">Synced {i.lastSync.toLowerCase()}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge tone={s.tone} size="sm" dot className="whitespace-nowrap">
        {s.label}
      </Badge>
      {alerts && i.alerts.length > 0 && (
        <Badge tone="error" size="sm">
          {plural(i.alerts.length, 'alert')}
        </Badge>
      )}
    </span>
  );
}

/** "Stock from Central stock", "Stock: no source", or "Shared with Makati branch, BGC branch". */
function DataCell({ i, ctx }: { i: Instance; ctx: RowCtx }) {
  if (i.provides.length > 0) {
    const names = [...new Set(ctx.consumersOf(i.id).map((l) => ctx.byId.get(l.consumerId)?.label).filter(Boolean))];
    return names.length > 0 ? (
      <span className="text-ink">
        <span className="text-ink-muted">Shared with </span>
        {names.join(', ')}
      </span>
    ) : (
      <span className="text-ink-subtle">Not shared yet</span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      {i.requires.map((r) => {
        const link = ctx.linkFor(i.id, r.capability);
        const provider = link ? ctx.byId.get(link.providerId) : null;
        return provider ? (
          <span key={r.capability} className="inline-flex items-center gap-1 text-ink">
            <Icon icon={LinkSimple} size="sm" className="text-primary-600" />
            <span>
              <span className="text-ink-muted">{capInfo(r.capability).short} from </span>
              {provider.label}
            </span>
          </span>
        ) : (
          <Badge key={r.capability} tone={r.required ? 'warning' : 'neutral'} size="sm" className="whitespace-nowrap">
            {capInfo(r.capability).short}: no source
          </Badge>
        );
      })}
    </span>
  );
}

function rowMenu(i: Instance, ctx: RowCtx, withOpen: boolean): MenuItem[] {
  const items: MenuItem[] = [];
  if (withOpen && !ctx.isSetup(i)) items.push({ label: 'Open', icon: ArrowSquareOut, href: `#open-${i.id}` });
  if (i.requires.length > 0) items.push({ label: 'Connect data', icon: LinkSimple, onSelect: () => ctx.onConnect(i.id) });
  items.push({ label: `Ask Leda about ${i.label}`, icon: WaveTriangle, onSelect: ctx.onAsk });
  if (ctx.admin) {
    items.push(
      { label: 'Rename', icon: PencilSimple, onSelect: () => ctx.onRename(i.id) },
      { type: 'separator' },
      { label: 'Disconnect', danger: true, onSelect: () => ctx.onDisconnect(i.id) },
    );
  }
  return items;
}

function RowActions({ i, ctx }: { i: Instance; ctx: RowCtx }) {
  return (
    <span className="inline-flex items-center justify-end gap-1">
      {ctx.isSetup(i) ? (
        ctx.admin && (
          <Button size="sm" variant="secondary" leftIcon={LinkSimple} onClick={() => ctx.onConnect(i.id)}>
            Set up
          </Button>
        )
      ) : (
        <ButtonLink size="sm" variant="subtle" leftIcon={ArrowSquareOut} href={`#open-${i.id}`} disabled={i.status === 'offline'}>
          Open
        </ButtonLink>
      )}
      <Menu
        align="end"
        trigger={<IconButton icon={DotsThree} label={`Actions for ${i.label}`} variant="subtle" size="sm" />}
        items={rowMenu(i, ctx, false)}
      />
    </span>
  );
}

function NameCell({ i }: { i: Instance }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className={tileClass('sm')}>
        <Icon icon={KIND[i.kind].icon} size="sm" />
      </span>
      <span className="font-medium text-ink">{i.label}</span>
      {i.alerts.length > 0 && (
        <Badge tone="error" size="sm" className="whitespace-nowrap">
          {plural(i.alerts.length, 'alert')}
        </Badge>
      )}
    </span>
  );
}

/** Columns follow the measured content width (sidebar fold, docked Leda), not the viewport. */
function platformColumns(ctx: RowCtx, width: number): TableColumn<Instance>[] {
  const cols: (TableColumn<Instance> | false)[] = [
    { key: 'name', header: 'Platform', width: '14.5rem', render: (i) => <NameCell i={i} /> },
    { key: 'status', header: 'Status', width: '8rem', className: 'py-1', render: (i) => <StatusCell i={i} ctx={ctx} sync={width < 800} /> },
    { key: 'data', header: 'Data', className: 'py-1.5', render: (i) => <DataCell i={i} ctx={ctx} /> },
    width >= 1000 && {
      key: 'activity',
      header: 'Activity',
      width: '12rem',
      className: 'py-1.5',
      render: (i) => <span className="text-ink-muted">{i.metrics}</span>,
    },
    width >= 800 && {
      key: 'sync',
      header: 'Last sync',
      width: '6.5rem',
      render: (i) => <span className="whitespace-nowrap text-ink-muted">{i.lastSync}</span>,
    },
    width >= 1100 && {
      key: 'version',
      header: 'Version',
      width: '4.5rem',
      render: (i) => <span className="tabular-nums text-ink-muted">{i.version ? `v${i.version}` : '-'}</span>,
    },
    { key: 'actions', header: <span className="sr-only">Actions</span>, width: '9rem', align: 'right', render: (i) => <RowActions i={i} ctx={ctx} /> },
  ];
  return cols.filter((c): c is TableColumn<Instance> => c !== false);
}

/** Narrow content (< 600px): one divided list, every value on its own line (no truncation). */
function PlatformList({ items, ctx }: { items: Instance[]; ctx: RowCtx }) {
  return (
    <Card padding="none">
      <ul className="divide-y divide-border">
        {items.map((i) => (
          <li key={i.id} className="flex items-start gap-2 px-3 py-2">
            <span className={cn(tileClass('md'), 'mt-0.5')}>
              <Icon icon={KIND[i.kind].icon} size="sm" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-ink">{i.label}</span>
                <StatusCell i={i} ctx={ctx} alerts />
              </span>
              <span className="text-xs text-ink-muted">
                {i.metrics} · synced {i.lastSync.toLowerCase()}
                {i.version ? ` · v${i.version}` : ''}
              </span>
              <span className="text-xs">
                <DataCell i={i} ctx={ctx} />
              </span>
              {ctx.isSetup(i) && ctx.admin && (
                <span>
                  <Button size="sm" variant="secondary" leftIcon={LinkSimple} onClick={() => ctx.onConnect(i.id)}>
                    Finish setup
                  </Button>
                </span>
              )}
            </div>
            <Menu
              align="end"
              trigger={<IconButton icon={DotsThree} label={`Actions for ${i.label}`} variant="subtle" size="sm" />}
              items={rowMenu(i, ctx, true)}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LoadingRows() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading platforms">
      <Skeleton variant="text" width="8rem" />
      <Card padding="none">
        <ul className="divide-y divide-border">
          {[0, 1, 2, 3].map((n) => (
            <li key={n} className="flex h-row items-center gap-3 px-3">
              <Skeleton variant="rect" width={24} height={24} />
              <Skeleton variant="text" width="20%" />
              <Skeleton variant="text" width="15%" />
              <Skeleton variant="text" width="30%" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------ connections view */

interface ConnectionsProps {
  instances: Instance[];
  links: DataLink[];
  byId: Map<string, Instance>;
  admin: boolean;
  onPick: (id: string) => void;
  onUnlink: (l: DataLink) => void;
  onBack: () => void;
  width: number;
}

function ConnectionsView({ instances, links, byId, admin, onPick, onUnlink, onBack, width }: ConnectionsProps) {
  const consumers = instances.filter((i) => i.requires.length > 0);
  const unlinked = consumers.filter((c) => c.requires.some((r) => r.required && !links.some((l) => l.consumerId === c.id && l.capability === r.capability)));
  return (
    <div className={cn('grid grid-cols-1 gap-3', width >= 1000 && 'grid-cols-[minmax(0,1fr)_20rem]')}>
      <Card padding="none" className={cn('min-w-0', width < 600 && 'hidden')}>
        <div className="flex h-row items-center gap-2 border-b border-border px-3">
          <h2 className="text-xs font-semibold text-ink-muted">Data flow</h2>
          <span className="text-xs text-ink-subtle">Branches read from the stock on the right. Select a platform to edit its data.</span>
        </div>
        <ConnectionsGraph instances={instances} links={links} onPick={onPick} />
      </Card>

      <div className="flex min-w-0 flex-col gap-3">
        <Card padding="none">
          <div className="flex h-row items-center gap-2 border-b border-border px-3">
            <h2 className="text-xs font-semibold text-ink-muted">Data links</h2>
            <Badge tone="neutral" size="sm">
              {links.length}
            </Badge>
          </div>
          {links.length === 0 ? (
            <p className="px-3 py-3 text-sm text-ink-subtle">No data links yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {links.map((l) => (
                <li key={l.id} className="flex items-center gap-2 px-3 py-1.5">
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm text-ink">
                      {byId.get(l.providerId)?.label} <span className="text-ink-subtle">to</span> {byId.get(l.consumerId)?.label}
                    </span>
                    <span className="text-xs text-ink-subtle">{capInfo(l.capability).title}</span>
                  </div>
                  {admin && <IconButton icon={LinkBreak} label={`Remove link to ${byId.get(l.consumerId)?.label}`} variant="subtle" size="sm" onClick={() => onUnlink(l)} />}
                </li>
              ))}
            </ul>
          )}
        </Card>
        {unlinked.length > 0 && (
          <Card padding="none">
            <div className="flex h-row items-center gap-2 border-b border-border px-3">
              <h2 className="text-xs font-semibold text-ink-muted">Needs a data source</h2>
              <Badge tone="warning" size="sm">
                {unlinked.length}
              </Badge>
            </div>
            <ul className="divide-y divide-border">
              {unlinked.map((c) => (
                <li key={c.id} className="flex items-center gap-2 px-3 py-1.5">
                  <span className="min-w-0 flex-1 text-sm text-ink">{c.label}</span>
                  <Button size="sm" variant="secondary" leftIcon={LinkSimple} onClick={() => onPick(c.id)}>
                    Connect
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <Button variant="subtle" size="sm" leftIcon={CaretLeft} className="self-start" onClick={onBack}>
          Back to platforms
        </Button>
      </div>
    </div>
  );
}

/* SVG map in one viewBox: consumers left, providers right, one edge per link. No inline styles. */
const VB_W = 720;
const NODE_W = 232;
const NODE_H = 44;
const ROW = 60;
const LEFT_X = 12;
const RIGHT_X = VB_W - NODE_W - 12;

function ConnectionsGraph({ instances, links, onPick }: { instances: Instance[]; links: DataLink[]; onPick: (id: string) => void }) {
  const [hot, setHot] = useState<string | null>(null);
  const consumers = instances.filter((i) => i.requires.length > 0);
  const providers = instances.filter((i) => i.provides.length > 0);
  const rows = Math.max(consumers.length, providers.length, 1);
  const h = rows * ROW + 16;
  const yOf = (idx: number, n: number) => 8 + ((rows - n) * ROW) / 2 + idx * ROW + ROW / 2;
  const cy = new Map(consumers.map((c, idx) => [c.id, yOf(idx, consumers.length)]));
  const py = new Map(providers.map((p, idx) => [p.id, yOf(idx, providers.length)]));

  const node = (i: Instance, x: number, y: number, sub: string) => {
    const s = i.status === 'active' ? 'fill-success' : i.status === 'degraded' ? 'fill-warning' : 'fill-ink-subtle';
    const activate = () => onPick(i.id);
    return (
      <g
        key={i.id}
        role="button"
        tabIndex={0}
        aria-label={`${i.label}, ${KIND[i.kind].label}, ${sub}. Edit data`}
        className={cn('group cursor-pointer outline-none', focusRing)}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
          }
        }}
        onMouseEnter={() => setHot(i.id)}
        onMouseLeave={() => setHot(null)}
        onFocus={() => setHot(i.id)}
        onBlur={() => setHot(null)}
      >
        <rect
          x={x}
          y={y - NODE_H / 2}
          width={NODE_W}
          height={NODE_H}
          rx={6}
          className="fill-surface stroke-border group-hover:fill-surface-subtle group-focus-visible:stroke-primary-600"
          strokeWidth={1}
        />
        <circle cx={x + 14} cy={y - 7} r={4} className={s} />
        <text x={x + 26} y={y - 3} className="fill-ink text-sm font-medium">
          {i.label}
        </text>
        <text x={x + 14} y={y + 14} className="fill-ink-subtle text-xs">
          {i.kind === 'sms' ? 'SMS' : KIND[i.kind].label} · {sub}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${VB_W} ${h}`} className="block h-auto w-full" role="group" aria-label="Connections graph">
      {links.map((l) => {
        const y0 = cy.get(l.consumerId);
        const y1 = py.get(l.providerId);
        if (y0 == null || y1 == null) return null;
        const x0 = LEFT_X + NODE_W;
        const x1 = RIGHT_X;
        const on = hot === l.consumerId || hot === l.providerId;
        const d = `M ${x0} ${y0} C ${x0 + 100} ${y0}, ${x1 - 100} ${y1}, ${x1} ${y1}`;
        return (
          <g key={l.id} aria-hidden="true">
            <path d={d} fill="none" strokeWidth={on ? 2 : 1.25} className={on ? 'stroke-primary-600' : 'stroke-border-strong'} />
            <text x={(x0 + x1) / 2} y={(y0 + y1) / 2 - 6} textAnchor="middle" className={cn('text-xs', on ? 'fill-primary-700' : 'fill-ink-subtle')}>
              {capInfo(l.capability).short}
            </text>
          </g>
        );
      })}
      {consumers.map((c) => {
        const linked = links.some((l) => l.consumerId === c.id);
        return node(c, LEFT_X, cy.get(c.id)!, linked ? 'connected' : 'needs a source');
      })}
      {providers.map((p) => {
        const n = new Set(links.filter((l) => l.providerId === p.id).map((l) => l.consumerId)).size;
        return node(p, RIGHT_X, py.get(p.id)!, n > 0 ? `shared with ${n}` : 'not shared yet');
      })}
    </svg>
  );
}

/* --------------------------------------------------------------- dialogs */

function ConnectDrawer({
  editing,
  byId,
  linkFor,
  consumersOf,
  providersFor,
  setLink,
  onClose,
}: {
  editing: Instance | null;
  byId: Map<string, Instance>;
  linkFor: (consumerId: string, cap: string) => DataLink | null;
  consumersOf: (providerId: string) => DataLink[];
  providersFor: (cap: string) => Instance[];
  setLink: (consumerId: string, cap: string, providerId: string | null) => void;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={editing != null}
      onOpenChange={(o) => !o && onClose()}
      title={editing ? `Connect data: ${editing.label}` : ''}
      description={editing ? `${KIND[editing.kind].label}. Choose where this platform reads and shares data.` : undefined}
      width="24rem"
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {editing && (
        <div className="flex flex-col gap-4 px-4 py-3">
          {editing.requires.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-ink-muted">Reads data from</h3>
              {editing.requires.map((r) => {
                const current = linkFor(editing.id, r.capability);
                const options = providersFor(r.capability);
                return (
                  <div key={r.capability} className="flex flex-col gap-2">
                    <Field
                      label={
                        <span className="flex items-center gap-2">
                          {capInfo(r.capability).title}
                          <Badge tone={r.required ? 'warning' : 'neutral'} size="sm">
                            {r.required ? 'Required' : 'Optional'}
                          </Badge>
                        </span>
                      }
                      hint={`Shares: ${capInfo(r.capability).shares}`}
                    >
                      <Select
                        value={current?.providerId ?? 'none'}
                        onValueChange={(v) => setLink(editing.id, r.capability, v === 'none' ? null : v)}
                        options={[{ value: 'none', label: 'No data source' }, ...options.map((p) => ({ value: p.id, label: p.label }))]}
                      />
                    </Field>
                    {options.length === 0 && <p className="text-xs text-ink-muted">No source available. Add a platform that provides this first.</p>}
                    {r.required && !current && options.length > 0 && (
                      <Notice tone="warning">{capInfo(r.capability).short} features stay hidden until a source is connected.</Notice>
                    )}
                  </div>
                );
              })}
            </section>
          )}
          {editing.provides.length > 0 && (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-ink-muted">Shares data with</h3>
              <div className="divide-y divide-border rounded-base border border-border">
                {editing.provides.map((cap) => {
                  const consumers = consumersOf(editing.id).filter((l) => l.capability === cap);
                  return (
                    <div key={cap} className="flex flex-col gap-1 px-3 py-2">
                      <p className="text-sm font-medium text-ink">{capInfo(cap).title}</p>
                      {consumers.length > 0 ? (
                        <ul className="flex flex-col">
                          {consumers.map((l) => (
                            <li key={l.consumerId} className="flex items-center justify-between gap-2 text-sm text-ink">
                              <span className="flex items-center gap-1">
                                <Icon icon={LinkSimple} size="sm" className="text-primary-600" />
                                {byId.get(l.consumerId)?.label}
                              </span>
                              <IconButton icon={LinkBreak} label={`Remove link to ${byId.get(l.consumerId)?.label}`} variant="subtle" size="sm" onClick={() => setLink(l.consumerId, cap, null)} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-ink-subtle">Not shared with any platform yet.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}

function AddPlatformModal({
  open,
  initialPick,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  initialPick: string | null;
  onOpenChange: (o: boolean) => void;
  onAdd: (entry: CatalogEntry, label: string) => void;
}) {
  const [pickedId, setPickedId] = useState<string | null>(initialPick);
  const [label, setLabel] = useState('');
  const picked = CATALOG.find((c) => c.id === pickedId) ?? null;
  const reset = () => {
    setPickedId(null);
    setLabel('');
  };
  const change = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };
  return (
    <Modal
      open={open}
      onOpenChange={change}
      size={picked ? 'md' : 'xl'}
      title={picked ? `Name your ${picked.name}` : 'Add a platform'}
      description={
        picked ? 'Give this platform a name so you can tell your branches apart.' : 'Connect a platform to your company. Add several of one kind for branches.'
      }
      footer={
        picked ? (
          <>
            <Button variant="secondary" leftIcon={CaretLeft} onClick={reset}>
              Back
            </Button>
            <Button
              leftIcon={Plus}
              onClick={() => {
                onAdd(picked, label);
                reset();
              }}
            >
              Add platform
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => change(false)}>
            Cancel
          </Button>
        )
      }
    >
      {picked ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 rounded-base border border-border p-3">
            <span className={tileClass('md')}>
              <Icon icon={picked.icon} size="sm" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{picked.name}</p>
              <p className="text-xs text-ink-muted">{picked.description}</p>
            </div>
          </div>
          <Field label="Name" hint="A label so you can tell branches apart, for example Makati branch.">
            <Input placeholder={`e.g. ${picked.kind === 'sms' ? 'Makati branch' : 'Central stock'}`} value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          {picked.kind === 'sms' && <Notice tone="info">After adding, you connect its stock source next.</Notice>}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CATALOG.map((m) => (
            <li key={m.id}>
              <Card padding="sm" className="flex h-full items-start gap-2">
                <span className={tileClass('md')}>
                  <Icon icon={m.icon} size="sm" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-ink">
                    {m.name}
                    <span className="text-xs font-normal text-ink-subtle">{m.category}</span>
                    {m.comingSoon && (
                      <Badge tone="neutral" size="sm" className="whitespace-nowrap">
                        Coming soon
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">{m.description}</p>
                  {!m.comingSoon && (
                    <span>
                      <Button size="sm" variant="secondary" leftIcon={Plus} onClick={() => setPickedId(m.id)}>
                        Connect<span className="sr-only"> {m.name}</span>
                      </Button>
                    </span>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function RenameModal({ instance, onCancel, onSave }: { instance: Instance | null; onCancel: () => void; onSave: (label: string) => void }) {
  const [value, setValue] = useState(instance?.label ?? '');
  const [lastId, setLastId] = useState(instance?.id);
  if (instance?.id !== lastId) {
    setLastId(instance?.id);
    setValue(instance?.label ?? '');
  }
  const trimmed = value.trim();
  return (
    <Modal
      open={instance != null}
      onOpenChange={(o) => !o && onCancel()}
      size="sm"
      title="Rename platform"
      description={instance ? `${KIND[instance.kind].label}${instance.host ? ` · ${instance.host}` : ''}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!trimmed} onClick={() => onSave(trimmed)}>
            Save
          </Button>
        </>
      }
    >
      <Field label="Name" required error={trimmed ? undefined : 'Enter a name.'}>
        <Input value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
      </Field>
    </Modal>
  );
}
