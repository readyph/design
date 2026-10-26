import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RolePicker, type RolePickerProps, type RolePickerValue } from './RolePicker';
import { eight, lockedPlatforms, manyRoles, platforms, roleOptions, saved } from './RolePicker.data';

const meta: Meta<typeof RolePicker> = {
  title: 'Components/Forms/Role picker',
  component: RolePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Per-platform role picker (C22): one row per platform (logo, name, kind, `Select` of "Not assigned" + that kind\'s roles, the role line), company access radios, and one Save / Discard on a draft. Admin and Owner replace the rows with "Full access to every platform" (announced politely; focus stays on the radio).',
          '',
          '**Keyboard.** Tab goes row by row: each dropdown, then the Portal access group (one tab stop; arrows move and choose), then Save, Discard. Locked rows are skipped but their reason is read with the dropdown (`aria-describedby`). Each dropdown is named "Role for {platform}".',
          '',
          '**Data for Leonardo.** `value {access: owner|admin|member, roles: Record<platformId, roleId|null>}` (the draft), `savedValue` (same shape; dirty = they differ), `onChange(next)`, `onSave(value)`, `onDiscard()` (the page resets `value`), `platforms[] {id,name,kind,locked?,reason?, +logo props}`, `roleOptions: Record<kind, {id,name,about?}[]>` with `fallbackKind`. Also `saving`, `error`, `accessReason`, `readOnly`/`readOnlyReason`, `hideAccess`, `subject`. After a successful save the page shows `toast.undo(...)` and leaves leaving-with-unsaved-changes to its own router.',
        ].join('\n'),
      },
    },
  },
  decorators: [(Story) => <div className="max-w-[640px] bg-surface p-4"><Story /></div>],
};
export default meta;
type Story = StoryObj<typeof RolePicker>;

function Harness(props: Partial<RolePickerProps> & { start?: RolePickerValue }) {
  const [savedValue, setSaved] = useState(props.start ?? saved);
  const [value, setValue] = useState(props.start ?? saved);
  return (
    <RolePicker
      platforms={platforms}
      roleOptions={roleOptions}
      subject="Maria"
      {...props}
      value={value}
      savedValue={savedValue}
      onChange={setValue}
      onDiscard={() => setValue(savedValue)}
      onSave={(v) => setSaved(v)}
    />
  );
}

export const Default: Story = { render: () => <Harness /> };
export const Dirty: Story = { render: () => <Harness start={saved} /> , play: async ({ canvasElement }) => { const b = canvasElement.querySelector<HTMLElement>('[role=combobox]'); b?.focus(); } };
export const LockedRow: Story = { render: () => <Harness platforms={lockedPlatforms} /> };
export const Admin: Story = { render: () => <Harness start={{ access: 'admin', roles: saved.roles }} /> };
export const OwnerLocked: Story = { render: () => <Harness start={{ access: 'owner', roles: saved.roles }} accessReason="Maria created this company, so she stays the Owner." /> };
export const NoRoleWarning: Story = { render: () => <Harness start={{ access: 'member', roles: { aw: null, sr: null, cf: null } }} /> };
export const Saving: Story = { render: () => <Harness saving /> };
export const SaveError: Story = { render: () => <Harness error="Could not save. Check your connection and try again." /> };
export const ReadOnly: Story = { render: () => <Harness readOnly readOnlyReason="Only an owner or admin can change roles." /> };
export const SinglePlatformForm: Story = { render: () => <Harness platforms={platforms.slice(0, 1)} hideAccess /> };
export const EightPlatformsLongNames: Story = { render: () => <Harness platforms={eight} roleOptions={manyRoles} start={{ access: 'member', roles: {} }} className="mt-2" /> };
