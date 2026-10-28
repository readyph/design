import type { ReactNode } from 'react';
import { ArrowsDownUp, FileText, House, List, ListChecks, Package, Receipt, SlidersHorizontal } from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { AccountMenu } from '../components/AccountMenu';
import { AskLedaBar } from '../components/AskLedaBar';
import { CountBadge, IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer } from '../components/IconRail';
import { PlatformShell } from '../components/PlatformShell';
import { cn } from '../utils/cn';
import { PRODUCTS, type ProductsRole, type ProductsTenant } from './Products.data';

/* RDY-404. The Inventory frame (I23) around the page, same as MySettings.page.tsx (products.html 31-52). */
const NAV: { id: string; label: string; short?: string; icon: PhosphorIcon; needs?: string; soon?: boolean }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'pos', label: 'Purchase orders', short: 'Orders', icon: Receipt },
  { id: 'moves', label: 'Movements', icon: ArrowsDownUp },
  { id: 'reports', label: 'Reports', icon: FileText, soon: true },
  { id: 'setup', label: 'Setup', icon: SlidersHorizontal, needs: 'setup', soon: true },
];

export function InventoryChrome({ tenant, as, nav, page, sheetBar, status, lists, onAsk, onLists, ledaActive, children }: { tenant: ProductsTenant; as: ProductsRole; nav: string; page: string; sheetBar: ReactNode; status: ReactNode; lists: number; onAsk?: () => void; onLists?: () => void; ledaActive?: boolean; children: ReactNode }) {
  const D = PRODUCTS[tenant], V = D.viewers[as].viewer, roleLabel = D.viewers[as].roleLabel;
  const canSetup = D.viewers[as].can.includes('setup');
  const items = NAV.filter((n) => !n.needs || canSetup);
  const acct = <AccountMenu name={V.name} email={`${V.short.toLowerCase().replace(/\s/g, '.')}@${tenant === 'a' ? 'delacruzauto.ph' : 'brewandbutter.ph'}`} role={roleLabel} initials={V.initials} applyToDocument={false} />;
  const rail = (
    <IconRailContent>
      <IconRailMark variant="letter" href="#portal" label="Back to the ReadyPH Portal" animate={false} />
      {items.map((n) => (n.soon ? <IconRailItem key={n.id} icon={n.icon} label={n.label} onClick={() => undefined} /> : <IconRailItem key={n.id} icon={n.icon} label={n.label} href={`#${n.id}`} current={n.id === nav} />))}
      <IconRailSpacer />
      <IconRailFoot>{acct}</IconRailFoot>
    </IconRailContent>
  );
  const tab = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch">
      {items.slice(0, 4).map((n) => (
        <a key={n.id} href={`#${n.id}`} aria-current={n.id === nav ? 'page' : undefined} className={cn(tab, n.id === nav && 'font-medium text-text')}>
          <n.icon size={20} aria-hidden />{n.short ?? n.label}{n.id === 'pos' && <CountBadge count={2} placement="tab" />}
        </a>
      ))}
      <button type="button" className={tab}><List size={20} aria-hidden />More</button>
    </div>
  );
  const topBar = (
    <>
      <span className="flex-none whitespace-nowrap text-[15px] font-semibold">{D.business.platform}</span>
      <span className="min-w-0 truncate text-[13px] text-muted max-[480px]:hidden">{page ? `· ${page}` : ''}</span>
      <span className="flex-1" />
      <button type="button" onClick={onLists} aria-haspopup="dialog" className="relative inline-flex h-9 flex-none items-center gap-1.5 rounded-control border border-control px-2.5 text-[13px] font-semibold text-text"><ListChecks size={18} aria-hidden />Order lists<span className="h-4 min-w-4 rounded-[3px] bg-text px-1 text-center text-tiny font-medium leading-4 text-surface">{lists}</span></button>
      <AskLedaBar variant="bar" scope={page || 'Products'} shortcuts={false} paused={ledaActive} onOpen={onAsk} />
      <span className="contents [&>button]:size-11">{acct}</span>
    </>
  );
  return (
    <PlatformShell railWidth="wide" railLabel="Inventory" rail={rail} topBar={topBar} phoneNav={phoneNav} heading={D.business.platform} hideSheetBarOnPhone sheetBar={sheetBar} statusLabel="Status" status={status}>
      {children}
    </PlatformShell>
  );
}
