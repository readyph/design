import type { Meta, StoryObj } from '@storybook/react';
import { ArrowSquareOut } from '@phosphor-icons/react';
import { ButtonLink } from './ButtonLink';

const meta: Meta<typeof ButtonLink> = {
  parameters: { docs: { description: { component: `A real \`<a href>\` styled as a Button, for navigation and cross-app exits (middle-click and copy-link work). Use \`Button\` for actions.

\`\`\`tsx
import { ButtonLink } from '@readyph/ui';

<ButtonLink href="/platforms">Platforms</ButtonLink>
<ButtonLink href={portalUrl} target="_blank" variant="secondary">Manage in Portal</ButtonLink>
\`\`\`` } } },
  title: 'Components/Actions/ButtonLink',
  component: ButtonLink,
  args: { children: 'Link', href: '#', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'subtle', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    leftIcon: { table: { disable: true } },
    rightIcon: { table: { disable: true } },
  },
};
export default meta;
type Story = StoryObj<typeof ButtonLink>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonLink href="#" variant="primary">Primary</ButtonLink>
      <ButtonLink href="#" variant="secondary">Secondary</ButtonLink>
      <ButtonLink href="#" variant="subtle">Subtle</ButtonLink>
      <ButtonLink href="#" variant="danger">Danger</ButtonLink>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <ButtonLink href="#" size="sm">Small</ButtonLink>
      <ButtonLink href="#" size="md">Medium</ButtonLink>
      <ButtonLink href="#" size="lg">Large</ButtonLink>
    </div>
  ),
};

export const External: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonLink href="https://example.com" target="_blank" variant="secondary" rightIcon={ArrowSquareOut}>
        Manage in Portal
      </ButtonLink>
      <ButtonLink href="#" fullWidth>Full width</ButtonLink>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <ButtonLink href="#" disabled>Disabled</ButtonLink>
      <ButtonLink href="#" variant="secondary" disabled>Disabled</ButtonLink>
    </div>
  ),
};
