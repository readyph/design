import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Buildings } from '@phosphor-icons/react';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { Select } from '../components/Select';

/** [For Review] RDY-273. Prototype only: stories are not exported from the package. */
const meta: Meta = {
  title: 'Prototypes/Portal/[For Review] Panel modal',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const btn = 'h-8 rounded-control border border-border bg-surface px-3 text-ui text-text hover:bg-raised';
const primary = 'h-8 rounded-control bg-accent px-3 text-ui font-medium text-accent-ink hover:bg-accent-hover';

function Page() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-surface p-pad text-text">
      <h1 className="text-title">Places</h1>
      <p className="mt-2 text-body text-muted">Choose a place to edit its details.</p>
      <button className={`${btn} mt-4`} onClick={() => setOpen(true)}>Edit place</button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        size="panel"
        icon={Buildings}
        title="Edit place"
        description="Cebu Distribution Hub"
        footer={
          <>
            <button className={btn} onClick={() => setOpen(false)}>Cancel</button>
            <button className={primary} onClick={() => setOpen(false)}>Save changes</button>
          </>
        }
      >
        <div className="flex flex-col gap-field-y">
          <div className="flex items-center gap-2">
            <Badge tone="ok" dot>Running</Badge>
            <span className="text-small text-muted">Last synced 2 min ago</span>
          </div>
          <label className="flex flex-col gap-1 text-ui">
            Name
            <input className="h-10 rounded-control border border-border bg-surface px-3 text-body" defaultValue="Cebu Distribution Hub" />
          </label>
          <Select
            aria-label="Region"
            options={[{ value: 'vis', label: 'Visayas' }, { value: 'luz', label: 'Luzon' }, { value: 'min', label: 'Mindanao' }]}
            defaultValue="vis"
          />
          {Array.from({ length: 10 }, (_, i) => (
            <p key={i} className="text-body text-muted">Notes paragraph {i + 1}. Long forms scroll inside the body; the modal keeps its size.</p>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export const Desktop: StoryObj = { render: () => <Page /> };
export const Phone: StoryObj = { parameters: { viewport: { defaultViewport: 'mobile1' } }, render: () => <Page /> };
