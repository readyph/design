import type { Meta, StoryObj } from '@storybook/react';
import { ActionLink, BackLink } from './ActionLink';

const meta: Meta<typeof ActionLink> = {
  title: 'Components/Actions/ActionLink',
  component: ActionLink,
  tags: ['autodocs'],
  args: { href: '#', children: 'Open', caret: true },
  parameters: { docs: { description: { component: 'Action link and back link (RDY-380, I1). Accent, 600, no underline; hover changes text colour only. Quiet is muted text, never a link. Source: inventory-home FINAL/links.css 8-50.' } } },
};
export default meta;
type Story = StoryObj<typeof ActionLink>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <ActionLink href="#" caret>Receive</ActionLink>
      <ActionLink href="#">No caret</ActionLink>
      <ActionLink onClick={() => {}} caret>As button</ActionLink>
      <ActionLink quiet>Settled</ActionLink>
    </div>
  ),
};

export const InClickableRow: Story = {
  render: () => (
    <div className="group/row flex w-64 items-center justify-between rounded-[4px] border border-border p-3 text-body text-text">
      <span>Row hover tints the link</span>
      <ActionLink href="#" caret>Open</ActionLink>
    </div>
  ),
};

export const Back: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      <BackLink href="#">Today</BackLink>
      <BackLink href="#">This week</BackLink>
      <BackLink onClick={() => {}}>Order lists</BackLink>
    </div>
  ),
};
