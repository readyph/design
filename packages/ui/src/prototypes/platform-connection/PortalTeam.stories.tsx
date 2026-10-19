import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from '@phosphor-icons/react';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Input } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { Select } from '../../components/Select';
import { Table, type TableColumn } from '../../components/Table';
import { toast } from '../../components/toast/toastStore';
import { Page, RetryNotice } from '../repair-shop/Page';
import { UsersThree } from '@phosphor-icons/react';
import { ConnShell } from './ConnShell';

/** PROTOTYPE (RDY-120) - Team: Invite member opens a modal that sends an invitation; Resend on a pending row re-sends and confirms with a toast. */
const meta: Meta = { title: 'Portal/Team invite', tags: ['!autodocs'], parameters: { layout: 'fullscreen' } };
export default meta;
type Story = StoryObj;

interface Member { name: string; email: string; role: string; access: string; pending?: boolean }
const MEMBERS: Member[] = [
  { name: 'Maria Santos', email: 'maria@sunrise.ph', role: 'Owner', access: 'All platforms' },
  { name: 'Jun dela Cruz', email: 'jun@sunrise.ph', role: 'Admin', access: 'Main inventory' },
  { name: 'Ramil Bautista', email: 'ramil@sunrise.ph', role: 'Mechanic', access: 'Davao branch' },
  { name: 'Liza Mercado', email: 'liza.mercado@gmail.com', role: 'Staff', access: 'Main inventory', pending: true },
];

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteModal({ open, onOpenChange, prefill = '' }: { open: boolean; onOpenChange: (o: boolean) => void; prefill?: string }) {
  const [email, setEmail] = useState(prefill);
  const [role, setRole] = useState('staff');
  const [access, setAccess] = useState('all');
  const [tried, setTried] = useState(Boolean(prefill));
  const error = tried && !EMAIL_OK.test(email.trim()) ? 'Enter a valid email.' : undefined;
  const close = (o: boolean) => { onOpenChange(o); if (!o) { setEmail(prefill); setTried(Boolean(prefill)); } };
  const send = () => {
    setTried(true);
    if (!EMAIL_OK.test(email.trim())) return;
    close(false);
    toast.success(`Invitation sent to ${email.trim()}.`);
  };
  return (
    <Modal open={open} onOpenChange={close} title="Invite a team member" description="They get an email to join and choose which platforms they can use."
      footer={<><Button variant="subtle" onClick={() => close(false)}>Cancel</Button><Button onClick={send}>Send invite</Button></>}>
      <div className="flex flex-col gap-4">
        <Field label="Email" required error={error}><Input type="email" autoFocus autoComplete="off" placeholder="name@company.ph" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Role"><Select value={role} onValueChange={setRole} options={[{ value: 'staff', label: 'Staff' }, { value: 'mechanic', label: 'Mechanic' }, { value: 'admin', label: 'Admin' }]} /></Field>
        <Field label="Platform access" hint="Inventory and each Repair shop branch can be allowed separately."><Select value={access} onValueChange={setAccess} options={[{ value: 'all', label: 'All platforms' }, { value: 'inv', label: 'Main inventory only' }, { value: 'dvo', label: 'Davao branch only' }]} /></Field>
      </div>
    </Modal>
  );
}

function TeamPage({ open = false, error = false, state = 'default' }: { open?: boolean; error?: boolean; state?: 'default' | 'loading' | 'empty' | 'error' }) {
  const [o, setO] = useState(open);
  const columns: TableColumn<Member>[] = [
    { key: 'name', header: 'Member', render: (m) => <div className="flex flex-col"><span className="font-medium text-ink">{m.name}</span><span className="text-xs text-ink-subtle">{m.email}</span></div> },
    { key: 'role', header: 'Role', render: (m) => m.role },
    { key: 'access', header: 'Access', className: 'hidden md:table-cell', render: (m) => m.access },
    { key: 'status', header: '', align: 'right', render: (m) => m.pending
      ? <div className="flex items-center justify-end gap-2"><Badge tone="warning" size="sm">Invited</Badge><Button size="sm" variant="secondary" className="border-border-strong bg-surface" onClick={() => toast.success(`Invitation re-sent to ${m.email}.`)}>Resend</Button></div>
      : <Badge tone="success" size="sm">Active</Badge> },
  ];
  return (
    <ConnShell app="portal" activeKey="team" title={<span className="text-sm font-semibold">Team</span>}>
      <Page>
        <PageHeader title="Team" description={state === 'default' ? '4 members - 1 invitation pending' : undefined} actions={<Button leftIcon={Plus} onClick={() => setO(true)}>Invite member</Button>} />
        {state === 'error' && <RetryNotice title="Couldn't load your team">Check your connection and try again.</RetryNotice>}
        {state === 'empty' && <EmptyState icon={UsersThree} title="Just you so far" description="Invite staff and mechanics and choose which platforms they can use." action={<Button leftIcon={Plus} onClick={() => setO(true)}>Invite member</Button>} />}
        {(state === 'default' || state === 'loading') && <Table columns={columns} data={state === 'loading' ? [] : MEMBERS} loading={state === 'loading'} rowKey={(m) => m.email} />}
        <InviteModal open={o} onOpenChange={setO} prefill={error ? 'liza@' : ''} />
      </Page>
    </ConnShell>
  );
}

export const Default: Story = { render: () => <TeamPage /> };
export const InviteMember: Story = { name: 'Invite member modal', render: () => <TeamPage open /> };
export const InviteValidation: Story = { name: 'Invite member (validation)', render: () => <TeamPage open error /> };
export const Loading: Story = { render: () => <TeamPage state="loading" /> };
export const Empty: Story = { render: () => <TeamPage state="empty" /> };
export const ErrorState: Story = { name: 'Error', render: () => <TeamPage state="error" /> };
