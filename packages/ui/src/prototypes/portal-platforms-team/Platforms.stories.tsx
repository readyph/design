import type { Meta, StoryObj } from '@storybook/react';
import { Notice } from '../../components/Notice';
import { MISSING_IN_KIT } from './common';
import { PlatformsPrototype, type PlatformsPrototypeProps } from './PlatformsPage';

/**
 * PROTOTYPE (RDY-178, epic RDY-173 features 3, 6, 7) - Portal Platforms in the RDY-175 shell.
 * Every story is the full shell at the real viewport (1440 / 1024 / 390). Rows are grouped by kind;
 * the platform kind `sms` is shown as Service Management System (SMS).
 * Leda entry points: Ask Leda in the top bar; the alert banner's Ask Leda and each row's
 * "Ask Leda about <platform>" open the same side panel.
 */
const viewports = {
  w1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  w1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
  w390: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
};

const meta: Meta<PlatformsPrototypeProps> = {
  title: 'Prototypes/Portal/[For Review] Platforms',
  component: PlatformsPrototype,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'w1440' } },
  globals: { theme: 'light' },
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    role: { control: 'inline-radio', options: ['admin', 'member'] },
    view: { control: 'inline-radio', options: ['platforms', 'connections'] },
    state: { control: 'inline-radio', options: ['ready', 'loading', 'empty', 'error'] },
    leda: { control: 'inline-radio', options: ['closed', 'empty', 'conversation', 'confirm'] },
  },
  args: { theme: 'light', role: 'admin', view: 'platforms', state: 'ready', leda: 'closed', dialog: 'none' },
};
export default meta;
type Story = StoryObj<PlatformsPrototypeProps>;

const at = (v: keyof typeof viewports) => ({ viewport: { viewports, defaultViewport: v } });
const dark = { args: { theme: 'dark' as const }, globals: { theme: 'dark' } };

/* 1440 */
export const Light: Story = { name: '1440 / Light' };
export const Dark: Story = { name: '1440 / Dark', ...dark };
export const Connections: Story = { name: '1440 / Connections graph', args: { view: 'connections' } };
export const ConnectionsDark: Story = { name: '1440 / Connections graph, dark', args: { view: 'connections', theme: 'dark' }, globals: { theme: 'dark' } };
export const WithLeda: Story = { name: '1440 / Leda open', args: { leda: 'conversation' } };
export const AddPlatform: Story = { name: '1440 / Add platform (catalog)', args: { dialog: 'add' } };
export const AddPlatformName: Story = { name: '1440 / Add platform: name', args: { dialog: 'add-name' } };
export const ConnectData: Story = { name: '1440 / Connect data drawer', args: { dialog: 'connect' } };
export const ConnectDataDark: Story = { name: '1440 / Connect data drawer, dark', args: { dialog: 'connect', theme: 'dark' }, globals: { theme: 'dark' } };
export const Rename: Story = { name: '1440 / Rename', args: { dialog: 'rename' } };
export const Disconnect: Story = { name: '1440 / Disconnect', args: { dialog: 'disconnect' } };
export const DisconnectShared: Story = { name: '1440 / Disconnect a shared source', args: { dialog: 'disconnect-shared' } };
export const Member: Story = { name: '1440 / Member (read only)', args: { role: 'member' } };
export const Loading: Story = { name: '1440 / Loading', args: { state: 'loading' } };
export const Empty: Story = { name: '1440 / Empty', args: { state: 'empty' } };
export const LoadError: Story = { name: '1440 / Load error', args: { state: 'error' } };

/* 1024 */
export const Laptop: Story = { name: '1024 / Light', parameters: at('w1024') };
export const LaptopDark: Story = { name: '1024 / Dark', ...dark, parameters: at('w1024') };
export const LaptopConnections: Story = { name: '1024 / Connections graph', args: { view: 'connections' }, parameters: at('w1024') };

/* 390 */
export const Phone: Story = { name: '390 / Light', parameters: at('w390') };
export const PhoneDark: Story = { name: '390 / Dark', ...dark, parameters: at('w390') };
export const PhoneConnections: Story = { name: '390 / Connections (links list)', args: { view: 'connections' }, parameters: at('w390') };
export const PhoneAdd: Story = { name: '390 / Add platform', args: { dialog: 'add' }, parameters: at('w390') };
export const PhoneConnect: Story = { name: '390 / Connect data drawer', args: { dialog: 'connect' }, parameters: at('w390') };

/* Notes for Leonardo */
export const KitGaps: Story = {
  name: 'Notes: missing in kit',
  render: () => (
    <div className="ds-root min-h-screen bg-surface p-gutter font-sans text-ink">
      <Notice tone="info" title="Missing in kit (for Leonardo)">
        <ul className="list-disc pl-4">
          {MISSING_IN_KIT.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Notice>
    </div>
  ),
};
