/**
 * PROTOTYPE (RDY-174, epic RDY-173 features 6 and 7) - Portal foundations.
 *
 * Built only from existing @readyph/ui components and tokens. Proposed values that do not exist
 * yet are shown with the closest existing token and listed in MISSING_IN_KIT for Leonardo:
 * - Ink chrome is previewed by scoping the existing dark palette (`data-theme="dark"`) onto the
 *   rail and sidebar and using `bg-surface-canvas`; the kit needs real `chrome` tokens.
 * - Shape uses the existing radius scale, which already has 4px (`sm`), 6px (`base`), 8px (`md`).
 * - Hairline cards are `Card elevation="flat"` plus `border border-border rounded-base`.
 * - Badge `primary` blue tint is previewed with a className override on the existing Badge.
 * Never export anything from this folder in `src/index.ts`.
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  Bell,
  Buildings,
  ChartLineUp,
  Check,
  Desktop,
  DotsThree,
  Gear,
  House,
  Moon,
  Package,
  Plus,
  SignOut,
  SquaresFour,
  Sun,
  UserCircle,
  Users,
  WaveTriangle,
  Wrench,
} from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card, CardHeader } from '../../components/Card';
import { Chat, ChatHeader, ChatInput, ChatMessage, ChatMessages, ChatQuickActions } from '../../components/Chat';
import { DataList } from '../../components/DataList';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { IconRail, IconRailItem } from '../../components/IconRail';
import { Input } from '../../components/Input';
import { LedaLauncher } from '../../components/LedaLauncher';
import { Menu, type MenuItem } from '../../components/Menu';
import { PageHeader } from '../../components/PageHeader';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { SettingsSection } from '../../components/SettingsSection';
import { Sidebar, SidebarItem, SidebarSection } from '../../components/Sidebar';
import { Stat } from '../../components/Stat';
import { StatusDot } from '../../components/StatusDot';
import { Table, type TableColumn } from '../../components/Table';
import { TopBar } from '../../components/TopBar';
import { cn } from '../../utils/cn';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = 'system' | ThemeMode;
export type ChromeVariant = 'ink' | 'light';

/** Proposed hairline card: flat, 1px border, 6px radius. Stand-in until Card ships it. */
export const hairlineCard = 'border border-border rounded-base';
/** Proposed Badge `primary` blue tint (replaces peach). Stand-in until Badge ships it. */
export const badgePrimaryBlue = 'bg-primary-50 text-primary-700';

/**
 * A themed pane. Light relies on the story pinning the Storybook theme to light (the kit has no
 * `[data-theme="light"]` scope yet); dark scopes the existing dark palette.
 */
export function ThemePane({ mode, label, children, className }: { mode: ThemeMode; label?: string; children: ReactNode; className?: string }) {
  return (
    <section data-theme={mode === 'dark' ? 'dark' : undefined} className={cn('ds-root flex min-w-0 flex-col gap-4 bg-surface-canvas p-4 text-ink', className)}>
      {label && (
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
          <Icon icon={mode === 'dark' ? Moon : Sun} size="sm" />
          {label}
        </p>
      )}
      {children}
    </section>
  );
}

function SpecBlock({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card elevation="flat" padding="md" className={hairlineCard}>
      <CardHeader className="flex-col items-start gap-1">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {description && <p className="text-xs text-ink-muted">{description}</p>}
      </CardHeader>
      {children}
    </Card>
  );
}

/* ---------------------------------------------------------------- Tokens */

const swatches: { name: string; role: string; className: string }[] = [
  { name: 'surface', role: 'Content surface (white)', className: 'bg-surface border border-border' },
  { name: 'surface-muted', role: 'Hover and selected (the one neutral grey)', className: 'bg-surface-muted' },
  { name: 'border', role: '1px hairline, no card shadows', className: 'bg-border' },
  { name: 'ink', role: 'Text, near-black', className: 'bg-ink' },
  { name: 'ink-muted', role: 'Secondary text', className: 'bg-ink-muted' },
  { name: 'primary-600', role: 'The single action colour', className: 'bg-primary-600' },
  { name: 'primary-50', role: 'Selected tint, Badge primary', className: 'bg-primary-50' },
  { name: 'surface-canvas (ink scope)', role: 'Chrome: rail + sidebar', className: 'bg-surface-canvas' },
];

function Swatch({ name, role, className }: { name: string; role: string; className: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('h-8 w-8 shrink-0 rounded-sm', className)} />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-ink">{name}</p>
        <p className="truncate text-xs text-ink-muted">{role}</p>
      </div>
    </div>
  );
}

const shapes = [
  { label: '4px  controls, menu items', className: 'rounded-sm', token: 'radius.sm' },
  { label: '6px  cards, panels', className: 'rounded-base', token: 'radius.base' },
  { label: '8px  modals', className: 'rounded-md', token: 'radius.md' },
];

const spacingSteps = [
  { label: '4', className: 'w-1' },
  { label: '8', className: 'w-2' },
  { label: '12', className: 'w-3' },
  { label: '16', className: 'w-4' },
];

export function TokenBoard() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SpecBlock title="Colour" description="White content, one neutral grey, hairlines, near-black ink, blue for action only.">
        <div className="grid gap-3">
          {swatches.map((s) => (
            <Swatch key={s.name} {...s} />
          ))}
        </div>
      </SpecBlock>

      <SpecBlock title="Shape" description="Three radii. Pills only for avatars, status dots and count badges.">
        <div className="grid gap-3">
          {shapes.map((s) => (
            <div key={s.token} className="flex items-center gap-3">
              <span className={cn('h-10 w-16 shrink-0 border border-border-strong bg-surface-muted', s.className)} />
              <div>
                <p className="text-xs font-medium text-ink">{s.label}</p>
                <p className="text-xs text-ink-muted">{s.token}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 border-t border-border pt-3">
            <Avatar name="Maria Santos" size="sm" />
            <StatusDot status="active" label="Online" />
            <Badge tone="neutral" size="sm">12</Badge>
            <span className="text-xs text-ink-muted">Pill shapes</span>
          </div>
        </div>
      </SpecBlock>

      <SpecBlock title="Density" description="Compact, Slack-like. Text 14 / 12. Gutter 16 desktop, 12 mobile.">
        <DataList
          items={[
            { label: 'Control', value: '32px (controlHeight.sm)' },
            { label: 'Sidebar item', value: '28px (new)' },
            { label: 'Table row', value: '36px, dense 32px (new)' },
            { label: 'Text', value: '14px body, 12px meta' },
            { label: 'Gutter', value: '16px desktop, 12px mobile (new)' },
          ]}
        />
        <div className="mt-3 flex items-end gap-4 border-t border-border pt-3">
          {spacingSteps.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className={cn('h-4 rounded-sm bg-primary-600', s.className)} />
              <span className="text-xs text-ink-muted">{s.label}</span>
            </div>
          ))}
          <span className="text-xs text-ink-muted">Spacing steps (px)</span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
          <Button size="sm">Save</Button>
          <Input inputSize="sm" placeholder="32px control" aria-label="Density sample" />
        </div>
      </SpecBlock>
    </div>
  );
}

/* ---------------------------------------------------------------- Specimen */

interface Row { id: string; platform: string; owner: string; status: 'Active' | 'Degraded' | 'Offline'; seats: number }
const rows: Row[] = [
  { id: '1', platform: 'Inventory', owner: 'Maria Santos', status: 'Active', seats: 12 },
  { id: '2', platform: 'Repair shop', owner: 'Jose Reyes', status: 'Degraded', seats: 5 },
  { id: '3', platform: 'SMS', owner: 'Ana Cruz', status: 'Offline', seats: 0 },
];
const statusTone = { Active: 'success', Degraded: 'warning', Offline: 'neutral' } as const;
const columns: TableColumn<Row>[] = [
  { key: 'platform', header: 'Platform', render: (r) => <span className="font-medium text-ink">{r.platform}</span> },
  { key: 'owner', header: 'Owner' },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone[r.status]} size="sm" dot>{r.status}</Badge> },
  { key: 'seats', header: 'Seats', align: 'right' },
];

const rowMenu: MenuItem[] = [
  { label: 'Open', icon: SquaresFour },
  { label: 'Ask Leda about this', icon: WaveTriangle },
  { type: 'separator' },
  { label: 'Disconnect', danger: true },
];

export function SpecimenBoard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SpecBlock title="Button" description="Blue is the only filled colour. 32px default in the new density.">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Primary</Button>
          <Button size="sm" variant="secondary">Secondary</Button>
          <Button size="sm" variant="subtle">Subtle</Button>
          <Button size="sm" variant="danger">Danger</Button>
          <IconButton icon={Plus} label="Add" size="sm" variant="secondary" />
        </div>
      </SpecBlock>

      <SpecBlock title="Input and Select">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Company name">
            <Input inputSize="sm" defaultValue="ReadyPH Motors" />
          </Field>
          <Field label="Role">
            <Select
              size="sm"
              defaultValue="admin"
              options={[
                { value: 'admin', label: 'Administrator' },
                { value: 'member', label: 'Member' },
              ]}
            />
          </Field>
        </div>
      </SpecBlock>

      <SpecBlock title="Badge" description="Primary is a blue tint (no peach). Count badges are the only pills with text.">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary" className={badgePrimaryBlue}>Primary</Badge>
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="success" dot>Active</Badge>
          <Badge tone="warning" dot>Degraded</Badge>
          <Badge tone="error" dot>Failed</Badge>
          <Badge tone="info">Info</Badge>
        </div>
      </SpecBlock>

      <SpecBlock title="Card and Menu" description="Cards: flat, hairline, 6px. Menus: 4px items.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="Revenue this month" value="PHP 412,300" delta="+8.2%" deltaTone="success" className={cn(hairlineCard, 'p-3')} />
          <Card elevation="flat" padding="sm" className={cn(hairlineCard, 'flex items-center justify-between gap-2')}>
            <span className="text-sm text-ink">Row actions</span>
            <Menu trigger={<IconButton icon={DotsThree} label="Row actions" size="sm" variant="subtle" />} items={rowMenu} />
          </Card>
        </div>
      </SpecBlock>

      <div className="md:col-span-2">
        <SpecBlock title="Table" description="Rows 36px (dense shown), hairline dividers, hover uses surface-muted.">
          <Table columns={columns} data={rows} rowKey={(r) => r.id} dense />
        </SpecBlock>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Chrome */

const railPlatforms = [
  { icon: House, label: 'Portal home', active: true },
  { icon: Package, label: 'Inventory' },
  { icon: Wrench, label: 'Repair shop' },
];

function ChromeNav() {
  return (
    <>
      <IconRail className="border-r-0 bg-transparent" aria-label="Platforms">
        {railPlatforms.map((p) => (
          <IconRailItem key={p.label} icon={p.icon} label={p.label} active={p.active} />
        ))}
        <IconRailItem icon={Plus} label="Add platform" />
      </IconRail>
      <Sidebar className="border-r border-border" aria-label="Portal">
        <p className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-ink">
          <Icon icon={Buildings} size="sm" /> ReadyPH Motors
        </p>
        <SidebarSection>
          <SidebarItem icon={House} active>Home</SidebarItem>
          <SidebarItem icon={SquaresFour}>Platforms</SidebarItem>
          <SidebarItem icon={Users} badge="3">Team</SidebarItem>
          <SidebarItem icon={ChartLineUp}>Reports</SidebarItem>
        </SidebarSection>
        <SidebarSection title="Leda">
          <SidebarItem icon={WaveTriangle}>Ask Leda</SidebarItem>
        </SidebarSection>
        <SidebarSection className="mt-auto">
          <SidebarItem icon={Gear}>Settings</SidebarItem>
        </SidebarSection>
      </Sidebar>
    </>
  );
}

function LedaPanel() {
  return (
    <Chat size="md" aria-label="Leda" className="h-full w-72 shrink-0 rounded-none border-0 border-l border-border shadow-none">
      <ChatHeader title="Leda" subtitle="Across all platforms" onClose={() => undefined} />
      <ChatMessages>
        <ChatMessage role="user">How did sales do this week?</ChatMessage>
        <ChatMessage role="assistant">Inventory sales are up 8.2% on last week. Repair shop jobs are flat.</ChatMessage>
      </ChatMessages>
      <ChatQuickActions>
        <Badge tone="primary" className={badgePrimaryBlue}>Open report</Badge>
        <Badge tone="neutral">Low stock</Badge>
      </ChatQuickActions>
      <ChatInput placeholder="Ask Leda..." aria-label="Ask Leda" />
    </Chat>
  );
}

/**
 * A compact Portal frame. `ink` scopes the dark palette onto the rail and sidebar so they stay
 * dark in both themes; `light` keeps them on the page palette.
 */
export function ChromeFrame({ variant, leda }: { variant: ChromeVariant; leda: 'launcher' | 'panel' }) {
  return (
    <div className="relative flex h-96 rounded-md border border-border bg-surface">
      <div data-theme={variant === 'ink' ? 'dark' : undefined} className={cn('flex shrink-0 rounded-l-md', variant === 'ink' ? 'bg-surface-canvas text-ink' : 'bg-surface-subtle')}>
        <ChromeNav />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          className="border-b border-border"
          start={<span className="text-sm font-semibold text-ink">Home</span>}
          end={
            <>
              <IconButton icon={Bell} label="Notifications" size="sm" variant="subtle" />
              <Avatar name="Maria Santos" size="xs" />
            </>
          }
        />
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Stat label="Active platforms" value="3" className={cn(hairlineCard, 'p-3')} />
          <Stat label="Open jobs" value="14" delta="-2" deltaTone="neutral" className={cn(hairlineCard, 'p-3')} />
        </div>
      </div>
      {leda === 'panel' ? <LedaPanel /> : <LedaLauncher className="bottom-4 right-4" />}
    </div>
  );
}

/* ---------------------------------------------------------------- Theme preference */

export const THEME_STORAGE_KEY = 'readyph.theme';

const preferenceOptions = [
  { value: 'system', label: 'System', icon: Desktop },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

function readPreference(): ThemePreference {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

function useSystemDark(): boolean {
  const [dark, setDark] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return dark;
}

/** Prototype stand-in for the missing `useTheme()`: preference + resolved mode, persisted. */
export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const systemDark = useSystemDark();
  const resolved: ThemeMode = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, p);
    } catch {
      /* storage blocked: keep in memory */
    }
  };
  return { preference, resolved, setPreference };
}

export function ThemePreferenceControl({ value, onChange }: { value: ThemePreference; onChange: (v: ThemePreference) => void }) {
  return <SegmentedControl size="sm" aria-label="Theme" options={preferenceOptions} value={value} onChange={(v) => onChange(v as ThemePreference)} />;
}

function accountMenuItems(value: ThemePreference, onChange: (v: ThemePreference) => void): MenuItem[] {
  return [
    { type: 'label', label: 'maria@readyph.com' },
    { label: 'Account settings', icon: UserCircle },
    { type: 'separator' },
    { type: 'label', label: 'Theme' },
    ...preferenceOptions.map((o) => ({
      label: (
        <span className="flex flex-1 items-center justify-between gap-4">
          {o.label}
          {value === o.value && <Icon icon={Check} size="sm" className="text-primary-600" />}
        </span>
      ),
      icon: o.icon,
      onSelect: () => onChange(o.value as ThemePreference),
    })),
    { type: 'separator' },
    { label: 'Sign out', icon: SignOut },
  ];
}

export function ThemePreferenceScreen() {
  const { preference, resolved, setPreference } = useThemePreference();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SpecBlock title="Account settings > Appearance" description="The same control is used in the account menu.">
        <PageHeader title="Account settings" description="Personal preferences for this device." />
        <SettingsSection title="Theme" description="System follows your device. Saved on this browser.">
          <div className="flex flex-wrap items-center gap-3">
            <ThemePreferenceControl value={preference} onChange={setPreference} />
            <span className="text-xs text-ink-muted">Showing {resolved}</span>
          </div>
        </SettingsSection>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <span className="text-sm text-ink-muted">Account menu</span>
          <Menu
            trigger={
              <button type="button" aria-label="Account menu" className="rounded-full">
                <Avatar name="Maria Santos" size="sm" />
              </button>
            }
            items={accountMenuItems(preference, setPreference)}
          />
        </div>
      </SpecBlock>

      <SpecBlock title="Behaviour" description="Contract for ThemeProvider / useTheme and the no-flash script.">
        <DataList
          items={[
            { label: 'Storage key', value: <code className="text-xs">{THEME_STORAGE_KEY}</code> },
            { label: 'Values', value: 'system (default), light, dark' },
            { label: 'System', value: 'Follows prefers-color-scheme, live on OS change' },
            { label: 'No flash', value: 'Inline head script sets data-theme on <html> before first paint' },
            { label: 'Chrome', value: 'Rail and sidebar stay ink in both themes' },
            { label: 'Scope', value: 'Per browser; not synced to the account' },
          ]}
        />
        <ThemePane mode={resolved} label={`Preview: ${resolved}`} className="mt-3 rounded-base border border-border">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Badge tone="primary" className={badgePrimaryBlue}>Primary</Badge>
          </div>
        </ThemePane>
      </SpecBlock>
    </div>
  );
}

/** Items the kit lacks; each becomes a `design` delivery ticket (Leonardo). */
export const MISSING_IN_KIT = [
  'Chrome tokens (chrome bg / fg / muted / hover / active / border), ink in both themes, light variant optional',
  '[data-theme="light"] scope block so light can nest inside dark',
  'Semantic radius tokens: control 4 (sm), card/panel 6 (base), modal 8 (md); Card, Menu, SegmentedControl, Chat, LedaLauncher to adopt them',
  'Card: flat + hairline border by default (no shadow)',
  'Badge primary: blue tint (tint-blue bg/fg tokens) instead of peach',
  'Density tokens: control 32 default, sidebar item 28, table row 36 / dense 32, gutter 16 / 12; SidebarItem and Table to adopt them',
  'ThemeProvider + useTheme (system / light / dark, readyph.theme) and an exported no-flash head script',
];
