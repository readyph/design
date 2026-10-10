import type { Meta, StoryObj } from '@storybook/react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { Link } from './Link';

const meta: Meta<typeof Link> = {
  parameters: { docs: { description: { component: `\`\`\`tsx
import { Link } from '@readyph/ui';

<Link href="/docs">View documentation</Link>
\`\`\`` } } },
  title: 'Components/Actions/Link',
  component: Link,
  args: { children: 'View documentation', href: '#' },
};
export default meta;
type Story = StoryObj<typeof Link>;

export const Playground: Story = {};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <Link href="#">Default (brand blue)</Link>
      <Link href="#" tone="muted">
        Muted link
      </Link>
      <Link href="#" underline="always">
        Always underlined
      </Link>
      <Link href="https://example.com" external icon={ArrowSquareOut}>
        External link
      </Link>
    </div>
  ),
};

export const InText: Story = {
  render: () => (
    <p className="max-w-md text-sm leading-relaxed text-ink">
      ReadyPH keeps a single source of truth for brand and UI. Read the{' '}
      <Link href="#" underline="always">
        design system overview
      </Link>{' '}
      to see how tokens drive both the Tailwind preset and the CSS-variable theme.
    </p>
  ),
};
