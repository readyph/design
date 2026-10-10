import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import { Notice } from './Notice';
import { ProgressBar } from './ProgressBar';
import { Spinner } from './Spinner';
import { Skeleton } from './Skeleton';
import { Card } from './Card';

const meta: Meta = {
  parameters: { docs: { description: { component: `\`\`\`tsx
import { Notice, ProgressBar, Spinner, Skeleton } from '@readyph/ui';

<Notice tone="warning">Low stock on 3 items.</Notice>
<ProgressBar value={60} />
<Spinner />
<Skeleton className="h-4 w-32" />
\`\`\`` } } },
  title: 'Components/Feedback/Status',
};
export default meta;
type Story = StoryObj;

export const Notices: Story = {
  render: () => (
    <div className="flex max-w-lg flex-col gap-3">
      <Notice tone="info" title="Heads up">
        A new version of the design tokens is available.
      </Notice>
      <Notice tone="success" title="Saved">
        Your changes have been published.
      </Notice>
      <Notice tone="warning" title="Check contrast">
        Blue 500 does not clear 4.5:1 for small white text — use 600/700.
      </Notice>
      <Notice tone="error" title="Publish failed" onDismiss={() => {}}>
        The registry rejected the token. Try again.
      </Notice>
      <Notice tone="neutral">A plain neutral note without a title.</Notice>
    </div>
  ),
};

export const Progress: Story = {
  render: function ProgressStory() {
    const [value, setValue] = useState(30);
    useEffect(() => {
      const id = setInterval(() => setValue((v) => (v >= 100 ? 0 : v + 10)), 800);
      return () => clearInterval(id);
    }, []);
    return (
      <div className="flex max-w-md flex-col gap-5">
        <ProgressBar value={value} label="Upload" />
        <ProgressBar value={value} tone="success" label="Import" />
        <ProgressBar value={null} label="Indeterminate" />
      </div>
    );
  },
};

export const Spinners: Story = {
  render: () => (
    <div className="flex items-center gap-6 text-ink">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <span className="text-primary-600">
        <Spinner size="md" />
      </span>
    </div>
  ),
};

export const Skeletons: Story = {
  render: () => (
    <Card className="w-80">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" width={40} height={40} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" className="mt-2" />
        </div>
      </div>
      <Skeleton className="mt-4" height={80} />
    </Card>
  ),
};
