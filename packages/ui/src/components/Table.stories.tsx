import type { Meta, StoryObj } from '@storybook/react';
import { Table, type TableColumn } from './Table';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { RoleBadge } from './RoleBadge';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
}

const data: Member[] = [
  { id: '1', name: 'Maria Santos', email: 'maria@readyph.com', role: 'admin', status: 'active' },
  { id: '2', name: 'John Lim', email: 'john@readyph.com', role: 'admin', status: 'active' },
  { id: '3', name: 'Ana Reyes', email: 'ana@readyph.com', role: 'member', status: 'invited' },
  { id: '4', name: 'Paolo Cruz', email: 'paolo@readyph.com', role: 'viewer', status: 'suspended' },
];

const statusTone = { active: 'success', invited: 'info', suspended: 'error' } as const;

const columns: TableColumn<Member>[] = [
  {
    key: 'name',
    header: 'Member',
    render: (m) => (
      <div className="flex items-center gap-3">
        <Avatar name={m.name} size="sm" />
        <div>
          <div className="font-medium text-ink">{m.name}</div>
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
      <Badge tone={statusTone[m.status]} dot>
        {m.status}
      </Badge>
    ),
  },
];

const meta: Meta = {
  parameters: { docs: { description: { component: `Define typed columns; the project supplies the rows.

\`\`\`tsx
import { Table, type TableColumn } from '@readyph/ui';

const columns: TableColumn<Member>[] = [
  { key: 'name', header: 'Name', render: (m) => m.name },
];

<Table data={rows} columns={columns} />
\`\`\`` } } },
  title: 'Components/Data display/Table',
};
export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Table columns={columns} data={data} rowKey={(m) => m.id} onRowClick={() => {}} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Table columns={columns} data={[]} rowKey={(m) => m.id} empty="No members yet." />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="max-w-2xl">
      <Table columns={columns} data={[]} rowKey={(m) => m.id} loading />
    </div>
  ),
};
