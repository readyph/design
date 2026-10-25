import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Buildings, Storefront } from '@phosphor-icons/react';
import { Modal } from './Modal';
import { LedaMark } from './Leda';

const btn =
  'h-8 rounded-control border border-border bg-surface px-3 text-ui text-text hover:bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const primary = 'h-8 rounded-control bg-accent px-3 text-ui font-medium text-accent-ink hover:bg-accent-hover';

const meta: Meta<typeof Modal> = {
  title: 'Components/Overlays/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Modal dialog on Radix Dialog: focus trap, Esc, backdrop click, focus returns to the opener, `role="dialog"` named by the title.',
          '',
          '- `size="panel"` (C13): fixed 720 x 640, or the window less 48px. 32px icon well in the header, body scrolls inside, footer pinned. Size never changes with content. Phone: full screen.',
          '- `size="marketplace"` (C20): same family at 904 x 744.',
          '- `sm` / `md` / `lg`: content-sized dialogs (max-width 384 / 448 / 512), body scrolls past the window less 48px.',
          '',
          '```tsx',
          "import { Modal } from '@readyph/ui';",
          '',
          '<Modal open={open} onOpenChange={setOpen} size="panel" icon={Buildings} title="Edit place" description="Hours and address"',
          '  footer={<><Button variant="secondary">Cancel</Button><Button>Save</Button></>}>',
          '  ...body',
          '</Modal>',
          '```',
          '',
          'Compose with `Modal.Header` (`icon`, `description`), `Modal.Body`, `Modal.Footer` for full control.',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Modal>;

const lines = (n: number) =>
  Array.from({ length: n }, (_, i) => (
    <p key={i} className="border-b border-rule py-row-y-tight text-body">
      Row {i + 1}. The body scrolls inside the modal; the header and footer stay put.
    </p>
  ));

function Demo({ size, rows, icon = Buildings, title = 'Edit place' }: { size: 'panel' | 'marketplace' | 'sm' | 'md' | 'lg'; rows: number; icon?: typeof Buildings; title?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-pad">
      <button className={btn} onClick={() => setOpen(true)}>Open {size}</button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        size={size}
        icon={icon}
        title={title}
        description="Hours, address and contact"
        footer={
          <>
            <button className={btn} onClick={() => setOpen(false)}>Cancel</button>
            <button className={primary} onClick={() => setOpen(false)}>Save</button>
          </>
        }
      >
        {lines(rows)}
      </Modal>
    </div>
  );
}

export const Panel: Story = { name: 'Panel 720 x 640', render: () => <Demo size="panel" rows={4} /> };
export const PanelLongContent: Story = { name: 'Panel, long content scrolls', render: () => <Demo size="panel" rows={40} /> };
export const Marketplace: Story = { name: 'Marketplace 904 x 744', render: () => <Demo size="marketplace" rows={10} icon={Storefront} title="Marketplace" /> };
export const Small: Story = { name: 'Content-sized (sm)', render: () => <Demo size="sm" rows={2} /> };
export const OpenOnLoad: Story = {
  name: 'Open (panel)',
  parameters: { layout: 'fullscreen' },
  render: () => (
    <Modal open size="panel" icon={Buildings} title="Edit place" description="Hours, address and contact" footer={<button className={primary}>Save</button>}>
      {lines(4)}
    </Modal>
  ),
};

/** Try it (C30): the Leda mark in the icon well, and a description that wraps instead of truncating. */
export const LedaTryIt: Story = {
  name: 'Leda mark in the well (Try it)',
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="p-pad">
        <button className={btn} onClick={() => setOpen(true)}>Open Try it</button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          size="panel"
          iconNode={<LedaMark size={18} decorative />}
          title="Try it"
          description="Ask as a customer and see what Leda says, and why. The description wraps to a second line on a narrow screen."
          footer={<button className={primary} onClick={() => setOpen(false)}>Done</button>}
        >
          {lines(4)}
        </Modal>
      </div>
    );
  },
};
