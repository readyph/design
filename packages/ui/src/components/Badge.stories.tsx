import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Badge } from './Badge';
import { Tag } from './Tag';
import { RoleBadge } from './RoleBadge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Feedback/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'A small pill for statuses and labels. Import it from the package and set a `tone`; add `dot` for a leading status dot.',
          '',
          '```tsx',
          "import { Badge } from '@readyph/ui';",
          '',
          '<Badge tone="success">Active</Badge>',
          '<Badge tone="error" dot>Out of stock</Badge>',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(['neutral', 'primary', 'success', 'info', 'warning', 'error'] as const).map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
};

export const WithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="success" dot>
        Active
      </Badge>
      <Badge tone="warning" dot>
        Pending
      </Badge>
      <Badge tone="error" dot>
        Failed
      </Badge>
      <Badge tone="neutral" dot>
        Draft
      </Badge>
    </div>
  ),
};

export const Roles: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {['admin', 'manager', 'member', 'viewer', 'suspended'].map((r) => (
        <RoleBadge key={r} role={r} />
      ))}
    </div>
  ),
};

export const Tags: Story = {
  render: function TagsStory() {
    const [tags, setTags] = useState(['Design', 'Frontend', 'Tokens', 'Accessibility']);
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Tag key={t} onRemove={() => setTags((prev) => prev.filter((x) => x !== t))}>
            {t}
          </Tag>
        ))}
        {tags.length === 0 && <span className="text-sm text-ink-muted">All removed — refresh to reset.</span>}
      </div>
    );
  },
};
