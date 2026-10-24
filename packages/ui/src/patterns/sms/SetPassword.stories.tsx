import type { Meta, StoryObj } from '@storybook/react';
import { SetPassword } from './SetPassword';

const mobile = {
  layout: 'fullscreen',
  viewport: {
    viewports: { rs390: { name: 'Mobile 390', styles: { width: '390px', height: '844px' } } },
    defaultViewport: 'rs390',
  },
} as const;

/**
 * SMS set-new-password pattern (RDY-90, from the RDY-66 prototype). Pre-login, no shell. One left-aligned form on a
 * Card; validate on blur and submit; focus moves to the first error, or to the heading on
 * success / invalid link. Appearance only: the app wires the reset call. Replaces the
 * temporary RDY-30 screen. Success has no auto sign-in.
 */
const meta: Meta<typeof SetPassword> = {
  tags: ['!autodocs'],
  title: 'SMS/Set password',
  component: SetPassword,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof SetPassword>;

export const Default: Story = {};

export const Mismatch: Story = {
  args: { initial: { password: 'Dizon2026!', confirm: 'Dizon2026', touched: true } },
};

export const TooShort: Story = {
  name: 'Too short',
  args: { initial: { password: 'Dizon1', confirm: 'Dizon1', touched: true } },
};

export const Loading: Story = {
  args: { loading: true, initial: { password: 'Dizon2026!', confirm: 'Dizon2026!', touched: true } },
};

export const InvalidToken: Story = {
  name: 'Invalid or expired link',
  args: { view: 'invalid' },
};

export const Success: Story = {
  args: { view: 'success' },
};

export const DefaultMobile: Story = {
  name: 'Default · mobile',
  parameters: mobile,
};
