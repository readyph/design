import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DotsThree, PencilSimple, UserMinus, KeyReturn } from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Field } from '../../components/Field';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Menu } from '../../components/Menu';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { RoleBadge } from '../../components/RoleBadge';
import { Table, type TableColumn } from '../../components/Table';
import { Toaster } from '../../components/toast/Toaster';
import { toast } from '../../components/toast/toastStore';
import { PortalShell } from '../../patterns/portal/shell';
import { AuthFrame } from '../../patterns/repair-shop/SetPassword';

/**
 * PROTOTYPE (RDY-164, relates to RDY-65) - password reset is admin-initiated in the Portal only.
 * Owner/admin opens Team, uses "Send reset link" on a member row; the member gets an email whose
 * link opens the Portal reset page (existing Portal/Auth "Reset password", "done", "link expired"
 * stories). Inventory and Repair shop sign-in have no self-service "Forgot password".
 */
const meta: Meta = {
  title: 'Portal/Team - send reset link',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

type Outcome = 'ok' | 'error' | 'limited';
interface Member { id: string; name: string; email: string; role: string; status: 'active' | 'suspended'; you?: boolean; sentAt?: string }

const base: Member[] = [
  { id: '1', name: 'Maria Santos', email: 'maria@readyph.com', role: 'owner', status: 'active', you: true },
  { id: '2', name: 'John Lim', email: 'john@readyph.com', role: 'admin', status: 'active' },
  { id: '3', name: 'Ramon Dizon', email: 'ramon@dizonautocare.ph', role: 'member', status: 'active' },
  { id: '4', name: 'Lea Dizon', email: 'lea@readyph.com', role: 'member', status: 'suspended' },
];

function TeamReset({ outcome = 'ok', openFor, allowed = true }: { outcome?: Outcome; openFor?: string; allowed?: boolean }) {
  const [rows, setRows] = useState(base);
  const [target, setTarget] = useState<Member | undefined>(base.find((m) => m.id === openFor));
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | undefined>(outcome !== 'ok' && openFor ? message(outcome) : undefined);

  function message(o: Outcome) {
    return o === 'limited'
      ? 'A link was sent to this member a moment ago. You can send another in 5 minutes.'
      : 'We could not send the link. Try again.';
  }
  function send() {
    if (!target) return;
    setSending(true);
    setTimeout(() => {
      setSending(false);
      if (outcome !== 'ok') { setErr(message(outcome)); return; }
      setRows((r) => r.map((m) => (m.id === target.id ? { ...m, sentAt: 'Reset link sent just now' } : m)));
      toast.success(`Reset link sent to ${target.email}. It works once and expires in 30 minutes.`);
      setTarget(undefined);
    }, 700);
  }

  const columns: TableColumn<Member>[] = [
    {
      key: 'name', header: 'Member',
      render: (m) => (
        <div className="flex items-center gap-3">
          <Avatar name={m.name} size="sm" />
          <div>
            <div className="font-medium text-ink">{m.name}{m.you ? ' (you)' : ''}</div>
            <div className="text-xs text-ink-subtle">{m.sentAt ?? m.email}</div>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (m) => <RoleBadge role={m.role} /> },
    { key: 'status', header: 'Status', render: (m) => <Badge tone={m.status === 'active' ? 'success' : 'error'} dot size="sm">{m.status === 'active' ? 'Active' : 'Suspended'}</Badge> },
    {
      key: 'actions', header: '', align: 'right',
      render: (m) => (
        <Menu
          trigger={<IconButton icon={DotsThree} label={`Actions for ${m.name}`} variant="subtle" size="sm" />}
          items={[
            { label: 'Edit role', icon: PencilSimple },
            // Hidden entirely without manage:members; disabled for yourself (use Settings) and suspended members.
            ...(allowed ? [{ label: 'Send reset link', icon: KeyReturn, disabled: m.you || m.status === 'suspended', onSelect: () => { setErr(undefined); setTarget(m); } }] : []),
            { type: 'separator' as const },
            { label: 'Deactivate', icon: UserMinus, danger: true },
          ]}
        />
      ),
    },
  ];

  return (
    <PortalShell active="team" title="Team">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader title="Team" description="4 members" />
        <Table columns={columns} data={rows} rowKey={(m) => m.id} />
      </div>
      <Modal
        open={!!target}
        onOpenChange={(o) => { if (!o && !sending) setTarget(undefined); }}
        size="sm"
        title="Send reset link?"
        description={target ? `We will email ${target.email} a link to set a new password. Their current password keeps working until they use it.` : undefined}
        footer={
          <>
            <Button variant="secondary" disabled={sending} onClick={() => setTarget(undefined)}>Cancel</Button>
            <Button loading={sending} onClick={send}>{err ? 'Try again' : 'Send reset link'}</Button>
          </>
        }
      >
        {err && <Notice tone={outcome === 'limited' ? 'warning' : 'error'}>{err}</Notice>}
      </Modal>
      <Toaster />
    </PortalShell>
  );
}

export const MemberList: Story = { name: '1. Member list - row action', render: () => <TeamReset /> };
export const Confirm: Story = { name: '2. Confirm', render: () => <TeamReset openFor="3" /> };
export const SendError: Story = { name: '3. Send failed', render: () => <TeamReset openFor="3" outcome="error" /> };
export const RateLimited: Story = { name: '4. Resent too soon', render: () => <TeamReset openFor="3" outcome="limited" /> };
export const NoPermission: Story = { name: '5. Viewer without manage:members (no action)', render: () => <TeamReset allowed={false} /> };

export const Email: Story = {
  name: '6. Email',
  render: () => (
    <div className="ds-root min-h-screen bg-surface-canvas p-6 font-sans text-ink">
      <Card padding="lg" className="mx-auto flex max-w-lg flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-ink-muted">To</dt><dd>ramon@dizonautocare.ph</dd>
          <dt className="text-ink-muted">Subject</dt><dd className="font-semibold">Reset your ReadyPH password</dd>
        </dl>
        <hr className="border-line" />
        <p>Hi Ramon,</p>
        <p>Maria Santos from Dizon Auto Care asked us to send you a link to set a new password for your ReadyPH account.</p>
        <div><Button>Set new password</Button></div>
        <p className="break-all text-sm text-ink-muted">https://app.readyph.com/reset-password?token=...</p>
        <p className="text-sm text-ink-muted">The link works once and expires in 30 minutes. If you did not expect this, tell your administrator. Your password does not change until you use the link.</p>
      </Card>
    </div>
  ),
};

function SignInNoForgot({ platform }: { platform: 'Inventory' | 'Repair shop' }) {
  return (
    <AuthFrame>
      <Card padding="lg" className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-ink-muted">Sign in with your ReadyPH account to open {platform}.</p>
        </div>
        <Field label="Email" required><Input type="email" placeholder="you@shop.ph" /></Field>
        <Field label="Password" required><Input type="password" /></Field>
        <Button fullWidth>Sign in</Button>
        <p className="text-sm text-ink-muted">Forgot your password? Ask your administrator to send you a reset link.</p>
      </Card>
    </AuthFrame>
  );
}
export const SignInInventory: Story = { name: '7. Inventory sign-in (no Forgot password)', render: () => <SignInNoForgot platform="Inventory" /> };
export const SignInRepairShop: Story = { name: '7. Repair shop sign-in (no Forgot password)', render: () => <SignInNoForgot platform="Repair shop" /> };
