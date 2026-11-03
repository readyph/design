import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardText, Gear, List, Plus, UsersThree, Wrench } from '@phosphor-icons/react';
import { AccountMenu } from './AccountMenu';
import { AskLedaBar } from './AskLedaBar';
import { Button } from './Button';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { CountBadge, IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer } from './IconRail';
import { InventoryStatusBar } from './StatusBar';
import { Notice } from './Notice';
import { PlatformShell } from './PlatformShell';
import { Select } from './Select';
import { SheetBar, SheetBarWhere } from './SheetBar';
import { Toaster } from './toast/Toaster';
import { toast } from './toast/toastStore';
import { cn } from '../utils/cn';
import { branch, manager, mechanics } from './sms/data';
import { CATEGORIES, STRESS_ROWS, saveType, setActive, useCatalogue, type ServiceType } from './sms/catalogue';
import { CatalogueTable } from './CatalogueTable';
import { InfiniteSentinel, ListEnd, ResultCount } from './InfiniteList';
import { ServiceTypeForm } from './ServiceTypeForm';
import { SearchBox, ToggleChip } from './ServicesControls';

export interface ServicesPricesProps {
  /** `loading`: skeleton rows. `empty`: the shop has not set up any services yet. */
  state?: 'ready' | 'loading' | 'empty';
  /** The manager edits prices; a mechanic only reads them. */
  role?: 'manager' | 'mechanic';
  initialQuery?: string;
  initialCategory?: string;
  initialShowInactive?: boolean;
  /** Story helper: open the form on load: `new` or a service id. */
  initialForm?: 'new' | string | null;
  /** Story helper: open the Deactivate / Activate confirm for this service id. */
  initialAsk?: string | null;
  /** Story helper: add a very long name, long description and many linked parts to the list (display only). */
  stress?: boolean;
  /** Inside the Settings shell: render only the section (no frame, no side menu, no Toaster); the shell supplies them. */
  embedded?: boolean;
}

const PAGE = 15;
const SIDE = [{ id: 'services', label: 'Services & prices', live: true }, { id: 'shop', label: 'Shop details', live: false }, { id: 'team', label: 'Team', live: false }];

/**
 * v2 Shop floor, Settings > Services & prices (NEW page): the shop's service catalogue. One ruled table (search, category, show inactive),
 * Add service; the whole row opens the edit modal; a three-dot menu has Edit and Deactivate / Activate (confirm, then Undo). Services can link Inventory parts. Rail: Today, Services, Customers, Settings. Phone: the same list as cards, form full screen.
 * Sample data to replace: the catalogue is invented (the API has no services list yet), see rationale.
 */
export function ServicesPricesPage({ state = 'ready', role = 'manager', initialQuery = '', initialCategory = 'any', initialShowInactive = false, initialForm = null, initialAsk = null, stress = false, embedded = false }: ServicesPricesProps) {
  const catalogue = useCatalogue();
  const [q, setQ] = useState(initialQuery);
  const [cat, setCat] = useState(initialCategory);
  const [inactive, setInactive] = useState(initialShowInactive);
  const [count, setCount] = useState(PAGE);
  const [more, setMore] = useState(false);
  const [form, setForm] = useState<'new' | string | null>(initialForm);
  const [ask, setAsk] = useState<string | null>(initialAsk);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const canEdit = role === 'manager';
  const loading = state === 'loading';
  const source = state === 'empty' ? [] : stress ? [...STRESS_ROWS, ...catalogue] : catalogue;

  const rows = useMemo(() => source.filter((t) => (inactive || t.active) && (cat === 'any' || t.category === cat) && `${t.name} ${t.category} ${t.description ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())), [source, inactive, cat, q]);
  const page = rows.slice(0, count);
  const reset = () => { window.clearTimeout(timer.current); setMore(false); setCount(PAGE); };
  const loadMore = () => { if (more || page.length >= rows.length) return; setMore(true); timer.current = window.setTimeout(() => { setCount((c) => c + PAGE); setMore(false); }, 500); };
  const editing = form && form !== 'new' ? source.find((t) => t.id === form) ?? null : null;
  const filtered = !!q.trim() || cat !== 'any';

  const save = (t: ServiceType) => {
    const isNew = !catalogue.some((x) => x.id === t.id);
    const before = catalogue.find((x) => x.id === t.id);
    saveType(t); setForm(null);
    toast.undo(isNew ? `${t.name} added to your services.` : `${t.name} saved.`, () => { if (before) saveType(before); else setActive(t.id, false); });
  };
  const asked = ask ? catalogue.find((t) => t.id === ask) ?? null : null;
  const toggle = (t: ServiceType) => {
    setForm(null);
    setActive(t.id, !t.active);
    toast.undo(t.active ? `${t.name} is inactive. It no longer shows when you pick services; past jobs keep it.` : `${t.name} is active again.`, () => setActive(t.id, t.active));
  };

  const rail = (
    <IconRailContent>
      <IconRailMark href="#portal" label="Back to the ReadyPH Portal" />
      <IconRailItem icon={Wrench} label="Today" href="#today" />
      <IconRailItem icon={ClipboardText} label="Services" href="#services" />
      <IconRailItem icon={UsersThree} label="Customers" href="#customers" />
      <IconRailItem icon={Gear} label="Settings" href="#settings" current />
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={role === 'manager' ? manager.name : mechanics[0]!.name} email="mon@delacruzauto.example" role={role === 'manager' ? 'Branch manager' : 'Mechanic'} initials={role === 'manager' ? manager.initials : mechanics[0]!.initials} applyToDocument={false} /></IconRailFoot>
    </IconRailContent>
  );
  const navTab = 'relative flex min-h-11 flex-col items-center justify-center gap-[3px] text-tiny text-muted';
  const phoneNav = (
    <div className="grid h-[60px] w-full grid-cols-5 items-stretch">
      <a href="#today" className={navTab}><Wrench size={20} aria-hidden />Today<CountBadge count={0} placement="tab" /></a>
      <a href="#services" className={navTab}><ClipboardText size={20} aria-hidden />Services</a>
      <a href="#customers" className={navTab}><UsersThree size={20} aria-hidden />Customers</a>
      <a href="#settings" aria-current="page" className={cn(navTab, 'font-medium text-text')}><Gear size={20} aria-hidden />Settings</a>
      <button type="button" className={navTab}><List size={20} aria-hidden />More</button>
    </div>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 max-[640px]:px-4">
      <SearchBox value={q} onChange={(v) => { setQ(v); reset(); }} label="Search services" placeholder="Search services" className="w-[320px] max-w-full flex-1 min-[641px]:flex-none" />
      <Select size="sm" aria-label="Category" className="w-[190px] max-[640px]:w-full" value={cat} onValueChange={(v) => { setCat(v); reset(); }} options={[{ value: 'any', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
      <ToggleChip pressed={inactive} onChange={(v) => { setInactive(v); reset(); }}>Show inactive</ToggleChip>
    </div>
  );

  const emptyBlock = state === 'empty' ? (
    <EmptyState title="No services yet" description="Add the services your shop sells, with a price and how long each takes. They appear when you start a new service." action={canEdit ? <Button variant="primary" leftIcon={Plus} onClick={() => setForm('new')}>Add a service</Button> : undefined} />
  ) : rows.length === 0 && !loading ? (
    <EmptyState title={q.trim() ? `No service matches "${q.trim()}"` : 'No services in this category'} description={q.trim() ? 'Check the spelling, or clear the search. If your shop offers it, add it now.' : 'Pick another category, or add a service.'}
      action={<span className="flex flex-wrap justify-center gap-2"><Button variant="secondary" onClick={() => { setQ(''); setCat('any'); reset(); }}>Clear search</Button>{canEdit && q.trim() && <Button variant="primary" leftIcon={Plus} onClick={() => setForm('new')}>Add a service</Button>}</span>} />
  ) : null;

  const content = (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex flex-none flex-wrap items-start justify-between gap-3 px-6 pb-1 pt-5 max-[640px]:px-4">
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold">Services &amp; prices</h2>
          <p className="mt-0.5 max-w-xl text-[13px] text-muted">What your shop sells. Managers set the price here; each job starts at it and can be changed on the job. Mechanics can see prices but not change them.</p>
        </div>
        {canEdit && state !== 'empty' && <Button variant="primary" leftIcon={Plus} onClick={() => setForm('new')} className="max-[640px]:w-full max-[640px]:min-h-11">Add service</Button>}
      </div>
      {!canEdit && <div className="px-6 pt-3 max-[640px]:px-4"><Notice tone="info" title="View only">Only the branch manager can change services and prices. Ask {manager.short} to add or update one.</Notice></div>}
      {state !== 'empty' && toolbar}
      <div className="min-h-0 flex-1 overflow-auto px-2 max-[640px]:px-4">
        {emptyBlock ?? (
          <>
            <CatalogueTable rows={page} canEdit={canEdit} onEdit={(t) => setForm(t.id)} onToggle={(t) => setAsk(t.id)} loading={loading} loadingMore={more} />
            {!loading && <InfiniteSentinel hasMore={page.length < rows.length} loading={more} onLoadMore={loadMore} />}
            {!loading && page.length >= rows.length && rows.length > 0 && <ListEnd total={rows.length} noun="services" />}
          </>
        )}
      </div>
      {!emptyBlock && !loading && <ResultCount shown={page.length} total={rows.length} loadingMore={more} noun={filtered ? 'matching services' : 'services'} />}
    </div>
  );

  const side = (
    <nav aria-label="Settings" className="w-[220px] flex-none border-r border-rule py-4 max-[640px]:hidden">
      <p className="px-5 pb-2 text-[12px] font-medium text-muted">Settings</p>
      <ul>
        {SIDE.map((s) => (
          <li key={s.id}>
            {s.live
              ? <a href="#settings/services" aria-current="page" className="flex min-h-10 items-center border-l-2 border-accent bg-raised px-5 text-[14px] font-semibold text-text">{s.label}</a>
              : <span aria-disabled="true" className="flex min-h-10 items-center justify-between border-l-2 border-transparent px-5 text-[14px] text-faint">{s.label}<span className="text-[11px]">Soon</span></span>}
          </li>
        ))}
      </ul>
    </nav>
  );

  const platform = { name: branch.name, initials: 'DC' };
  const overlays = (
    <>
      {form && canEdit && (form === 'new' || editing) && <ServiceTypeForm key={form} type={editing} onSave={save} onClose={() => setForm(null)} onToggleActive={editing ? (t) => setAsk(t.id) : undefined} />}
      {asked && (
        <ConfirmDialog open onOpenChange={(o) => !o && setAsk(null)} title={asked.active ? `Deactivate ${asked.name}?` : `Reactivate ${asked.name}?`}
          description={asked.active ? 'It will no longer show when you pick services for a new job. Existing quotes, bookings and past jobs keep the service and its price. You can reactivate it any time.' : 'It will show again when you pick services for a new job.'}
          confirmLabel={asked.active ? 'Deactivate' : 'Reactivate'} cancelLabel="Keep as is" tone={asked.active ? 'danger' : 'primary'}
          onCancel={() => setAsk(null)} onConfirm={() => { const t = asked; setAsk(null); toggle(t); }} />
      )}
    </>
  );
  if (embedded) return <>{content}{overlays}</>;
  return (
    <>
      <PlatformShell
        railWidth="wide" railLabel="Shop" rail={rail}
        topBar={<>
          <span className="flex-none whitespace-nowrap text-[15px] font-semibold">Services &amp; prices</span>
          <span className="min-w-0 truncate text-[13px] text-muted">· Settings</span>
          <span className="flex-1" />
          <span className="contents [&>button]:size-11"><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></span>
        </>}
        phoneNav={phoneNav}
        heading="Settings"
        hideSheetBarOnPhone
        sheetBar={<SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope="Settings" paused onOpen={() => undefined} />}><SheetBarWhere platform={platform} page="Settings" /></SheetBar>}
        statusLabel="Status"
        status={<InventoryStatusBar platform={platform} dataLink={{ with: branch.inventory.platform, status: 'linked', since: '10:18' }} viewer={{ name: canEdit ? 'Mon' : 'Jun', role: canEdit ? 'Branch manager' : 'Mechanic' }} leda={{ canDecide: canEdit, managerName: 'Mon' }} updatedAt="10:20" />}
      >
        <div className="flex h-full min-h-0">{side}{content}</div>
      </PlatformShell>
      {overlays}
      <Toaster />
    </>
  );
}
