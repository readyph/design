import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { Bell, Gear, House, Package, Users } from '@phosphor-icons/react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardHeader } from '../components/Card';
import { Chat, ChatHeader, ChatInput, ChatMessage, ChatMessages } from '../components/Chat';
import { IconRail, IconRailItem } from '../components/IconRail';
import { Input } from '../components/Input';
import { LedaLauncher } from '../components/LedaLauncher';
import { Menu } from '../components/Menu';
import { Select } from '../components/Select';
import { Sidebar, SidebarItem, SidebarSection } from '../components/Sidebar';
import { Table, type TableColumn } from '../components/Table';
import { cn } from '../utils/cn';

const meta: Meta = {
  title: 'Foundations/Specimen',
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

interface Row {
  id: string;
  platform: string;
  status: 'Active' | 'Offline';
}
const rows: Row[] = [
  { id: '1', platform: 'Inventory', status: 'Active' },
  { id: '2', platform: 'SMS', status: 'Offline' },
];
const columns: TableColumn<Row>[] = [
  { key: 'platform', header: 'Platform' },
  {
    key: 'status',
    header: 'Status',
    render: (r) => (
      <Badge tone={r.status === 'Active' ? 'success' : 'neutral'} size="sm" dot>
        {r.status}
      </Badge>
    ),
  },
];

/** Both themes use the real scopes: light via [data-theme="light"], dark via [data-theme="dark"]. */
function Pane({ theme, children }: { theme: 'light' | 'dark'; children: ReactNode }) {
  return (
    <section data-theme={theme} className="ds-root flex min-w-0 flex-col gap-4 bg-surface-canvas p-4 text-ink">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">{theme}</p>
      {children}
    </section>
  );
}

function Specimen({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <Pane theme={theme}>
      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-ink">Controls (32px)</h3>
          <Badge tone="primary">Primary</Badge>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Save</Button>
          <Button variant="secondary">Cancel</Button>
          <Input placeholder="Search" aria-label={`Input ${theme}`} className="w-40" />
          <Select
            aria-label={`Select ${theme}`}
            options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]}
            defaultValue="a"
            className="w-36"
          />
          <Menu
            trigger={<Button variant="secondary">Menu</Button>}
            items={[{ label: 'Profile', onSelect: () => undefined }, { type: 'separator' }, { label: 'Sign out', onSelect: () => undefined }]}
          />
        </div>
      </Card>
      <div className="flex flex-col gap-2">
        <Table columns={columns} data={rows} rowKey={(r) => r.id} />
        <Table columns={columns} data={rows} rowKey={(r) => r.id} dense />
      </div>
      <div className={cn('flex h-72 overflow-hidden rounded-base border border-border')}>
        <IconRail className="shrink-0">
          <IconRailItem icon={House} label="Home" active />
          <IconRailItem icon={Package} label="Inventory" />
          <IconRailItem icon={Users} label="Team" />
        </IconRail>
        <Sidebar className="shrink-0">
          <SidebarSection title="Workspace">
            <SidebarItem icon={House} active>Home</SidebarItem>
            <SidebarItem icon={Bell} badge={3}>Notifications</SidebarItem>
            <SidebarItem icon={Gear}>Settings</SidebarItem>
          </SidebarSection>
        </Sidebar>
        <div className="relative min-w-0 flex-1 bg-surface p-3">
          <Chat size="md" aria-label="Leda" className="h-full w-full">
            <ChatHeader title="Leda" />
            <ChatMessages>
              <ChatMessage role="assistant">How can I help?</ChatMessage>
              <ChatMessage role="user">Show low stock</ChatMessage>
            </ChatMessages>
            <ChatInput />
          </Chat>
        </div>
      </div>
      <div className="relative h-16">
        <LedaLauncher className="!bottom-0 !right-0" />
      </div>
    </Pane>
  );
}

export const LightAndDark: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
      <Specimen theme="light" />
      <Specimen theme="dark" />
    </div>
  ),
};
