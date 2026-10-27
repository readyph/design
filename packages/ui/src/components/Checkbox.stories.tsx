import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Forms/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: { label: 'Send me the weekly summary', hint: 'Every Monday morning.' },
  parameters: { docs: { description: { component: 'Checkbox (RDY-314): native input, real label, optional hint, indeterminate (`aria-checked="mixed"`), disabled, focus ring and a forced-colors check mark. Space toggles.' } } },
};
export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex w-full max-w-[var(--place)] flex-col gap-field-y">
      <Checkbox label="Unchecked" />
      <Checkbox defaultChecked label="Checked" hint="With a hint." />
      <Checkbox indeterminate label="Indeterminate" />
      <Checkbox disabled label="Disabled" />
      <Checkbox disabled defaultChecked label="Disabled checked" />
      <Checkbox aria-label="Select row" />
    </div>
  ),
};
