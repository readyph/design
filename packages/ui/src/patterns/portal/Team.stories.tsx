import type { Meta, StoryObj } from '@storybook/react';
import { Plus, DotsThree, PencilSimple, UserMinus, PaperPlaneTilt, Shield } from '@phosphor-icons/react';
import { PageHeader } from '../../components/PageHeader';
import { Table, type TableColumn } from '../../components/Table';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { RoleBadge } from '../../components/RoleBadge';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Menu } from '../../components/Menu';
import { Card } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { PortalShell } from './shell';

/**
 * Team — user management (RBAC). Members with their role and status, plus
 * pending invitations and the role model. See 03-Portal.md §8. Mock data.
 */
const meta: Meta = {
  tags: ['!autodocs'],
  title: 'Portal/Team',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  lastActive: string;
  creator?: boolean;
}

const members: Member[] = [
  { id: '1', name: 'Maria Santos', email: 'maria@readyph.com', role: 'admin', status: 'active', lastActive: 'now', creator: true },
  { id: '2', name: 'John Lim', email: 'john@readyph.com', role: 'admin', status: 'active', lastActive: '2h ago' },
  { id: '3', name: 'Ana Reyes', email: 'ana@readyph.com', role: 'manager', status: 'active', lastActive: 'yesterday' },
  { id: '4', name: 'Paolo Cruz', email: 'paolo@readyph.com', role: 'member', status: 'active', lastActive: '3d ago' },
  { id: '5', name: 'Lea Dizon', email: 'lea@readyph.com', role: 'member', status: 'suspended', lastActive: '2w ago' },
];

const columns: TableColumn<Member>[] = [
  {
    key: 'name',
    header: 'Member',
    render: (m) => (
      <div className="flex items-center gap-3">
        <Avatar name={m.name} size="sm" />
        <div>
          <div className="flex items-center gap-2 font-medium text-ink">
            {m.name}
            {m.creator && (
              <Badge tone="neutral" size="sm">
                Creator
              </Badge>
            )}
          </div>
          <div className="text-xs text-ink-subtle">{m.email}</div>
        </div>
      </div>
    ),
  },
  { key: 'role', header: 'Role', render: (m) => <RoleBadge role={m.role} /> },
  {
    key: 'status',
    header: 'Status',
    render: (m) => (
      <Badge tone={m.status === 'active' ? 'success' : 'error'} dot size="sm">
        {m.status === 'active' ? 'Active' : 'Suspended'}
      </Badge>
    ),
  },
  { key: 'lastActive', header: 'Last active', render: (m) => <span className="text-ink-muted">{m.lastActive}</span> },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: () => (
      <Menu
        trigger={<IconButton icon={DotsThree} label="Member actions" variant="subtle" size="sm" />}
        items={[
          { label: 'Edit role', icon: PencilSimple },
          { label: 'Resend invite', icon: PaperPlaneTilt },
          { type: 'separator' },
          { label: 'Deactivate', icon: UserMinus, danger: true },
        ]}
      />
    ),
  },
];

const invites = [
  { email: 'carlo@readyph.com', role: 'member', sent: '1d ago' },
  { email: 'nina@readyph.com', role: 'manager', sent: '3d ago' },
];

const roles = [
  { name: 'Administrator', desc: 'Full access: platforms, team, billing, and settings.', count: 2 },
  { name: 'Manager', desc: 'Run operations; no billing or team removal.', count: 2 },
  { name: 'Member', desc: 'Day-to-day tasks on assigned platforms.', count: 4 },
];

export const Team: Story = {
  name: 'Team (RBAC)',
  render: () => (
    <PortalShell active="team" title="Team">
      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        <PageHeader
          title="Team"
          description="5 members · 2 pending invitations"
          actions={<Button leftIcon={Plus}>Invite member</Button>}
        />

        <Table columns={columns} data={members} rowKey={(m) => m.id} />

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Pending invitations</h2>
          <Card padding="none">
            <ul className="divide-y divide-border">
              {invites.map((i) => (
                <li key={i.email} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-muted text-ink-subtle">
                    <Icon icon={PaperPlaneTilt} size="sm" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">{i.email}</p>
                    <p className="text-xs text-ink-subtle">Invited as {i.role} · {i.sent}</p>
                  </div>
                  <Button size="sm" variant="subtle">Resend</Button>
                  <Button size="sm" variant="subtle">Revoke</Button>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Icon icon={Shield} size="sm" className="text-ink-subtle" />
            <h2 className="text-sm font-semibold text-ink">Roles &amp; permissions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {roles.map((r) => (
              <Card key={r.name}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">{r.name}</p>
                  <Badge tone="neutral" size="sm">{r.count}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{r.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PortalShell>
  ),
};
