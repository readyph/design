import type { Meta, StoryObj } from '@storybook/react';
import { SignIn } from '@phosphor-icons/react';
import { ButtonLink } from './ButtonLink';
import { Link } from './Link';

const meta: Meta<typeof ButtonLink> = {
  title: 'Components/Actions/ButtonLink',
  component: ButtonLink,
  tags: ['autodocs'],
  args: { href: '#', children: 'Open report' },
  parameters: { docs: { description: { component: 'ButtonLink and Link (RDY-314). ButtonLink is an anchor drawn as a Button (all variants). Disabled removes `href` and sets `aria-disabled`. `target="_blank"` defaults `rel` to `noopener noreferrer`. Link is an inline text link.' } } },
};
export default meta;
type Story = StoryObj<typeof ButtonLink>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonLink href="#" variant="primary">Primary</ButtonLink>
      <ButtonLink href="#" variant="secondary">Secondary</ButtonLink>
      <ButtonLink href="#" variant="text">Text</ButtonLink>
      <ButtonLink href="#" variant="danger">Danger</ButtonLink>
      <ButtonLink href="#" disabled>Disabled</ButtonLink>
      <ButtonLink href="https://example.com" target="_blank">External</ButtonLink>
    </div>
  ),
};

/** `hero`: the Signed out screen's Sign in (RDY-502): 44px tall, 24px side padding, 15px / 600, 16px icon; 52px tall at phone width. */
export const Hero: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonLink href="#" hero leftIcon={SignIn}>Sign in</ButtonLink>
      <ButtonLink href="#">Default</ButtonLink>
    </div>
  ),
};

export const InlineLink: Story = {
  render: () => (
    <p className="max-w-[var(--place)] text-body text-text">
      Read the <Link href="#">setup guide</Link> or see the <Link href="https://example.com" target="_blank">status page</Link>.
    </p>
  ),
};
