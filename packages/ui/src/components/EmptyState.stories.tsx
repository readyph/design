import type { Meta, StoryObj } from '@storybook/react';
import { MagnifyingGlass, Package, Plus, Receipt } from '@phosphor-icons/react';
import { EmptyState } from './EmptyState';

const btn = 'inline-flex h-8 items-center rounded-control bg-accent px-3 text-ui font-medium text-accent-ink hover:bg-accent-hover max-sm:min-h-11';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/Feedback/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Empty state (C32): first-run copy plus the next step. Say what will appear and how to start. `align="start"` is the left-aligned inline variant for panels and lists; `center` fills a whole region. For no permission, pass `restricted` naming who can help.',
          '',
          'Changes from the legacy component: `align`, `restricted` and `headingLevel` are new; the icon tile and text use the new tokens. Existing props are unchanged. Compose the `action` from a button.',
          '',
          '```tsx',
          "import { EmptyState } from '@readyph/ui';",
          '',
          '<EmptyState align="start" title="No products yet" description="Add your first product, or ask Leda to import them." action={<button>Add product</button>} />',
          '<EmptyState align="start" title="Reports are for owners" restricted="Ask Maria Santos (owner) for access." />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

const frame = (el: React.ReactNode) => <div className="w-full max-w-[var(--place)] rounded-card border border-border bg-surface sm:max-w-xl">{el}</div>;

export const FirstRun: Story = {
  render: () =>
    frame(
      <EmptyState
        icon={Package}
        title="No products yet"
        description="Add your first product, or ask Leda to import them from a spreadsheet."
        action={<button type="button" className={btn}><Plus aria-hidden size={14} className="mr-1.5" />Add product</button>}
      />,
    ),
};

export const Inline: Story = {
  render: () =>
    frame(
      <EmptyState
        align="start"
        icon={Receipt}
        title="No sales yet today"
        description="Sales appear here as your branches ring them up."
        action={<button type="button" className={btn}>Open the till</button>}
      />,
    ),
};

export const NoResults: Story = {
  render: () => frame(<EmptyState align="start" icon={MagnifyingGlass} title="No matches for &ldquo;kettel&rdquo;" description="Check the spelling or try a shorter search." />),
};

export const NoPermission: Story = {
  render: () => frame(<EmptyState align="start" headingLevel={3} title="Reports are for owners" description="You can see sales, but not profit." restricted="Ask Maria Santos (owner) for access." />),
};
