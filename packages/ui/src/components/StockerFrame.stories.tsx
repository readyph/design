import type { Meta, StoryObj } from '@storybook/react';
import { StockerFrame } from './StockerFrame';

const account = { initials: 'MR', name: 'Mara Reyes', href: '#' };

const meta: Meta<typeof StockerFrame> = {
  title: 'Components/Layout/StockerFrame',
  component: StockerFrame,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      story: { inline: false, iframeHeight: 740 },
      description: {
        component:
          'Stocker app frame (RDY-399, I17): header, step line, one question, pinned primary-action bar and bottom tab bar. Column max 520px. Source: inventory-home round-1/final stocker.css, stocker.js frame(). Not present: Leda, palette, rail, tooltips.',
      },
    },
  },
  args: { platform: 'Parts Stockroom', account, homeHref: '#' },
};
export default meta;
type Story = StoryObj<typeof StockerFrame>;

export const PageWithTabs: Story = {
  args: { title: 'What do you want to do?', lead: <><b>2 to receive</b>, 1 to send, 1 to check in</>, tab: 'home' },
};

export const AccountCurrent: Story = {
  args: { title: 'Account', tab: 'home', account: { ...account, current: true } },
};

export const Flow: Story = {
  args: {
    title: 'Find the product',
    steps: { n: 2, of: 3, label: 'Find the product' },
    back: { href: '#', label: 'Stock out' },
    bar: (
      <>
        <p className="mb-2 text-[14px] leading-5 text-text">Stock goes from 4 to 3. It will be low stock.</p>
        <a href="#" className="inline-flex min-h-[var(--tap-big)] w-full items-center justify-center rounded-[8px] bg-accent px-5 text-[16px] font-semibold leading-[22px] text-accent-ink">
          Take out
        </a>
      </>
    ),
  },
};

export const Snack: Story = {
  args: { title: 'Find a product', tab: 'find', snack: 'Taken out. Undo' },
};

export const SignedOut: Story = {
  args: { title: 'You are signed out', lead: 'Your work is saved. Sign in to carry on.', signedOut: true },
};
