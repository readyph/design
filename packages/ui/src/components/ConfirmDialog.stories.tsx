import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';
import { Button } from './Button';
import { PlatformLogo } from './PlatformLogo';
import { Plugs } from '@phosphor-icons/react';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Components/Overlays/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Delete confirmation (C12) on `Modal`: 420px, `role="alertdialog"` named by the title and described by the consequence line.',
          'The item sits in a tinted box with its icon or platform logo and one context line. Focus starts on **Cancel**; Esc, Cancel and the backdrop cancel and return focus to the opener. While `loading`, they are ignored. Phone: stays centred, buttons 44px and full width.',
          '',
          '```tsx',
          "import { ConfirmDialog } from '@readyph/ui';",
          '',
          '<ConfirmDialog open={open} onOpenChange={setOpen} tone="danger" title="Delete this topic?"',
          '  name="Opening hours" context="Custom topic" description="This cannot be undone."',
          '  confirmLabel="Delete" onConfirm={remove} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

function Demo({ label = 'Delete topic', ...props }: Partial<ConfirmDialogProps> & { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>{label}</Button>
      <ConfirmDialog
        title="Delete this topic?"
        description="This cannot be undone."
        confirmLabel="Delete"
        tone="danger"
        {...props}
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => setOpen(false)}
      />
    </>
  );
}

export const Danger: Story = {
  render: () => <Demo name="Opening hours" context="Custom topic · changed Tue 20 Oct" />,
};

export const PlatformLogoItem: Story = {
  name: 'With platform logo',
  render: () => (
    <Demo
      label="Disconnect"
      title="Disconnect Parts Stockroom?"
      name="Parts Stockroom"
      context="Inventory · 3 data links"
      iconNode={<PlatformLogo name="Parts Stockroom" index={2} size={24} decorative />}
      description="This removes it and its data links. This can't be undone."
      confirmLabel="Disconnect"
    />
  ),
};

export const LongName: Story = {
  render: () => (
    <Demo
      name="Dela Cruz Auto Works and Allied Services Incorporated Quezon City Branch Annex Number 2 (Seasonal)"
      context="Custom topic · a very long context line that should wrap instead of overflowing the dialog edge"
    />
  ),
};

export const NoItem: Story = {
  name: 'Without item box',
  render: () => (
    <Demo label="New conversation" title="Start a new conversation?" tone="primary" confirmLabel="Start new" description="The current conversation is cleared." />
  ),
};

export const CustomIcon: Story = {
  render: () => <Demo name="Link to Stockroom" context="Auto Works reads its catalog" icon={Plugs} title="Remove this link?" confirmLabel="Remove" />,
};

export const Loading: Story = {
  render: () => <Demo name="Opening hours" context="Custom topic" loading />,
};
