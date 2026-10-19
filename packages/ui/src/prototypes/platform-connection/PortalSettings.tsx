import { useState, type ReactNode } from 'react';
import { Buildings, Check, Clock, CreditCard, User, Warning, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { Notice } from '../../components/Notice';
import { ProgressBar } from '../../components/ProgressBar';
import { Icon } from '../../components/Icon';
import { Select } from '../../components/Select';
import { Switch } from '../../components/Switch';
import { SettingsSection } from '../../components/SettingsSection';
import { Skeleton } from '../../components/Skeleton';
import { Tabs, TabPanel } from '../../components/Tabs';
import { Textarea } from '../../components/Textarea';
import { toast } from '../../components/toast/toastStore';
import { Page, RetryNotice } from '../repair-shop/Page';
import { ConnShell } from './ConnShell';

export type SettingsState = 'default' | 'loading' | 'error' | 'saved' | 'validation' | 'limit' | 'requested';

function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 pt-6">{children}</div>;
}

function CompanyTab({ state }: { state: SettingsState }) {
  if (state === 'loading') return <div className="pt-6"><Skeleton height={320} /></div>;
  if (state === 'error') return <div className="pt-6"><RetryNotice title="Couldn't load the company" /></div>;
  return (
    <Stack>
      {state === 'saved' && <Notice tone="success" icon={Check}>Company profile saved.</Notice>}
      <SettingsSection title="Company profile" description="Customers see this. Leda answers inquiries from it." actions={<Button size="sm" onClick={() => toast.success('Company profile saved.')}>Save</Button>}>
        <Field label="Company name"><Input defaultValue="Sunrise Auto Parts" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contact email" error={state === 'validation' ? 'Enter a valid email.' : undefined}><Input type="email" defaultValue={state === 'validation' ? 'hello@sunrise' : 'hello@sunrise.ph'} /></Field>
          <Field label="Phone"><Input placeholder="Add a phone number" /></Field>
        </div>
        <Field label="Address"><Input placeholder="Add your business address" /></Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Website"><Input placeholder="example.com" /></Field>
          <div className="flex flex-col gap-1"><span className="text-sm font-medium">Timezone</span><span className="flex h-md items-center text-sm text-ink-muted">Asia/Manila (GMT+8)</span></div>
        </div>
      </SettingsSection>
    </Stack>
  );
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
interface DayHours { open: boolean; from: string; to: string }
const initialHours = (): Record<string, DayHours> =>
  Object.fromEntries(DAYS.map((d) => [d, { open: d !== 'Sunday', from: '08:00', to: '18:00' }]));

function ScheduleTab() {
  const [hours, setHours] = useState(initialHours);
  const set = (d: string, patch: Partial<DayHours>) => setHours((h) => ({ ...h, [d]: { ...h[d], ...patch } }));
  const bad = (h: DayHours) => h.open && h.to <= h.from;
  const invalid = DAYS.some((d) => bad(hours[d]));
  return (
    <Stack>
      <SettingsSection title="Business hours" description="Leda tells customers when you are open."
        actions={<Button size="sm" onClick={() => (invalid ? toast.error('Closing time must be after opening time.') : toast.success('Business hours saved.'))}>Save</Button>}>
        <div className="flex flex-col gap-3">
          {DAYS.map((d) => {
            const h = hours[d];
            return (
              <div key={d} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="w-28 text-ink-muted">{d}</span>
                <Switch checked={h.open} onCheckedChange={(open) => set(d, { open })} label={<span className="sr-only">{d} open</span>} />
                {h.open
                  ? <div className="flex items-center gap-2">
                      <Input type="time" inputSize="sm" aria-label={`${d} opens`} value={h.from} invalid={bad(h)} onChange={(e) => set(d, { from: e.target.value })} className="w-32" />
                      <span className="text-ink-muted">to</span>
                      <Input type="time" inputSize="sm" aria-label={`${d} closes`} value={h.to} invalid={bad(h)} onChange={(e) => set(d, { to: e.target.value })} className="w-32" />
                    </div>
                  : <Badge size="sm">Closed</Badge>}
              </div>
            );
          })}
        </div>
      </SettingsSection>
    </Stack>
  );
}

function PasswordModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Change password" description="You will be signed out of Portal, Inventory and Repair shop, then sign in with the new password."
      footer={<><Button variant="subtle" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onOpenChange(false); toast.success('Password changed. Signing you out.'); }}>Change password</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Current password"><Input type="password" autoFocus autoComplete="current-password" /></Field>
        <Field label="New password" hint="At least 8 characters."><Input type="password" autoComplete="new-password" /></Field>
        <Field label="Confirm new password"><Input type="password" /></Field>
      </div>
    </Modal>
  );
}

function AccountTab({ passwordOpen }: { passwordOpen: boolean }) {
  const [open, setOpen] = useState(passwordOpen);
  return (
    <Stack>
      <SettingsSection title="Your profile" actions={<Button size="sm" onClick={() => toast.success('Profile saved.')}>Save</Button>}>
        <Field label="Full name"><Input defaultValue="Maria Santos" /></Field>
        <Field label="Email" hint="Sign-in email. Ask your company owner to change it."><Input defaultValue="maria@sunrise.ph" disabled /></Field>
      </SettingsSection>
      <SettingsSection title="Password" description="Used across Portal, Inventory and Repair shop." actions={<Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Change password</Button>}>
        <p className="text-sm text-ink-muted">Last changed 3 months ago.</p>
      </SettingsSection>
      <PasswordModal open={open} onOpenChange={setOpen} />
    </Stack>
  );
}

function UsageRow({ label, value, pct, full }: { label: string; value: string; pct: number; full?: boolean }) {
  return <div className="flex flex-col gap-2"><div className="flex justify-between text-sm"><span className="text-ink-muted">{label}</span><span className="tabular-nums">{value}</span></div><ProgressBar value={pct} label={`${label}: ${value}`} tone={full ? 'error' : 'primary'} /></div>;
}

function PlanChangeModal({ open, onOpenChange, onSent }: { open: boolean; onOpenChange: (o: boolean) => void; onSent: () => void }) {
  const [plan, setPlan] = useState('pro');
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Request plan change" description="Our team replies within one business day. Nothing changes until you confirm."
      footer={<><Button variant="subtle" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={() => { onOpenChange(false); onSent(); toast.success('Request sent. We will email maria@sunrise.ph.'); }}>Send request</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Plan"><Select value={plan} onValueChange={setPlan} options={[{ value: 'free', label: 'Free' }, { value: 'starter', label: 'Starter (current)' }, { value: 'pro', label: 'Pro' }]} /></Field>
        <Field label="Note" hint="Optional."><Textarea placeholder="Tell us what you need, for example more platforms." /></Field>
      </div>
    </Modal>
  );
}

/** Billing v1: Plan, Usage, Request plan change. Invoices and Payment method are later cards in this same stack. */
function BillingTab({ state, requestOpen }: { state: SettingsState; requestOpen: boolean }) {
  const [open, setOpen] = useState(requestOpen);
  const [sent, setSent] = useState(state === 'requested');
  if (state === 'loading') return <div className="pt-6"><Skeleton height={260} /></div>;
  if (state === 'error') return <div className="pt-6"><RetryNotice title="Couldn't load plan and usage" /></div>;
  const atLimit = state === 'limit';
  return (
    <Stack>
      <SettingsSection title="Plan" description="Your current subscription." actions={sent ? undefined : <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Request plan change</Button>}>
        <div className="flex items-center gap-3"><span className="text-lg font-semibold">Starter</span><Badge tone="success" size="sm">Active</Badge>{sent && <Badge tone="info" size="sm">Change to Pro requested</Badge>}</div>
        <ul className="flex flex-col gap-1 text-sm text-ink-muted"><li>Up to 3 platforms and 10 team members</li><li>1,000 Leda messages per month</li></ul>
      </SettingsSection>
      <SettingsSection title="Usage this month" description="Resets on the 1st.">
        <div className="flex flex-col gap-4">
          <UsageRow label="Leda messages" value="640 of 1,000" pct={64} />
          <UsageRow label="Platforms" value="3 of 3" pct={100} full={atLimit} />
          <UsageRow label="Team members" value="8 of 10" pct={80} />
        </div>
        {atLimit && <Notice tone="warning" icon={Warning}>You are at your platform limit. Request a plan change to connect more.</Notice>}
      </SettingsSection>
      <PlanChangeModal open={open} onOpenChange={setOpen} onSent={() => setSent(true)} />
    </Stack>
  );
}

/** Tab icons show from sm up; below sm the row is labels only so all four tabs fit at 390. */
function tabLabel(icon: PhosphorIcon, label: string) {
  return <><span className="hidden sm:inline-flex"><Icon icon={icon} size="sm" /></span>{label}</>;
}

export function SettingsPage({ tab = 'company', state = 'default', modal = false }: { tab?: string; state?: SettingsState; modal?: boolean }) {
  const [t, setT] = useState(tab);
  return (
    <ConnShell app="portal" activeKey="settings" title={<span className="text-sm font-semibold">Settings</span>} onAccountTab={setT}>
      <Page>
        <PageHeader title="Settings" description="Company, schedule, account and billing" />
        <Tabs variant="underline" value={t} onValueChange={setT} items={[
          { value: 'company', label: tabLabel(Buildings, 'Company') }, { value: 'schedule', label: tabLabel(Clock, 'Schedule') },
          { value: 'account', label: tabLabel(User, 'Account') }, { value: 'billing', label: tabLabel(CreditCard, 'Billing') },
        ]}>
          <TabPanel value="company"><CompanyTab state={state} /></TabPanel>
          <TabPanel value="schedule"><ScheduleTab /></TabPanel>
          <TabPanel value="account"><AccountTab passwordOpen={modal} /></TabPanel>
          <TabPanel value="billing"><BillingTab state={state} requestOpen={modal} /></TabPanel>
        </Tabs>
      </Page>
    </ConnShell>
  );
}
