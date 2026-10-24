/**
 * PROTOTYPE (RDY-180, epic RDY-173 features 6 and 7) - Portal Settings on the RDY-175 shell:
 * tabs Company, Schedule, Account (profile, password, Appearance) and Billing (plan request).
 *
 * The Appearance section is bound to the real `ThemeProvider` / `useTheme` (System / Light / Dark,
 * stored per browser as `readyph.theme`); the tenant-menu theme items use the same hook, so both
 * stay in sync and the whole shell switches live.
 *
 * Built only from @readyph/ui 0.7 components and tokens plus the exported shell parts. Gaps are
 * previewed with className overrides and listed in MISSING_IN_KIT. Never export this folder from
 * `src/index.ts`.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Desktop, Moon, Sun } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { OffCanvas, OffCanvasHeader } from '../../components/Drawer';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { ProgressBar } from '../../components/ProgressBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { SettingsSection } from '../../components/SettingsSection';
import { Switch } from '../../components/Switch';
import { TabPanel, Tabs } from '../../components/Tabs';
import { Textarea } from '../../components/Textarea';
import { useTheme } from '../../hooks/useTheme';
import { cn } from '../../utils/cn';
import { isThemePreference, type ThemePreference } from '../../utils/themeScript';
import {
  LedaPanel,
  ShellSidebar,
  ShellTopBar,
  WorkspaceRail,
  type LedaState,
  type ShellRole,
} from '../portal-shell/Shell';

export type SettingsTab = 'company' | 'schedule' | 'account' | 'billing';
export type SettingsModal = 'none' | 'password' | 'plan';

/** For Leonardo: what this prototype previews with overrides because the kit does not ship it yet. */
export const MISSING_IN_KIT = [
  'SettingsSection `density="compact"`: py-4 (not py-6), 14rem label column (not 18rem), sections separated by a hairline (previewed with className + divide-y).',
  'Tabs `size="sm"`: 36px underline tabs, px-2, text only, hairline (border-border, not border-strong) list border; plus a `sticky` option under the top bar (previewed with className).',
  'ThemePreferenceControl: the System / Light / Dark SegmentedControl bound to useTheme, exported so Appearance, the tenant menu and auth share one control (previewed locally as AppearanceControl).',
  'SettingsRow: label + inline control row (28-32px) for lists like business hours; today composed from Switch + Input in a grid.',
  'UsageMeter: label, "x of y" value, ProgressBar and an at-limit hint (Billing usage); Portal and the old pattern both hand-roll it.',
  'Shell `title` / `activeKey` props (or a ShellLayout export) so pages with tabs can set the top bar title and sidebar highlight without recomposing the shell (previewed by composing the exported shell parts).',
];

const TENANT = 'Acme Motors';

/* ------------------------------------------------------- media query */

/** Prototype-only (mirrors Shell): docked Leda vs sheet. */
function useMediaQuery(query: string) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : true);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/* -------------------------------------------------------------- layout */

/** Compact SettingsSection (kit gap: density="compact"). */
const sectionClass = 'py-4 md:grid-cols-[14rem_minmax(0,1fr)]';

function Sections({ children }: { children: ReactNode }) {
  return <div className="flex max-w-content flex-col divide-y divide-border">{children}</div>;
}

/* ------------------------------------------------------------- company */

function CompanyTab() {
  return (
    <Sections>
      <SettingsSection
        className={sectionClass}
        title="Company profile"
        description="Shown to customers. Leda answers inquiries from it."
        actions={<Button>Save</Button>}
      >
        <Field label="Company name" required>
          <Input defaultValue={TENANT} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Contact email">
            <Input type="email" defaultValue="hello@acmemotors.ph" />
          </Field>
          <Field label="Phone">
            <Input type="tel" defaultValue="(02) 8123 4567" />
          </Field>
        </div>
        <Field label="Address">
          <Input defaultValue="12 Mabini St, Makati, Metro Manila" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Website">
            <Input defaultValue="acmemotors.ph" />
          </Field>
          <Field label="Time zone" hint="Used for schedule and reports.">
            <Select
              defaultValue="manila"
              options={[
                { value: 'manila', label: 'Asia/Manila (GMT+8)' },
                { value: 'singapore', label: 'Asia/Singapore (GMT+8)' },
                { value: 'tokyo', label: 'Asia/Tokyo (GMT+9)' },
              ]}
            />
          </Field>
        </div>
      </SettingsSection>
    </Sections>
  );
}

/* ------------------------------------------------------------ schedule */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function ScheduleTab() {
  return (
    <Sections>
      <SettingsSection
        className={sectionClass}
        title="Business hours"
        description="Leda uses these to answer “are you open?”. Times are Asia/Manila."
        actions={<Button>Save</Button>}
      >
        <div className="flex flex-col divide-y divide-border border-y border-border sm:rounded-base sm:border">
          {DAYS.map((day) => {
            const open = day !== 'Sunday';
            return (
              <div
                key={day}
                className="grid min-h-10 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-2 py-1 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:px-3"
              >
                <Switch
                  defaultChecked={open}
                  label={
                    <>
                      <span className="sm:hidden">{day.slice(0, 3)}</span>
                      <span className="hidden sm:inline">{day}</span>
                    </>
                  }
                  className="text-sm"
                />
                {open ? (
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      type="time"
                      aria-label={`${day} opens`}
                      defaultValue={day === 'Saturday' ? '09:00' : '08:00'}
                      className="min-w-0 flex-1 px-2 sm:max-w-36 sm:px-3"
                    />
                    <span aria-hidden="true" className="text-ink-subtle">
                      –
                    </span>
                    <Input
                      type="time"
                      aria-label={`${day} closes`}
                      defaultValue={day === 'Saturday' ? '17:00' : '20:00'}
                      className="min-w-0 flex-1 px-2 sm:max-w-36 sm:px-3"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-ink-subtle">Closed</span>
                )}
              </div>
            );
          })}
        </div>
        <div>
          <Button variant="subtle">Copy Monday to weekdays</Button>
        </div>
      </SettingsSection>
    </Sections>
  );
}

/* ------------------------------------------------------------- account */

const themeOptions = [
  { value: 'system', label: 'System', icon: Desktop },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

/** Kit gap: ThemePreferenceControl. Bound to the real useTheme. */
export function AppearanceControl() {
  const { preference, setPreference } = useTheme();
  return (
    <SegmentedControl
      aria-label="Theme"
      options={themeOptions}
      value={preference}
      onChange={(v) => isThemePreference(v) && setPreference(v)}
    />
  );
}

function AppearanceSection() {
  const { preference, resolved } = useTheme();
  return (
    <SettingsSection
      id="appearance"
      className={sectionClass}
      title="Appearance"
      description="How ReadyPH looks on this browser. Also in the tenant menu."
    >
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Theme</span>
        <div>
          <AppearanceControl />
        </div>
        <p className="text-xs text-ink-muted">
          {preference === 'system'
            ? `Following your device, now ${resolved}.`
            : `Always ${resolved}. Sign-in pages on this browser use it too.`}
        </p>
      </div>
    </SettingsSection>
  );
}

function ChangePasswordModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Change password"
      description="Your other sessions are signed out. You stay signed in here."
      footer={
        <>
          <Button variant="subtle" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>Change password</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Current password">
          <Input type="password" autoComplete="current-password" defaultValue="hunter22" />
        </Field>
        <Field label="New password" hint="At least 8 characters, with upper and lower case and a number.">
          <Input type="password" autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" autoComplete="new-password" />
        </Field>
      </div>
    </Modal>
  );
}

function AccountTab({ modal, onModal }: { modal: SettingsModal; onModal: (m: SettingsModal) => void }) {
  return (
    <Sections>
      <SettingsSection
        className={sectionClass}
        title="Your profile"
        actions={<Button disabled>Save</Button>}
      >
        <Field label="Full name" required>
          <Input defaultValue="Earvin Gemenez" />
        </Field>
        <Field label="Email" hint="Your sign-in email. Ask an admin to change it.">
          <Input value="earvin@acmemotors.ph" disabled readOnly />
        </Field>
      </SettingsSection>
      <SettingsSection
        className={sectionClass}
        title="Password"
        description="One password for Portal, Inventory and Service Management."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-ink-muted">Last changed 3 months ago.</p>
          <Button variant="secondary" onClick={() => onModal('password')}>
            Change password
          </Button>
        </div>
      </SettingsSection>
      <AppearanceSection />
      <ChangePasswordModal open={modal === 'password'} onOpenChange={(o) => onModal(o ? 'password' : 'none')} />
    </Sections>
  );
}

/* ------------------------------------------------------------- billing */

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const full = used >= limit;
  const value = `${used} of ${limit}`;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className={cn('tabular-nums', full ? 'font-medium text-error-fg' : 'text-ink')}>{value}</span>
      </div>
      <ProgressBar size="sm" value={Math.round((used / limit) * 100)} tone={full ? 'error' : 'primary'} label={`${label}: ${value}`} />
      {full && <p className="text-xs text-ink-muted">Limit reached. Request a plan change to add more.</p>}
    </div>
  );
}

function PlanChangeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="Request plan change"
      description="Our team replies within one business day. Nothing changes until you confirm."
      footer={
        <>
          <Button variant="subtle" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button>Send request</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="Plan">
          <Select
            defaultValue="PRO"
            options={[
              { value: 'FREE', label: 'Free' },
              { value: 'STARTER', label: 'Starter (current)', disabled: true },
              { value: 'PRO', label: 'Pro' },
            ]}
          />
        </Field>
        <Field label="Note" hint="Optional.">
          <Textarea rows={3} maxLength={2000} placeholder="Tell us what you need, for example more platforms." />
        </Field>
      </div>
    </Modal>
  );
}

function BillingTab({
  modal,
  onModal,
  pending,
}: {
  modal: SettingsModal;
  onModal: (m: SettingsModal) => void;
  pending: boolean;
}) {
  return (
    <Sections>
      <SettingsSection
        className={sectionClass}
        title="Plan"
        description="Your current subscription."
        actions={
          pending ? undefined : (
            <Button variant="secondary" onClick={() => onModal('plan')}>
              Request plan change
            </Button>
          )
        }
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-ink">Starter</span>
            <Badge tone="primary" size="sm">
              Current
            </Badge>
          </div>
          <p className="text-sm text-ink-muted">Up to 10 team members · Up to 3 platforms</p>
        </div>
        {pending && (
          <Notice tone="info" title="Request for Pro sent on 22 Oct">
            We reply within one business day. You can send another request after this one is answered.
          </Notice>
        )}
      </SettingsSection>
      <SettingsSection
        className={sectionClass}
        title="Usage"
        description="1–31 Oct. Resets on 1 Nov."
      >
        <UsageMeter label="Team members" used={8} limit={10} />
        <UsageMeter label="Platforms" used={3} limit={3} />
      </SettingsSection>
      <PlanChangeModal open={modal === 'plan'} onOpenChange={(o) => onModal(o ? 'plan' : 'none')} />
    </Sections>
  );
}

/* ---------------------------------------------------------------- page */

const TAB_LABEL: Record<SettingsTab, string> = {
  company: 'Company',
  schedule: 'Schedule',
  account: 'Account',
  billing: 'Billing',
};

const ADMIN_TABS: SettingsTab[] = ['company', 'schedule', 'account', 'billing'];

/** Sidebar Settings items deep-link into tabs (`/settings?tab=`); Appearance scrolls to its section. */
const SIDEBAR_TO_TAB: Record<string, SettingsTab> = {
  company: 'company',
  billing: 'billing',
  appearance: 'account',
  profile: 'account',
};

function sidebarKeyFor(tab: SettingsTab, role: ShellRole) {
  if (tab === 'account') return role === 'admin' ? 'appearance' : 'profile';
  if (tab === 'schedule') return 'company';
  return tab;
}

export interface SettingsPageProps {
  role?: ShellRole;
  tab?: SettingsTab;
  modal?: SettingsModal;
  /** Billing: a plan-change request is waiting for a reply. */
  pending?: boolean;
  leda?: LedaState;
}

/**
 * Settings inside the shell. Compose under `ThemeSeed`/`ThemeProvider`: the shell root, the tenant
 * menu and Appearance all read `useTheme`.
 */
export function SettingsPage({
  role = 'admin',
  tab: initialTab = 'company',
  modal: initialModal = 'none',
  pending = false,
  leda: initialLeda = 'closed',
}: SettingsPageProps) {
  const { preference, resolved, setPreference } = useTheme();
  const tabs = role === 'admin' ? ADMIN_TABS : (['account'] as SettingsTab[]);
  const [tab, setTab] = useState<SettingsTab>(tabs.includes(initialTab) ? initialTab : 'account');
  const [modal, setModal] = useState<SettingsModal>(initialModal);
  const [leda, setLeda] = useState<LedaState>(initialLeda);
  const [menu, setMenu] = useState(false);
  const docked = useMediaQuery('(min-width: 1024px)');
  const wide = useMediaQuery('(min-width: 1280px)');
  const ledaOpen = leda !== 'closed';
  const sidebarVisible = docked && (!ledaOpen || wide);
  const context = `Settings · ${TAB_LABEL[tab]}`;

  const sidebarProps = {
    role,
    activeKey: sidebarKeyFor(tab, role),
    theme: preference,
    onTheme: (t: ThemePreference) => setPreference(t),
    onNavigate: (key: string) => {
      const next = SIDEBAR_TO_TAB[key];
      if (!next) return;
      setTab(next);
      setMenu(false);
      if (key === 'appearance') window.setTimeout(() => document.getElementById('appearance')?.scrollIntoView(), 0);
    },
  };

  const panel = (value: SettingsTab) => {
    if (value === 'company') return <CompanyTab />;
    if (value === 'schedule') return <ScheduleTab />;
    if (value === 'account') return <AccountTab modal={modal} onModal={setModal} />;
    return <BillingTab modal={modal} onModal={setModal} pending={pending} />;
  };

  return (
    <div data-theme={resolved} className="ds-root flex h-screen w-full min-w-0 overflow-hidden bg-surface font-sans text-ink">
      <WorkspaceRail role={role} className="hidden sm:flex" />
      {sidebarVisible && <ShellSidebar {...sidebarProps} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <ShellTopBar
          title="Settings"
          showMenu={!sidebarVisible}
          ledaOpen={ledaOpen}
          onMenu={() => setMenu(true)}
          onLeda={() => setLeda(ledaOpen ? 'closed' : 'empty')}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {tabs.length > 1 ? (
            <Tabs
              items={tabs.map((t) => ({ value: t, label: TAB_LABEL[t] }))}
              value={tab}
              onValueChange={(v) => setTab(v as SettingsTab)}
              className="gap-0 [&>[role=tablist]]:sticky [&>[role=tablist]]:top-0 [&>[role=tablist]]:z-10 [&>[role=tablist]]:border-border [&>[role=tablist]]:bg-surface [&>[role=tablist]]:px-gutter [&_[role=tab]]:h-9 [&_[role=tab]]:px-2 [&_[role=tab]]:py-0"
            >
              {tabs.map((t) => (
                <TabPanel key={t} value={t} className="px-gutter pb-gutter">
                  {panel(t)}
                </TabPanel>
              ))}
            </Tabs>
          ) : (
            <div className="px-gutter pb-gutter">{panel('account')}</div>
          )}
        </main>
      </div>

      {ledaOpen && docked && (
        <aside className="flex w-[22.5rem] shrink-0 flex-col border-l border-border bg-surface">
          <LedaPanel state={leda} page={context} onClose={() => setLeda('closed')} />
        </aside>
      )}

      <OffCanvas
        open={ledaOpen && !docked}
        onOpenChange={(o) => !o && setLeda('closed')}
        side="right"
        width="100%"
        hideClose
        className="max-w-full sm:max-w-sm"
      >
        <OffCanvasHeader className="sr-only">Leda</OffCanvasHeader>
        <div data-theme={resolved} className="flex h-full min-h-0 flex-col">
          {ledaOpen && <LedaPanel state={leda} page={context} onClose={() => setLeda('closed')} />}
        </div>
      </OffCanvas>

      <OffCanvas open={menu && !sidebarVisible} onOpenChange={setMenu} side="left" width="18.5rem" hideClose>
        <OffCanvasHeader className="sr-only">Navigation</OffCanvasHeader>
        <div data-theme={resolved} className="flex h-full min-h-0">
          <WorkspaceRail role={role} className="sm:hidden" />
          <ShellSidebar {...sidebarProps} className="min-w-0 flex-1 border-r-0" />
        </div>
      </OffCanvas>
    </div>
  );
}
