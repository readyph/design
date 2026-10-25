import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { AskLedaBar } from './AskLedaBar';

const meta: Meta<typeof AskLedaBar> = {
  title: 'Components/Leda/Ask Leda bar',
  component: AskLedaBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: [
          'Ask Leda bar (C6, replaces `LedaLauncher`). A real button; click, Cmd/Ctrl+K and "/" call `onOpen(source)`. The command palette (C7) and the conversation panel (C8) are separate components.',
          '',
          '- `bar` (default): 320px wide, 34px tall, in the sheet bar. At 640px and below it is a 44px icon button (24px mark, no halo).',
          '- `overview`: 560px (full width when narrower), 44px tall, 22px mark.',
          '- Halo: conic gradient ring + glow, one 2.8s pass. First pass 1.2s after load, then every 17s, plus once after 10s idle. Skipped while the tab is hidden or `paused` (palette open); the rhythm restarts afterwards. `shine="hold"` freezes it.',
          '- Reduced motion: no rotation or glow; the ring fades for 1.6s; the mark Scan stays still.',
          '- Leda colours paint only the mark and the halo. `className` places the bar (margin); it cannot change the width or height.',
          '',
          '```tsx',
          '<AskLedaBar scope="Stockroom" paused={paletteOpen} onOpen={() => setPaletteOpen(true)} />',
          '```',
        ].join('\n'),
      },
    },
  },
  args: { shortcutLabel: '⌘K' },
};
export default meta;
type Story = StoryObj<typeof AskLedaBar>;

const strip = (el: React.ReactNode) => (
  <header className="flex h-12 items-center justify-end gap-3 border-b border-border bg-surface px-6">{el}</header>
);

export const Bar: Story = { render: (a) => strip(<AskLedaBar {...a} />) };
export const WithScope: Story = { render: (a) => strip(<AskLedaBar {...a} scope="Stockroom" />) };
export const Overview: Story = {
  render: (a) => <div className="grid place-items-center bg-surface p-pad"><AskLedaBar {...a} variant="overview" /></div>,
};
export const Phone: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (a) => <div className="flex flex-col gap-4 bg-surface p-4"><div className="flex justify-end"><AskLedaBar {...a} /></div><AskLedaBar {...a} variant="overview" /></div>,
};
export const Held: Story = { render: (a) => strip(<AskLedaBar {...a} shine="hold" />) };
export const PaletteOpen: Story = {
  render: (a) => {
    const [open, setOpen] = useState(false);
    return strip(<><span className="text-small text-muted">{open ? 'Palette open (halo paused)' : 'Closed'}</span><AskLedaBar {...a} paused={open} onOpen={() => setOpen((o) => !o)} /></>);
  },
};
