import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Offcanvas } from './Offcanvas';
import { Button } from './Button';

const meta: Meta<typeof Offcanvas> = {
  title: 'Components/Overlays/Offcanvas',
  component: Offcanvas,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof Offcanvas>;

function Demo({ fullScreen }: { fullScreen?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative h-[480px] overflow-hidden p-pad">
      <Button variant="secondary" onClick={() => setOpen(true)}>Open detail</Button>
      <Offcanvas open={open} onClose={() => setOpen(false)} label="Job detail" fullScreen={fullScreen}>
        <div className="flex flex-col gap-3 p-pad">
          <p className="text-body">Detail panel. Esc or a click outside closes it.</p>
          <Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>
        </div>
      </Offcanvas>
    </div>
  );
}

export const OverParent: Story = { name: 'Over the parent (400px)', render: () => <Demo /> };
export const FullScreen: Story = { name: 'Full screen (phone)', render: () => <Demo fullScreen /> };
