import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Select } from '../components/Select';
import { Modal } from '../components/Modal';
import { OffCanvas } from '../components/Drawer';

const meta: Meta = {
  title: 'Patterns/Overlays',
  parameters: {
    docs: {
      description: {
        component:
          'Prototype: a Select opened inside a Modal or an OffCanvas. The listbox uses the `popover` z-index token, which sits above `modal` and `drawer`, so it can be picked with the pointer.',
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
