import { useEffect, useRef, useState } from 'react';
import { Bell, ClipboardText, Gear, List, Storefront, Tag, UsersThree, Wrench } from '@phosphor-icons/react';
import {
  AccountMenu, AskLedaBar, Breadcrumbs, CountBadge, IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer, InventoryStatusBar,
  PlatformShell, SheetBar, SheetBarWhere, Toaster, cn, toast,
} from '../../index';
import { branch, manager } from './data';
import { ServicesPricesPage, type ServicesPricesProps } from './ServicesPrices.page';
import { NotificationsSection } from './ext/NotificationsSection';
import { SaveBar } from './ext/SettingsFields';
import { SettingsNav, type SettingsSection } from './ext/SettingsNav';
import { ShopDetailsSection } from './ext/ShopDetailsSection';
import { TeamSection } from './ext/TeamSection';
import { useDirtyGuard } from './ext/DirtyGuard';
import {
  LONG_SHOP, LONG_STAFF, LONG_TEMPLATES, NEW_SHOP, SAMPLE_LOGO, SEED_PREFS, SEED_SHOP, SEED_TEMPLATES, STRESS_STAFF, errorCount, prefKey, setShopLogo, setStaff, useStaff, validateShop,
  type NotifPrefs, type ShopDetails, type Staff, type Template,
} from './settingsModel';

export type SettingsSectionId = 'shop' | 'team' | 'services' | 'notifications';
export interface SettingsProps {
  initialSection?: SettingsSectionId;
  /** Which data the shop starts with. `new` = a brand-new shop (blank details, no logo, empty team); `stress` = 40 staff; `long` = very long names and texts; `logo` = default data with an uploaded logo. */
  data?: 'default' | 'new' | 'stress' | 'long' | 'logo';
  /** Save-bar state of the section on load: saved (clean), dirty (edited, not saved) or invalid (edited with errors showing). */
  initialState?: 'saved' | 'dirty' | 'invalid';
  /** Story helper: open an overlay on load. `unsaved` asks "Discard your changes?" for a pending move to Team. */
  initialOverlay?: 'none' | 'edit-staff' | 'add-staff' | 'template' | 'unsaved';
  /** Phone only: open the section already (skip the menu list). */
  initialPushed?: boolean;
  /** Force the phone composition (tests); undefined = follow the window (max-width 640px). */
  phone?: boolean;
  /** Passed to the embedded Services & prices page (its own story helpers). */
  servicesProps?: Omit<ServicesPricesProps, 'embedded'>;
}

const SECTIONS: SettingsSection<SettingsSectionId>[] = [
  { id: 'shop', label: 'Shop details', hint: 'Name, address, logo, opening hours', icon: Storefront },
  { id: 'team', label: 'Team', hint: 'Staff, roles and shifts', icon: UsersThree },
  { id: 'services', label: 'Services & prices', hint: 'What you sell and what it costs', icon: Tag },
  { id: 'notifications', label: 'Notifications', hint: 'Who is told, and customer texts', icon: Bell },
];
const INTRO: Partial<Record<SettingsSectionId, string>> = {
  shop: 'Your business name, contact, logo and when the shop is open. These appear on receipts, quotations and the mechanic app.',
  notifications: 'Who is told when something happens, and the texts your customers receive.',
};

function usePhone(force?: boolean) {
  const q = '(max-width: 640px)';
  const [m, setM] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches);
  useEffect(() => {
    if (force !== undefined || !window.matchMedia) return;
    const mq = window.matchMedia(q); const f = () => setM(mq.matches);
    f(); mq.addEventListener?.('change', f); return () => mq.removeEventListener?.('change', f);
  }, [force]);
  return force ?? m;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * v2 Shop floor, Settings (shell, F40): a left section menu (Shop details, Team, Services & prices, Notifications). Shop details and Notifications are flat forms with
 * a sticky Save / Discard bar while dirty; leaving with unsaved changes asks first (DirtyGuard). Team and Services & prices save per modal.
 * Phone: the menu is the first screen, a section is pushed with a back breadcrumb. Services & prices embeds the existing catalogue page unchanged.
 * Sample data to replace: all of it is invented (no settings API yet), see rationale.
 */
export function SettingsPage({ initialSection = 'shop', data = 'default', initialState = 'saved', initialOverlay = 'none', initialPushed = false, phone: forcePhone, servicesProps }: SettingsProps) {
  const seedShop: ShopDetails = data === 'new' ? NEW_SHOP : data === 'long' ? LONG_SHOP : data === 'logo' ? { ...SEED_SHOP, logo: SAMPLE_LOGO } : SEED_SHOP;
  const isPhone = usePhone(forcePhone);
  const startSection: SettingsSectionId = initialOverlay === 'edit-staff' || initialOverlay === 'add-staff' ? 'team' : initialOverlay === 'template' ? 'notifications' : initialSection;

  const [section, setSection] = useState<SettingsSectionId>(startSection);
  const [pushed, setPushed] = useState(initialPushed || initialOverlay !== 'none');
  const [saved, setSaved] = useState<ShopDetails>(seedShop);
  const [draft, setDraft] = useState<ShopDetails>(() => initialState === 'dirty' && startSection === 'shop' ? { ...seedShop, business: `${seedShop.business || 'Dela Cruz Auto Works'} Kapitolyo` } : initialState === 'invalid' && startSection === 'shop' ? { ...seedShop, business: '', phone: '0917 55' } : seedShop);
  const [tried, setTried] = useState(initialState === 'invalid');
  const [savedPrefs, setSavedPrefs] = useState<NotifPrefs>(SEED_PREFS);
  const [prefs, setPrefs] = useState<NotifPrefs>(() => initialState !== 'saved' && startSection === 'notifications' ? { ...SEED_PREFS, [prefKey('payment', 'front_desk', 'sms')]: true } : SEED_PREFS);
  const [templates, setTemplates] = useState<Template[]>(data === 'long' ? LONG_TEMPLATES : SEED_TEMPLATES);
  // Default and logo data use the SHARED staff store: Team edits reach Today, Services and Mechanic. The stress / new / long scenarios stay local to this page.
  const sharedStaff = useStaff();
  const [localStaff, setLocalStaff] = useState<Staff[]>(data === 'new' ? [] : data === 'stress' ? STRESS_STAFF : LONG_STAFF);
  const isShared = data === 'default' || data === 'logo';
  const staff = isShared ? sharedStaff : localStaff;
  const setTeam = isShared ? setStaff : setLocalStaff;

  useEffect(() => { setShopLogo(seedShop.logo); return () => setShopLogo(null); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const errors = validateShop(draft);
  const shopDirty = !same(draft, saved);
  const prefsDirty = !same(prefs, savedPrefs);
  const dirty = section === 'shop' ? shopDirty : section === 'notifications' ? prefsDirty : false;
  const { guard, node: guardNode } = useDirtyGuard(dirty);
  useEffect(() => { if (initialOverlay === 'unsaved') guard(() => go('team')); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The left rail and the phone tabs are plain anchors: with unsaved edits, leaving through one asks first (DirtyGuard).
  const dirtyRef = useRef(dirty); dirtyRef.current = dirty;
  const guardRef = useRef(guard); guardRef.current = guard;
  const discardRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const href = a?.getAttribute('href');
      if (!a || !href || href === '#settings' || a.closest('[role="dialog"]')) return;
      e.preventDefault();
      guardRef.current(() => { discardRef.current(); window.location.hash = href; });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const go = (id: SettingsSectionId) => { setSection(id); setPushed(true); setTried(false); setDraft(saved); setPrefs(savedPrefs); };
  const select = (id: SettingsSectionId) => { if (id === section && pushed) return; guard(() => go(id)); };
  const back = () => guard(() => { setPushed(false); setDraft(saved); setPrefs(savedPrefs); setTried(false); });
  const save = () => {
    if (section === 'shop') {
      if (errorCount(errors)) { setTried(true); return; }
      setSaved(draft); setShopLogo(draft.logo); setTried(false);
      toast.success('Shop details saved.');
    } else { setSavedPrefs(prefs); toast.success('Notification settings saved.'); }
  };
  const discard = () => { setDraft(saved); setPrefs(savedPrefs); setTried(false); };
  discardRef.current = discard;

  const rail = (
    <IconRailContent>
      <IconRailMark href="#portal" label="Back to the ReadyPH Portal" />
      <IconRailItem icon={Wrench} label="Today" href="#today" />
      <IconRailItem icon={ClipboardText} label="Services" href="#services" />
      <IconRailItem icon={UsersThree} label="Customers" href="#customers" />
      <IconRailItem icon={Gear} label="Settings" href="#settings" current />
      <IconRailSpacer />
      <IconRailFoot><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></IconRailFoot>
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

  const current = SECTIONS.find((s) => s.id === section)!;
  const formBody = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="px-6 pb-8 pt-5 max-[640px]:px-4">
          <h2 className="text-[18px] font-semibold">{current.label}</h2>
          <p className="mt-0.5 max-w-xl text-[13px] text-muted">{INTRO[section]}</p>
          {section === 'shop'
            ? <ShopDetailsSection value={draft} onChange={setDraft} errors={errors} showErrors={tried} />
            : <NotificationsSection prefs={prefs} onPrefs={setPrefs} templates={templates} onTemplates={setTemplates} initialTemplate={initialOverlay === 'template' ? 'quote' : null} />}
        </div>
      </div>
      <SaveBar dirty={dirty} problems={section === 'shop' && tried ? errorCount(errors) : 0} onSave={save} onDiscard={discard} />
    </div>
  );
  const sectionBody = section === 'team'
    ? <TeamSection staff={staff} onChange={setTeam} phone={isPhone} initialOpen={initialOverlay === 'edit-staff' ? 'edit' : initialOverlay === 'add-staff' ? 'add' : null} />
    : section === 'services' ? <ServicesPricesPage {...servicesProps} embedded /> : formBody;

  const showMenu = isPhone && !pushed;
  const main = showMenu ? <div className="min-h-0 flex-1 overflow-auto"><SettingsNav sections={SECTIONS} onSelect={select} variant="list" /></div> : (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {isPhone && <div className="flex-none border-b border-rule px-4 py-2"><Breadcrumbs variant="phone" items={[{ label: 'Settings', onClick: back }, { label: current.label }]} /></div>}
      <div className="min-h-0 flex-1">{sectionBody}</div>
    </div>
  );

  const platform = { name: branch.name, initials: 'DC' };
  return (
    <>
      <PlatformShell
        railWidth="wide" railLabel="Shop" rail={rail}
        topBar={<>
          <span className="flex-none whitespace-nowrap text-[15px] font-semibold">{showMenu ? 'Settings' : current.label}</span>
          {!showMenu && <span className="min-w-0 truncate text-[13px] text-muted">· Settings</span>}
          <span className="flex-1" />
          <span className="contents [&>button]:size-11"><AccountMenu name={manager.name} email="mon@delacruzauto.example" role="Branch manager" initials={manager.initials} applyToDocument={false} /></span>
        </>}
        phoneNav={phoneNav}
        heading="Settings"
        hideSheetBarOnPhone
        sheetBar={<SheetBar wrapChildren={false} actionsFirst={false} actions={<AskLedaBar variant="bar" scope="Settings" paused onOpen={() => undefined} />}><SheetBarWhere platform={platform} page="Settings" /></SheetBar>}
        statusLabel="Status"
        status={<InventoryStatusBar platform={platform} dataLink={{ with: branch.inventory.platform, status: 'linked', since: '10:18' }} viewer={{ name: 'Mon', role: 'Branch manager' }} leda={{ canDecide: true, managerName: 'Mon' }} updatedAt="10:20" />}
      >
        <div className="flex h-full min-h-0">
          {!isPhone && <SettingsNav sections={SECTIONS} current={section} onSelect={select} />}
          {main}
        </div>
      </PlatformShell>
      {guardNode}
      <Toaster />
    </>
  );
}
