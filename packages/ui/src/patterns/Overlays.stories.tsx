import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Select } from '../components/Select';
import { Menu } from '../components/Menu';
import { Modal } from '../components/Modal';
import { OffCanvas } from '../components/Drawer';

const meta: Meta = {
  title: 'Patterns/Overlays',
  parameters: {
    docs: {
      description: {
        component:
          'Prototype: a Select or a Menu opened inside a Modal or an OffCanvas. The listbox and menu use the `popover` z-index token, which sits above `modal` and `drawer`, so they can be picked with the pointer.',
      },
    },
  },
};
export default meta;
type Story = StoryObj;

const reasons = [
  { value: 'received', label: 'Stock received' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'returned', label: 'Customer return' },
  { value: 'correction', label: 'Count correction' },
];

export const SelectInModal: Story = {
  name: 'Select inside a Modal',
  render: function SelectInModalExample() {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<string>();
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Adjust stock
        </Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="Adjust stock"
          footer={<Button onClick={() => setOpen(false)}>Save</Button>}
        >
          <Field label="Reason">
            <Select options={reasons} value={reason} onValueChange={setReason} placeholder="Choose a reason" />
          </Field>
        </Modal>
      </>
    );
  },
};

export const SelectInOffCanvas: Story = {
  name: 'Select inside an OffCanvas',
  render: function SelectInOffCanvasExample() {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState<string>();
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Product details
        </Button>
        <OffCanvas open={open} onOpenChange={setOpen} title="Product details" footer={<Button onClick={() => setOpen(false)}>Done</Button>}>
          <Field label="Reason">
            <Select options={reasons} value={reason} onValueChange={setReason} placeholder="Choose a reason" />
          </Field>
        </OffCanvas>
      </>
    );
  },
};

const menuItems = [
  { label: 'Duplicate' },
  { label: 'Archive' },
  { type: 'separator' as const },
  { label: 'Delete', danger: true },
];

export const MenuInModal: Story = {
  name: 'Menu inside a Modal',
  render: function MenuInModalExample() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Product actions
        </Button>
        <Modal open={open} onOpenChange={setOpen} title="Product actions" footer={<Button onClick={() => setOpen(false)}>Done</Button>}>
          <Menu trigger={<Button variant="secondary">More actions</Button>} items={menuItems} />
        </Modal>
      </>
    );
  },
};

export const MenuInOffCanvas: Story = {
  name: 'Menu inside an OffCanvas',
  render: function MenuInOffCanvasExample() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Product details
        </Button>
        <OffCanvas open={open} onOpenChange={setOpen} title="Product details" footer={<Button onClick={() => setOpen(false)}>Done</Button>}>
          <Menu trigger={<Button variant="secondary">More actions</Button>} items={menuItems} />
        </OffCanvas>
      </>
    );
  },
};
