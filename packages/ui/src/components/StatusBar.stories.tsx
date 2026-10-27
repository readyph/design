import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PlatformShell } from './PlatformShell';
import { StatusBar, type StatusBarPlatform, type StatusBarProps } from './StatusBar';

const names = ['Stockroom', 'Marikina Branch', 'Books', 'Lakeside Dental', 'Harbor Clinic', 'Northfield Vet', 'Sunrise Pediatrics', 'A Very Long Platform Name Indeed'];
const make = (n: number): StatusBarPlatform[] => names.slice(0, n).map((name, i) => ({ id: String(i), name }));

const base: StatusBarProps = {
  people: { count: 12 },
  invites: { count: 2 },
  leda: { used: 1742, max: 2000 },
  plan: 'Starter',
  updatedAt: '9:12 AM',
};

const meta: Meta<typeof StatusBar> = {
  title: 'Components/Layout/StatusBar',
  component: StatusBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Status bar (C4): 34px strip on the frame colour, 12px muted. Put it in `PlatformShell`\'s `status` slot; the shell supplies the `footer` landmark with `aria-label="Status"`, so StatusBar renders a plain container and list (set `aria-label` on it only outside the shell).',
          '',
          '- Platforms: logo per platform; name beside it only with 3 or fewer platforms (4+ running platforms are logo-only with a title tooltip); a platform that is not running always shows its name and a plain word ("Marikina Branch slow"). 4+ all running add "All running". Past `maxPlatforms` (8) a "+N" item.',
          '- Narrow (the bar\'s own width, container query): drops Updated (below 960), then the plan and invite word together (780); the count stays. Controls are never dropped. Phone: the shell hides the status row.',
          '- Items are plain text; give `href` (link) or `onSelect` (button, `aria-pressed` with `selected`) to make one interactive.',
          '- `aria-live`: a hidden polite region announces health changes only ("Books offline"), never the time.',
          '',
          '```tsx',
          '<PlatformShell status={<StatusBar platforms={platforms} people={{ count: 12 }} invites={{ count: 2 }} leda={{ used: 1742, max: 2000 }} plan="Starter" updatedAt="9:12 AM" />} ... />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof StatusBar>;

/** Rendered in the real shell slot so the footer landmark and frame colours are the real ones. */
const InShell = (props: StatusBarProps) => (
  <div className="h-[220px]">
    <PlatformShell rail={<span className="sr-only">Rail</span>} sheetBar={<p className="px-6 text-small">Bar</p>} status={<StatusBar {...props} />}>
      <p className="p-6 text-small">Page</p>
    </PlatformShell>
  </div>
);

export const Platforms2: Story = { name: '2 platforms', render: () => <InShell {...base} platforms={make(2)} /> };
export const Platforms3: Story = { name: '3 platforms, one slow', render: () => <InShell {...base} platforms={make(3).map((p, i) => (i === 1 ? { ...p, health: 'warn' as const } : p))} /> };
export const Platforms8: Story = {
  name: '8 platforms, one offline',
  render: () => <InShell {...base} platforms={make(8).map((p, i) => (i === 2 ? { ...p, health: 'bad' as const } : p))} />,
};
export const Platforms8Several: Story = {
  name: '8 platforms, several not running',
  render: () => <InShell {...base} platforms={make(8).map((p, i) => (i === 1 ? { ...p, health: 'warn' as const } : i === 4 ? { ...p, health: 'bad' as const } : i === 6 ? { ...p, health: 'neutral' as const } : p))} />,
};
export const LiveRegion: Story = {
  name: 'Live region (toggle health)',
  render: () => {
    const [off, setOff] = useState(false);
    return (
      <div>
        <button type="button" onClick={() => setOff((v) => !v)} className="m-3 rounded-chip border border-control px-3 py-1 text-small">
          {off ? 'Restore Books' : 'Take Books offline'}
        </button>
        <InShell {...base} platforms={make(4).map((p, i) => (i === 2 && off ? { ...p, health: 'bad' as const } : p))} />
      </div>
    );
  },
};
export const AllRunning: Story = { name: '8 platforms, all running', render: () => <InShell {...base} platforms={make(8)} /> };
export const Overflow: Story = {
  name: '12 platforms (+N)',
  render: () => <InShell {...base} platforms={Array.from({ length: 12 }, (_, i) => ({ id: String(i), name: `Platform ${i + 1}` }))} onMore={() => {}} />,
};
/** RDY-315: the strip as the Team and Home prototypes show it. Check at 1280, 641 and 375 with the viewport toolbar. */
const seats = { plan: 'Starter', planDetail: '10 of 15 seats', invites: { count: 1 } };
export const TextAllRunning: Story = { name: 'Text: all running', render: () => <InShell {...base} {...seats} platforms={make(3)} /> };
export const TextOneOffline: Story = {
  name: 'Text: one offline',
  render: () => <InShell {...base} {...seats} platforms={make(3).map((p, i) => (i === 1 ? { ...p, health: 'bad' as const } : p))} />,
};
export const TextOverSeat: Story = {
  name: 'Text: over seats (bad tone)',
  render: () => <InShell {...base} plan="Free" planDetail="4 of 3 seats" planTone="bad" invites={{ count: 2 }} platforms={make(3)} />,
};
export const TextInvitePending: Story = { name: 'Text: 1 invite pending', render: () => <InShell {...base} {...seats} platforms={make(2)} /> };
export const NoAccess: Story = { name: 'People hidden (no access)', render: () => <InShell {...base} {...seats} hide={['people']} platforms={make(3)} /> };

export const LedaNearLimit: Story = { name: 'Leda usage warn / full', render: () => <InShell {...base} platforms={make(2)} leda={{ used: 1650, max: 2000 }} /> };

export const Interactive: Story = {
  render: () => {
    const [sel, setSel] = useState<string>('0');
    return <InShell {...base} platforms={make(3).map((p) => ({ ...p, selected: sel === p.id, onSelect: () => setSel(p.id) }))} people={{ count: 12, href: '#team' }} invites={{ count: 2, href: '#team' }} />;
  },
};

export const Narrow: Story = {
  name: 'Narrow widths (900, 700, 600)',
  render: () => (
    <div className="space-y-4">
      {[900, 700, 600].map((w) => (
        <div key={w} style={{ width: w }} className="bg-frame">
          <div className="h-status"><StatusBar {...base} platforms={make(3)} aria-label={`Status at ${w}`} /></div>
        </div>
      ))}
    </div>
  ),
};
