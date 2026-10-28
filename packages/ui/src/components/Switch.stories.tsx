import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/Forms/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: { label: 'Answer stock questions', description: 'Leda can tell staff what is in stock.' },
  parameters: {
    docs: {
      description: {
        component: [
          'Switch row (C36): 34x20 track, 14px thumb. The label is 14/20 with an optional description, an example question and a lock note (shown when the switch is read only). Stack rows with `gap-field-y`. Off is a raised track with a faint thumb and border; on is the accent. Keyboard: Tab to focus, Space to toggle. The description, example and lock note are announced as the switch description.',
          '',
          'Behaviour in product: Memory and Leda tabs save at once and offer Undo; System and General drafts are part of Save; read-only views set `disabled` with a `lockNote`.',
          '',
          '```tsx',
          "import { Switch } from '@readyph/ui';",
          '',
          '<Switch defaultChecked label="Answer stock questions" description="Leda can tell staff what is in stock." example="Is the blue kettle in at Cubao?" />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Switch>;

export const Playground: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex w-full max-w-[var(--place)] flex-col gap-field-y">
      <Switch label="Off" description="Default state." />
      <Switch defaultChecked label="On" description="Leda can tell staff what is in stock." />
      <Switch defaultChecked label="With example" description="Leda can tell staff what is in stock." example="Is the blue kettle in at Cubao?" />
      <Switch disabled label="Locked off" lockNote="Managed by your administrator" />
      <Switch disabled defaultChecked label="Locked on" description="Read only in this view." lockNote="Only owners can change this" />
    </div>
  ),
};

export const Settings: Story = {
  render: function SettingsStory() {
    const [a, setA] = useState(true);
    const [b, setB] = useState(false);
    return (
      <div className="flex w-full max-w-[var(--place)] flex-col gap-field-y">
        <Switch checked={a} onCheckedChange={setA} label="Remember supplier names" description="Leda uses them when you ask who sells an item." />
        <Switch checked={b} onCheckedChange={setB} label="Share sales with branches" description="Each branch sees the combined totals." example="How did Pasig do against Cubao?" />
      </div>
    );
  },
};

export const Bare: Story = {
  args: { label: undefined, description: undefined, 'aria-label': 'Lights, Main Lab' },
};

export const SettingsLook: Story = {
  args: { look: 'settings', label: undefined, description: undefined, 'aria-label': 'Email me about low stock' },
  render: function SettingsLookStory(args) {
    return (
      <div className="flex items-center gap-6">
        <Switch {...args} aria-label="Off" />
        <Switch {...args} defaultChecked aria-label="On" />
        <Switch {...args} compact aria-label="Compact" />
      </div>
    );
  },
};
