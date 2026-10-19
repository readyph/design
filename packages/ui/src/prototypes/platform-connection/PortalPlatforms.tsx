import { useState } from 'react';
import { ArrowSquareOut, LinkSimple, Package, Plus, Wrench } from '@phosphor-icons/react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { StatusDot } from '../../components/StatusDot';
import { toast } from '../../components/toast/toastStore';
import { Page, RetryNotice } from '../repair-shop/Page';
import { AddPlatformModal, ConnShell } from './ConnShell';
import { HANDOFF_OPENING, PLATFORMS, type DemoPlatform } from './data';
import { LinkButton } from './LinkButton';

export type Launch = 'idle' | 'unreachable';
export type PlatformsState = 'default' | 'loading' | 'empty' | 'error';

const STATUS_LABEL = { active: 'Active', degraded: 'Degraded', offline: 'Offline' } as const;

/** Open is a real link to the handoff page (the opening state), which then lands in the app. */
function PlatformCard({ p, launch, onConnect }: { p: DemoPlatform; launch: Launch; onConnect: (p: DemoPlatform) => void }) {
  const repair = p.kind === 'repair_shop';
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-muted text-ink"><Icon icon={p.kind === 'inventory' ? Package : Wrench} size="md" /></span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{p.label}</span>
            <span className="flex items-center gap-1 text-xs text-ink-muted"><StatusDot status={p.status} /> {p.setupNeeded ? 'Setup needed' : STATUS_LABEL[p.status]}</span>
          </div>
          <p className="text-sm">{p.setupNeeded ? 'No data source linked yet' : p.metric}</p>
          <p className="text-xs text-ink-muted">{p.kind === 'inventory' ? 'Inventory' : 'Repair shop'} - {p.appUrl}</p>
        </div>
      </div>
      {launch === 'unreachable' && <Notice tone="error" title={`Couldn't open ${p.label}`}>The app didn't respond. Try again in a moment.</Notice>}
      <div className="flex items-center gap-2">
        {p.setupNeeded
          ? <Button size="sm" leftIcon={LinkSimple} onClick={() => onConnect(p)}>Finish setup</Button>
          : <LinkButton size="sm" href={HANDOFF_OPENING} leftIcon={ArrowSquareOut}>{launch === 'unreachable' ? 'Try again' : 'Open'}</LinkButton>}
        {repair && !p.setupNeeded && <Button size="sm" variant="secondary" className="border-border-strong bg-surface" leftIcon={LinkSimple} onClick={() => onConnect(p)}>Connect data</Button>}
      </div>
    </Card>
  );
}

/** Connect data panel: pick which Inventory feeds the clicked Repair shop branch. */
export function ConnectDataModal({ open, onOpenChange, platform }: { open: boolean; onOpenChange: (o: boolean) => void; platform: DemoPlatform }) {
  const [src, setSrc] = useState(platform.setupNeeded ? 'none' : 'inv');
  const done = () => {
    onOpenChange(false);
    toast.success(src === 'none' ? `${platform.label} no longer reads from an Inventory.` : `${platform.label} now reads from Main inventory.`);
  };
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Connect data to ${platform.label}`} description="Choose the Inventory this branch reads stock and catalog from."
      footer={<><Button variant="subtle" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={src === 'none' && Boolean(platform.setupNeeded)} onClick={done}>Connect</Button></>}>
      <Field label="Data source" hint="You can change or remove the link later.">
        <Select value={src} onValueChange={setSrc} options={[{ value: 'none', label: 'No data source' }, { value: 'inv', label: 'Main inventory - 214 products' }]} />
      </Field>
    </Modal>
  );
}

export function PlatformsPage({ state = 'default', launch = 'idle', connectOpen = false }: { state?: PlatformsState; launch?: Launch; connectOpen?: boolean }) {
  const [connect, setConnect] = useState<DemoPlatform | null>(connectOpen ? PLATFORMS.find((p) => p.setupNeeded) ?? null : null);
  const [last, setLast] = useState<DemoPlatform>(PLATFORMS.find((p) => p.setupNeeded) ?? PLATFORMS[1]);
  const [add, setAdd] = useState(false);
  const pick = (p: DemoPlatform) => { setLast(p); setConnect(p); };
  const addButton = <Button leftIcon={Plus} onClick={() => setAdd(true)}>Add platform</Button>;
  return (
    <ConnShell app="portal" activeKey="platforms" title={<span className="text-sm font-semibold">Connected platforms</span>} onAddPlatform={() => setAdd(true)}>
      <Page>
        <PageHeader title="Connected platforms" description={state === 'default' ? '3 platforms - 2 branches - 1 data link' : undefined} actions={addButton} />
        {state === 'loading' && <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Skeleton height={150} /><Skeleton height={150} /></div>}
        {state === 'error' && <RetryNotice title="Couldn't load your platforms">Check your connection and try again.</RetryNotice>}
        {state === 'empty' && <EmptyState icon={Package} title="No platforms yet" description="Add Inventory or a Repair shop branch to start." action={addButton} />}
        {state === 'default' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PLATFORMS.map((p) => <PlatformCard key={p.id} p={p} launch={p.id === 'rs-dvo' ? launch : 'idle'} onConnect={pick} />)}
          </div>
        )}
        <ConnectDataModal key={last.id} open={connect !== null} onOpenChange={(o) => !o && setConnect(null)} platform={connect ?? last} />
        <AddPlatformModal open={add} onOpenChange={setAdd} />
      </Page>
    </ConnShell>
  );
}
