import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ArrowsDownUp, FileText, House, ListChecks, List, Package, Receipt, SlidersHorizontal } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { PlatformShell } from './PlatformShell';
import { IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer, CountBadge } from './IconRail';
import { SheetBar, SheetBarWhere } from './SheetBar';
import { InventoryStatusBar } from './StatusBar';
import { AskLedaBar } from './AskLedaBar';
import { AccountMenu } from './AccountMenu';
import { cn } from '../utils/cn';

/**
 * RDY-382 I23. Transcribed from inventory-home FINAL (round-1/final) shell.css 79-97, 315-328, 351-389, 645-649; shell.js 104-111, 128-136; cart.css 80-87, 116;
 * home.html 28-45; handover 2.0 and 5.1 I23. No place column (`--place: 0px`): rail | sheet over the status bar. The rail is 64px from 641px up (`railWidth="wide"`).
 */
const meta: Meta<typeof PlatformShell> = {
  title: 'Components/Layout/Inventory frame',
  component: PlatformShell,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof PlatformShell>;

const NAV: { id: string; label: string; short?: string; icon: PhosphorIcon; needs?: string; soon?: boolean }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'pos', label: 'Purchase orders', short: 'Orders', icon: Receipt },
  { id: 'moves', label: 'Movements', icon: ArrowsDownUp },
  { id: 'reports', label: 'Reports', icon: FileText, soon: true },
  { id: 'setup', label: 'Setup', icon: SlidersHorizontal, needs: 'setup', soon: true },
];

const platform = { name: 'Parts Stockroom', initials: 'PS' };
const account = { name: 'Maria Santos', email: 'maria@santosauto.ph', role: 'Manager' };

interface FrameOpts {
  page?: string;
  canSetup?: boolean;
  poCount?: number;
  slow?: boolean;
  noLink?: boolean;
  canDecide?: boolean;
  loading?: boolean;
  viewer?: { name: string; role: string };
  detail?: boolean;
}

function Frame({ page = 'home', canSetup = true, poCount = 2, slow, noLink, canDecide = true, loading, viewer = { name: 'Maria', role: 'Manager' }, detail }: FrameOpts) {
  const [msg, setMsg] = useState('');
  const items = NAV.filter((n) => !n.needs || canSetup);
  const comingNext = (label: string) => () => setMsg(`${label} is coming next.`);
  const label = NAV.find((n) => n.id === page)?.label ?? 'Home';
  const rail = (
    <IconRailContent>
      <IconRailMark variant="letter" href="#portal" label="Back to the ReadyPH Portal" animate={false} />
      {items.map((n) => (n.soon
        ? <IconRailItem key={n.id} icon={n.icon} label={n.label} onClick={comingNext(n.label)} />
        : <IconRailItem key={n.id} icon={n.icon} label={n.label} href={`#${n.id}`} current={n.id === page} />))}
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={account.name} email={account.email} role={account.role} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const tab = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch">
      {items.slice(0, 4).map((n) => (
        <a key={n.id} href={`#${n.id}`} aria-current={n.id === page ? 'page' : undefined} className={cn(tab, n.id === page && 'font-medium text-text')}>
          <n.icon size={20} aria-hidden />
          {n.short ?? n.label}
          {n.id === 'pos' && <CountBadge count={poCount} placement="tab" />}
        </a>
      ))}
      <button type="button" className={tab} onClick={comingNext('More')}><List size={20} aria-hidden />More</button>
    </div>
  );
  const topBar = (
    <>
      <span className="flex-none whitespace-nowrap text-[15px] font-semibold">{platform.name}</span>
      <span className="min-w-0 truncate text-[13px] text-muted max-[480px]:hidden">· {label}</span>
      <span className="flex-1" />
      <button type="button" className="relative inline-flex h-9 flex-none items-center gap-1.5 rounded-control border border-control px-2.5 text-[13px] font-semibold text-text">
        <ListChecks size={18} aria-hidden />Order lists
        <span className="h-4 min-w-4 rounded-[3px] bg-text px-1 text-center text-tiny font-medium leading-4 text-surface">{poCount}</span>
      </button>
      <AskLedaBar variant="bar" scope={label} shortcuts={false} />
      <span className="contents [&>button]:size-11"><AccountMenu name={account.name} email={account.email} role={account.role} applyToDocument={false} /></span>
    </>
  );
  return (
    <>
      <PlatformShell
        railWidth="wide"
        railLabel="Inventory"
        rail={rail}
        topBar={topBar}
        phoneNav={phoneNav}
        detail={detail}
        heading={platform.name}
        hideSheetBarOnPhone
        sheetBar={<SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope={label} shortcuts={false} />}><SheetBarWhere platform={platform} page={label} note={viewer.role !== 'Manager' ? `Viewing as ${viewer.name}, ${viewer.role.toLowerCase()}` : undefined} /></SheetBar>}
        actionBar={detail ? <><button type="button" className="rounded-control border border-control">Back</button><button type="button" className="rounded-control bg-accent text-surface">Confirm</button></> : undefined}
        statusLabel="Status"
        status={
          <InventoryStatusBar
            platform={platform}
            dataLink={noLink ? undefined : { with: 'Dela Cruz Auto Works', status: slow ? 'slow' : 'linked', since: '8:50', title: 'Parts and job orders' }}
            viewer={viewer}
            leda={{ canDecide, managerName: 'Maria' }}
            updatedAt="9:12 AM"
            lastLoadedAt={loading ? '9:10 AM' : undefined}
          />
        }
      >
        <div className="p-pad text-ui text-muted">{page} sheet{msg ? <p role="status" className="mt-2">{msg}</p> : null}</div>
      </PlatformShell>
    </>
  );
}

/** Desktop 1440 x 768: 64px rail, no place column, tenant A with the data link. */
export const Desktop: Story = { render: () => <Frame /> };
/** Rail without Setup (viewer lacks `setup`), non-manager viewer: Leda drafts for the manager. */
export const Stocker: Story = { render: () => <Frame canSetup={false} canDecide={false} viewer={{ name: 'Ben', role: 'Stocker' }} page="products" /> };
/** Data link slow ("Slow since 8:50", warn dot). */
export const LinkSlow: Story = { render: () => <Frame slow /> };
/** Tenant B: no data link. */
export const NoLink: Story = { render: () => <Frame noLink /> };
/** Loading: "Loading… last loaded 9:10 AM". */
export const Loading: Story = { render: () => <Frame loading /> };
/** 1000px: viewer hidden under 1180, sheet bar wraps with Ask Leda on the right. */
export const Tablet: Story = { render: () => <Frame />, parameters: { viewport: { defaultViewport: 'tablet' } } };
/** Phone 390: 48px top bar, bottom nav with Orders count and More. */
export const Phone: Story = { render: () => <Frame />, parameters: { viewport: { defaultViewport: 'mobile1' } } };
/** Phone detail: top bar and bottom nav hidden, sticky action bar. */
export const PhoneDetail: Story = { render: () => <Frame detail />, parameters: { viewport: { defaultViewport: 'mobile1' } } };
