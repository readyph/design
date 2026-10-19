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
import { ConnShell } from './ConnShell';
import { PLATFORMS, type DemoPlatform } from './data';

export type Launch = 'idle' | 'opening' | 'unreachable';
export type PlatformsState = 'default' | 'loading' | 'empty' | 'error';

const STATUS_LABEL = { active: 'Active', degraded: 'Degraded', offline: 'Offline' } as const;

function PlatformCard({ p, launch, onOpen, onConnect }: { p: DemoPlatform; launch: Launch; onOpen: () => void; onConnect: () => void }) {
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
          <p className="text-xs text-ink-subtle">{p.kind === 'inventory' ? 'Inventory' : 'Repair shop'} - {p.appUrl}</p>
        </div>
      </div>
      {launch === 'unreachable' && <Notice tone="error" title={`Couldn't open ${p.label}`}>The app didn't respond. Try again in a moment.</Notice>}
      <div className="flex items-center gap-2">
        {p.setupNeeded
          ? <Button size="sm" leftIcon={LinkSimple} onClick={onConnect}>Finish setup</Button>
          : <Button size="sm" leftIcon={ArrowSquareOut} loading={launch === 'opening'} onClick={onOpen}>{launch === 'opening' ? 'Opening' : launch === 'unreachable' ? 'Try again' : 'Open'}</Button>}
        {!p.setupNeeded && <Button size="sm" variant="secondary" leftIcon={LinkSimple} onClick={onConnect}>Connect data</Button>}
      </div>
    </Card>
  );
}

/** Connect data panel: pick which Inventory feeds a platform. Finish setup and Connect data both open it. */
export function ConnectDataModal({ open, onOpenChange, platform }: { open: boolean; onOpenChange: (o: boolean) => void; platform: DemoPlatform }) {
  const [src, setSrc] = useState('inv');
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Connect data to ${platform.label}`} description="Choose the Inventory this platform reads stock and catalog from."
      footer={<><Button variant="subtle" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onOpenChange(false); toast.success(`${platform.label} now reads from Main inventory.`); }}>Connect</Button></>}>
      <Field label="Data source" hint="You can change or remove the link later.">
        <Select value={src} onValueChange={setSrc} options={[{ value: 'inv', label: 'Main inventory - 214 products' }]} />
      </Field>
    </Modal>
  );
}

export function PlatformsPage({ state = 'default', launch = 'idle', connectOpen = false }: { state?: PlatformsState; launch?: Launch; connectOpen?: boolean }) {
  const [l, setL] = useState<Launch>(launch);
  const [connect, setConnect] = useState(connectOpen);
  const target = PLATFORMS.find((p) => p.setupNeeded) ?? PLATFORMS[0];
  const open = () => { setL('opening'); window.setTimeout(() => setL('idle'), 1500); };
  return (
    <ConnShell app="portal" activeKey="platforms" title={<span className="text-sm font-semibold">Connected platforms</span>}>
      <Page>
        <PageHeader title="Connected platforms" description={state === 'default' ? '3 platforms - 2 branches - 1 data link' : undefined} actions={<Button leftIcon={Plus}>Add platform</Button>} />
        {state === 'loading' && <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Skeleton height={150} /><Skeleton height={150} /></div>}
        {state === 'error' && <RetryNotice title="Couldn't load your platforms">Check your connection and try again.</RetryNotice>}
        {state === 'empty' && <EmptyState icon={Package} title="No platforms yet" description="Add Inventory or a Repair shop branch to start." action={<Button leftIcon={Plus}>Add platform</Button>} />}
        {state === 'default' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PLATFORMS.map((p) => <PlatformCard key={p.id} p={p} launch={p.id === 'rs-dvo' ? l : 'idle'} onOpen={open} onConnect={() => setConnect(true)} />)}
          </div>
        )}
        <ConnectDataModal open={connect} onOpenChange={setConnect} platform={target} />
      </Page>
    </ConnShell>
  );
}
