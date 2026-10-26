import { useEffect, useRef, useState } from 'react';
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
          '- `overview`: 560px max, centred in grid and flex-center parents (full width when narrower), 44px tall, 22px mark.',
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

/** Reads the left offset and width of the bar inside it, so placement is checkable without devtools. */
function Probe({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [m, setM] = useState('');
  useEffect(() => {
    const read = () => {
      const el = ref.current?.querySelector('[data-ask-leda]') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setM(`x=${Math.round(r.left)} w=${Math.round(r.width)}`);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);
  return (
    <div ref={ref}>
      <p data-testid={`probe-${label}`} className="mb-1 text-tiny text-muted">{label}: {m}</p>
      {children}
    </div>
  );
}

/** Overview in grid, flex and block parents: grid and flex centre it (560px max), block stays left; none scrolls sideways at 320/375/560/1280. The readout shows each bar's x offset and width. */
export const OverviewParents: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: (a) => (
    <div className="flex flex-col gap-4 bg-surface p-4">
      <Probe label="grid"><div className="grid place-items-center"><AskLedaBar {...a} variant="overview" scope="grid" shortcuts={false} /></div></Probe>
      <Probe label="flex"><div className="flex justify-center"><AskLedaBar {...a} variant="overview" scope="flex" shortcuts={false} /></div></Probe>
      <Probe label="block"><div><AskLedaBar {...a} variant="overview" scope="block" shortcuts={false} /></div></Probe>
    </div>
  ),
};

/** Caller className stress (RDY-266 round 4): real props; the button must keep its size whatever layout classes are passed. */
const STRESS = ['w-40', 'min-w-0 w-40', 'w-96', 'w-[400px]', 'max-w-xs', 'basis-40', 'shrink', 'shrink-0', 'ml-4'];
export const ClassNameStress: Story = {
  parameters: { docs: { disable: true } },
  render: (a) => (
    <div className="flex flex-col gap-3 bg-surface p-4">
      {(['bar', 'overview'] as const).map((variant) => STRESS.map((c) => (
        <div key={`${variant}${c}`} data-case={`${variant}|${c}`} className={variant === 'overview' ? 'flex justify-center' : 'flex'}>
          <AskLedaBar {...a} variant={variant} className={c} shine="hold" />
        </div>
      )))}
    </div>
  ),
};
