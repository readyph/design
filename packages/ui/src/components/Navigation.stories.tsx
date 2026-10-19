import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { House, Package, ChartBar, Gear } from '@phosphor-icons/react';
import { Tabs, TabPanel } from './Tabs';
import { Pagination } from './Pagination';
import { Breadcrumbs } from './Breadcrumbs';

const meta: Meta = {
  parameters: { docs: { description: { component: `\`\`\`tsx
import { Tabs, TabPanel, Pagination, Breadcrumbs } from '@readyph/ui';

<Tabs items={[{ value: 'overview', label: 'Overview' }]}>
  <TabPanel value="overview">Overview content</TabPanel>
</Tabs>
<Pagination page={page} pageCount={12} onPageChange={setPage} />
\`\`\`` } } },
  title: 'Components/Navigation/Tabs & Pagination',
};
export default meta;
type Story = StoryObj;

export const UnderlineTabs: Story = {
  render: () => (
    <Tabs
      items={[
        { value: 'overview', label: 'Overview', icon: House },
        { value: 'inventory', label: 'Inventory', icon: Package, badge: 128 },
        { value: 'reports', label: 'Reports', icon: ChartBar },
        { value: 'settings', label: 'Settings', icon: Gear, disabled: true },
      ]}
    >
      <TabPanel value="overview" className="text-sm text-ink-muted">
        Overview panel content.
      </TabPanel>
      <TabPanel value="inventory" className="text-sm text-ink-muted">
        Inventory panel content.
      </TabPanel>
      <TabPanel value="reports" className="text-sm text-ink-muted">
        Reports panel content.
      </TabPanel>
    </Tabs>
  ),
};

export const UnderlineOnSurfaces: Story = {
  name: 'Underline on window and card',
  render: () => {
    const items = [
      { value: 'a', label: 'Company' },
      { value: 'b', label: 'Schedule' },
      { value: 'c', label: 'Account' },
    ];
    return (
      <div className="flex flex-col gap-6">
        <div data-testid="tabs-window" className="rounded-md bg-surface-canvas p-6">
          <Tabs items={items} />
        </div>
        <div data-testid="tabs-card" className="rounded-md border border-border bg-surface p-6">
          <Tabs items={items} />
        </div>
      </div>
    );
  },
};

export const PillTabs: Story = {
  render: () => (
    <Tabs
      variant="pill"
      items={[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
      ]}
    />
  ),
};

export const PaginationStory: Story = {
  name: 'Pagination',
  render: function PaginationExample() {
    const [page, setPage] = useState(1);
    return (
      <div className="flex flex-col gap-4">
        <Pagination page={page} pageCount={12} onPageChange={setPage} />
        <p className="text-xs text-ink-muted">Page {page} of 12</p>
      </div>
    );
  },
};

export const BreadcrumbsStory: Story = {
  name: 'Breadcrumbs',
  render: () => (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '#' },
        { label: 'Inventory', href: '#' },
        { label: 'Products', href: '#' },
        { label: 'Tangerine crate' },
      ]}
    />
  ),
};
