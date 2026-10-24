/**
 * PROTOTYPE (RDY-178, epic RDY-173 features 3, 6, 7) - Portal Team page in the Slack-style shell.
 * Same functions as portal `TeamPage`: members with role, status and last active; invite and
 * resend/revoke; change role; suspend/reactivate; admin "Send reset link" (with its rules); roles
 * and SMS access. Table rows 36px, compact 32px; dialogs at 8px radius. Layout, density, theme only.
 */
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  DotsThree,
  KeyReturn,
  LockKey,
  PaperPlaneTilt,
  Plus,
  Shield,
  UserCirclePlus,
  UserMinus,
  Users,
} from '@phosphor-icons/react';
import { Avatar } from '../../components/Avatar';
import { Badge, type BadgeTone } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Field } from '../../components/Field';
import { Icon } from '../../components/Icon';
import { IconButton } from '../../components/IconButton';
import { Input } from '../../components/Input';
import { Menu, type MenuItem } from '../../components/Menu';
import { Modal } from '../../components/Modal';
import { Notice } from '../../components/Notice';
import { RoleBadge } from '../../components/RoleBadge';
import { SearchBar } from '../../components/SearchBar';
import { SegmentedControl } from '../../components/SegmentedControl';
import { Select } from '../../components/Select';
import { Table, type TableColumn } from '../../components/Table';
import { toast } from '../../components/toast/toastStore';
import { cn } from '../../utils/cn';
import type { LedaState, ShellRole, ShellTheme } from '../portal-shell/Shell';
import { PortalFrame, useContentWidth, useLedaTrigger } from './common';
import {
  ME_ID,
  ROLES,
  SEED_INVITES,
  SEED_MEMBERS,
  SMS_ACCESS,
  roleLabel,
  type Invite,
  type Member,
  type MemberStatus,
} from './data';

export type TeamDialog = 'none' | 'invite' | 'invite-error' | 'reset' | 'reset-limited';
export type Density = 'default' | 'compact';

export interface TeamPrototypeProps {
  theme?: ShellTheme;
  role?: ShellRole;
  leda?: LedaState;
  density?: Density;
  dialog?: TeamDialog;
  /** `just-you`: only the creator, no invites (first-run empty state). */
  state?: 'ready' | 'just-you';
}

const statusBadge: Record<MemberStatus, { tone: BadgeTone; label: string }> = {
  ACTIVE: { tone: 'success', label: 'Active' },
  SUSPENDED: { tone: 'error', label: 'Suspended' },
};

const roleTone = (name: string): BadgeTone | undefined => (name === 'admin' ? 'primary' : undefined);

export function TeamPrototype({
  theme = 'light',
  role = 'admin',
  leda: initialLeda = 'closed',
  density: initialDensity = 'default',
  dialog = 'none',
  state = 'ready',
}: TeamPrototypeProps) {
  const { leda } = useLedaTrigger(initialLeda);
  const { ref, width } = useContentWidth<HTMLDivElement>();
  const wide = width >= 600;
  const [members, setMembers] = useState<Member[]>(state === 'just-you' ? SEED_MEMBERS.slice(0, 1) : SEED_MEMBERS);
  const [invites, setInvites] = useState<Invite[]>(state === 'just-you' ? [] : SEED_INVITES);
  const [density, setDensity] = useState<Density>(initialDensity);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(dialog === 'invite' || dialog === 'invite-error');
  const [resetTarget, setResetTarget] = useState<Member | null>(
    dialog === 'reset' || dialog === 'reset-limited' ? SEED_MEMBERS[3] : null,
  );
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  if (role !== 'admin') {
    return (
      <PortalFrame theme={theme} role={role} page="team" leda={leda}>
        <Card padding="none">
          <EmptyState
            icon={LockKey}
            title="You don't have access to the team"
            description="Ask a company admin if you need to view or manage team members."
          />
        </Card>
      </PortalFrame>
    );
  }

  const viewer = members.find((m) => m.id === ME_ID);
  const canReset = (m: Member) =>
    m.id !== ME_ID && m.status === 'ACTIVE' && !m.creator && (m.role !== 'admin' || !!viewer?.creator);

  const visible = members.filter((m) => {
    const q = query.trim().toLowerCase();
    const hit = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    const st = filter === 'all' || (filter === 'active' ? m.status === 'ACTIVE' : m.status === 'SUSPENDED');
    return hit && st;
  });

  const setStatus = (m: Member, status: MemberStatus) => {
    setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, status } : x)));
    toast.success(status === 'SUSPENDED' ? `${m.name} is suspended.` : `${m.name} is active again.`);
  };

  const rowMenu = (m: Member): MenuItem[] => [
    { type: 'label', label: 'Change role' },
    ...ROLES.filter((r) => r.name !== m.role).map<MenuItem>((r) => ({
      label: `Make ${roleLabel(r.name)}`,
      icon: Shield,
      disabled: m.creator,
      onSelect: () => setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role: r.name } : x))),
    })),
    { type: 'separator' },
    { label: 'Send reset link', icon: KeyReturn, disabled: !canReset(m), onSelect: () => setResetTarget(m) },
    { type: 'separator' },
    m.status === 'SUSPENDED'
      ? { label: 'Reactivate', icon: UserCirclePlus, onSelect: () => setStatus(m, 'ACTIVE') }
      : { label: 'Suspend', icon: UserMinus, danger: true, disabled: m.creator || m.id === ME_ID, onSelect: () => setStatus(m, 'SUSPENDED') },
  ];

  const actions = (m: Member) => (
    <Menu
      align="end"
      trigger={<IconButton icon={DotsThree} label={`Actions for ${m.name}`} variant="subtle" size="sm" />}
      items={rowMenu(m)}
    />
  );

  const nameCell = (m: Member) => (
    <span className="flex min-w-0 items-center gap-2">
      <Avatar name={m.name} size="xs" />
      <span className="font-medium text-ink">
        {m.name}
        {m.you && <span className="font-normal text-ink-subtle"> (you)</span>}
      </span>
      {m.creator && (
        <Badge tone="neutral" size="sm">
          Creator
        </Badge>
      )}
    </span>
  );

  const allColumns: (TableColumn<Member> | false)[] = [
    { key: 'name', header: 'Member', render: nameCell },
    width >= 720 && {
      key: 'email',
      header: 'Email',
      render: (m) => <span className="text-ink-muted">{sentIds.has(m.id) ? 'Reset link sent just now' : m.email}</span>,
    },
    { key: 'role', header: 'Role', width: '9rem', render: (m) => <RoleBadge role={m.role} tone={roleTone(m.role)} size="sm" /> },
    {
      key: 'status',
      header: 'Status',
      width: '7.5rem',
      render: (m) => (
        <Badge tone={statusBadge[m.status].tone} dot size="sm">
          {statusBadge[m.status].label}
        </Badge>
      ),
    },
    width >= 880 && {
      key: 'last',
      header: 'Last active',
      width: '7rem',
      render: (m) => <span className="whitespace-nowrap text-ink-muted">{m.lastActive}</span>,
    },
    { key: 'actions', header: <span className="sr-only">Actions</span>, width: '3rem', align: 'right', render: actions },
  ];
  const columns = allColumns.filter((c): c is TableColumn<Member> => c !== false);

  const roleCounts = new Map<string, number>();
  for (const m of members) roleCounts.set(m.role, (roleCounts.get(m.role) ?? 0) + 1);
  const pending = invites.length;
  const justYou = members.length === 1 && pending === 0;

  return (
    <PortalFrame theme={theme} role={role} page="team" leda={leda}>
      <div ref={ref} className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar
            size="sm"
            placeholder="Search members"
            aria-label="Search members"
            value={query}
            onValueChange={setQuery}
            onClear={() => setQuery('')}
            className="w-full sm:w-64"
          />
          <SegmentedControl
            size="sm"
            className="p-0.5"
            aria-label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
          <SegmentedControl
            size="sm"
            aria-label="Row density"
            className={cn('p-0.5', !wide && 'hidden')}
            value={density}
            onChange={(v) => setDensity(v as Density)}
            options={[
              { value: 'default', label: 'Default' },
              { value: 'compact', label: 'Compact' },
            ]}
          />
          <Button leftIcon={Plus} className="ml-auto" onClick={() => setInviteOpen(true)}>
            Invite member
          </Button>
        </div>

        {justYou ? (
          <Card padding="none">
            <EmptyState
              icon={Users}
              title="Just you so far"
              description="Invite staff and mechanics and choose their role, which sets SMS and Inventory access."
              action={
                <Button leftIcon={Plus} onClick={() => setInviteOpen(true)}>
                  Invite member
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            {wide ? (
              <Table
                columns={columns}
                data={visible}
                rowKey={(m) => m.id}
                dense={density === 'compact'}
                empty={<span>No members match &ldquo;{query}&rdquo;.</span>}
              />
            ) : (
              <MemberList members={visible} sentIds={sentIds} actions={actions} query={query} />
            )}
            <p className="text-xs text-ink-subtle">
              {members.length} members · {pending} pending invitation{pending === 1 ? '' : 's'}
            </p>
          </>
        )}

        <div className={cn('grid grid-cols-1 gap-3', width >= 1000 && 'grid-cols-2')}>
          <section aria-labelledby="pending-h" className="flex min-w-0 flex-col gap-2">
            <h2 id="pending-h" className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
              Pending invitations
              <Badge tone="neutral" size="sm">
                {pending}
              </Badge>
            </h2>
            <Card padding="none">
              {pending === 0 ? (
                <p className="flex h-row items-center gap-2 px-3 text-sm text-ink-subtle">
                  <Icon icon={PaperPlaneTilt} size="sm" /> No pending invitations.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {invites.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5">
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="break-all text-sm text-ink">{i.email}</span>
                        <span className="text-xs text-ink-subtle">
                          Invited as {roleLabel(i.role)} · {i.sent}
                        </span>
                      </div>
                      {i.expired && (
                        <Badge tone="warning" size="sm">
                          Expired
                        </Badge>
                      )}
                      <span className="flex gap-1">
                        <Button size="sm" variant="subtle" onClick={() => toast.success(`Invitation emailed to ${i.email}.`)}>
                          Resend
                        </Button>
                        <Button size="sm" variant="subtle" onClick={() => setInvites((prev) => prev.filter((x) => x.id !== i.id))}>
                          Revoke
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section aria-labelledby="roles-h" className="flex min-w-0 flex-col gap-2">
            <h2 id="roles-h" className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
              Roles and permissions
              <Badge tone="neutral" size="sm">
                {ROLES.length}
              </Badge>
            </h2>
            <Card padding="none">
              <ul className="divide-y divide-border">
                {ROLES.map((r) => (
                  <li key={r.name} className="flex items-start gap-2 px-3 py-1.5">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium text-ink">{roleLabel(r.name)}</span>
                      <span className="text-xs text-ink-muted">{r.description}</span>
                    </div>
                    <Badge tone="neutral" size="sm" aria-label={`${roleCounts.get(r.name) ?? 0} members`}>
                      {roleCounts.get(r.name) ?? 0}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="border-t border-border px-3 py-2 text-xs text-ink-muted">
                SMS access follows the role: {SMS_ACCESS.join(', ')}. Change a member&apos;s role to grant or revoke it.
              </p>
            </Card>
          </section>
        </div>
      </div>

      <InviteModal
        open={inviteOpen}
        initialError={dialog === 'invite-error'}
        onOpenChange={setInviteOpen}
        onCreate={(email, r) => {
          setInvites((prev) => [...prev, { id: `i-${Date.now()}`, email, role: r, sent: 'just now' }]);
          setInviteOpen(false);
          toast.success(`${email} added to pending invitations. Use Resend to email the link.`);
        }}
      />

      <ResetLinkModal
        member={resetTarget}
        limited={dialog === 'reset-limited'}
        onClose={() => setResetTarget(null)}
        onSent={(m) => {
          setSentIds((prev) => new Set(prev).add(m.id));
          toast.success(`Reset link sent to ${m.email}. It works once and expires in 30 minutes.`);
          setResetTarget(null);
        }}
      />
    </PortalFrame>
  );
}

/** Below md: divided list; name, email and badges each get their own line. */
function MemberList({
  members,
  sentIds,
  actions,
  query,
}: {
  members: Member[];
  sentIds: Set<string>;
  actions: (m: Member) => ReactNode;
  query: string;
}) {
  return (
    <Card padding="none">
      {members.length === 0 ? (
        <p className="px-3 py-3 text-sm text-ink-muted">No members match &ldquo;{query}&rdquo;.</p>
      ) : (
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex items-start gap-2 px-3 py-2">
              <Avatar name={m.name} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-ink">
                  {m.name}
                  {m.you && <span className="font-normal text-ink-subtle">(you)</span>}
                  {m.creator && (
                    <Badge tone="neutral" size="sm">
                      Creator
                    </Badge>
                  )}
                </span>
                <span className="break-all text-xs text-ink-muted">{sentIds.has(m.id) ? 'Reset link sent just now' : m.email}</span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <RoleBadge role={m.role} tone={roleTone(m.role)} size="sm" />
                  <Badge tone={statusBadge[m.status].tone} dot size="sm">
                    {statusBadge[m.status].label}
                  </Badge>
                  <span className="text-xs text-ink-subtle">Active {m.lastActive}</span>
                </span>
              </div>
              {actions(m)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteModal({
  open,
  initialError,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  initialError: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (email: string, role: string) => void;
}) {
  const [email, setEmail] = useState(initialError ? 'carlo@acmemotors' : '');
  const [role, setRole] = useState('user');
  const [tried, setTried] = useState(initialError);
  const selected = useMemo(() => ROLES.find((r) => r.name === role), [role]);
  const trimmed = email.trim();
  const emailError = tried && !EMAIL_OK.test(trimmed) ? 'Enter a valid email.' : undefined;
  const close = (o: boolean) => {
    if (!o) {
      setEmail('');
      setRole('user');
      setTried(false);
    }
    onOpenChange(o);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!EMAIL_OK.test(trimmed)) return;
    onCreate(trimmed, role);
    setEmail('');
    setTried(false);
  };
  return (
    <Modal
      open={open}
      onOpenChange={close}
      size="sm"
      title="Invite a team member"
      description="Add them here, then use Resend on the pending invitation to email them a link to join."
      footer={
        <>
          <Button variant="subtle" onClick={() => close(false)}>
            Cancel
          </Button>
          <Button type="submit" form="invite-member-form">
            Send invite
          </Button>
        </>
      }
    >
      <form id="invite-member-form" onSubmit={submit} noValidate className="flex flex-col gap-3">
        <Field label="Email" required error={emailError}>
          <Input type="email" autoFocus autoComplete="off" placeholder="name@company.ph" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Role" hint={selected?.description ?? 'The role sets which platforms and actions they can use.'}>
          <Select value={role} onValueChange={setRole} options={ROLES.map((r) => ({ value: r.name, label: roleLabel(r.name) }))} />
        </Field>
      </form>
    </Modal>
  );
}

function ResetLinkModal({
  member,
  limited,
  onClose,
  onSent,
}: {
  member: Member | null;
  limited: boolean;
  onClose: () => void;
  onSent: (m: Member) => void;
}) {
  return (
    <Modal
      open={!!member}
      onOpenChange={(o) => !o && onClose()}
      size="sm"
      title="Send reset link?"
      description={
        member
          ? `We will email ${member.email} a link to set a new password. Their current password keeps working until they use it.`
          : undefined
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={limited} onClick={() => member && onSent(member)}>
            Send reset link
          </Button>
        </>
      }
    >
      {limited && <Notice tone="warning">A link was sent to this member a moment ago. You can send another in 5 minutes.</Notice>}
    </Modal>
  );
}
