import type { Meta, StoryObj } from '@storybook/react';
import { TextField, Textarea } from './TextField';

const meta: Meta<typeof TextField> = {
  title: 'Components/Forms/TextField',
  component: TextField,
  tags: ['autodocs'],
  args: { label: 'Name' },
  argTypes: { type: { control: 'inline-radio', options: ['text', 'email', 'tel', 'number'] } },
  decorators: [(Story) => <div className="w-80 max-w-full"><Story /></div>],
  parameters: {
    docs: {
      description: {
        component: [
          'Text field (C43): a real `<label for>`, 13px text, 32px tall (40px on phone), with optional `hint`, `error` and `unit`. The hint or error is in `aria-describedby`; `error` sets `aria-invalid` and replaces the hint. `unit` (for example "bays", "₱ / hour") is a suffix inside the field and is read as part of the description, not the name. `Textarea` has the same label, hint and error and sets its height with `rows`.',
          '',
          '```tsx',
          "import { TextField, Textarea } from '@readyph/ui';",
          '',
          '<TextField label="Capacity" type="number" unit="bays" hint="How many cars at once." />',
          '<Textarea label="Notes" rows={4} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'Give this a clear name, like a branch name.' } };
export const WithError: Story = { args: { defaultValue: '', error: 'Enter a name.', required: true } };
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Auto Works' } };
export const WithUnit: Story = { args: { label: 'Capacity', type: 'number', unit: 'bays', defaultValue: '6' } };
export const UnitWithLongSuffix: Story = { args: { label: 'Labour rate', type: 'number', unit: '₱ / hour', hint: 'Charged per hour.' } };
export const Required: Story = { args: { label: 'Email', type: 'email', required: true, placeholder: 'name@company.ph' } };
export const Large: Story = { args: { size: 'large', hint: '40px (44px on phone), for pages laid out around it.' } };
export const DisabledDark: Story = { args: { disabled: true, defaultValue: 'Auto Works' }, parameters: { backgrounds: { default: 'dark' } } };
export const Phone: Story = { args: { label: 'Phone', type: 'tel', placeholder: '0917 000 0000' } };

export const TextareaField: StoryObj<typeof Textarea> = {
  name: 'Textarea',
  render: () => <Textarea label="What Leda should know" hint="Plain sentences work best." rows={4} />,
};
export const TextareaError: StoryObj<typeof Textarea> = {
  render: () => <Textarea label="What Leda should know" error="Add at least a sentence." rows={3} />,
};

export const NarrowSheet: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  decorators: [(Story) => <div className="w-[320px] max-w-full"><Story /></div>],
  render: () => (
    <div className="flex flex-col gap-4">
      <TextField label="Business name with a rather long label that wraps" hint="A long hint that should wrap and never scroll sideways at 320px." />
      <TextField label="Labour rate" type="number" unit="₱ / hour" />
      <Textarea label="Notes" rows={3} />
    </div>
  ),
};
