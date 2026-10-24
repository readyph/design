import type { Meta, StoryObj } from '@storybook/react';
import { DashboardHome, type DashboardHomeProps } from './DashboardHome';
import { PlatformsPage, type PlatformsPageProps } from './PlatformsPage';
import { MAP_DEFAULT, MAP_EMPTY, MAP_MANY, MAP_ONE, MAP_RESTRICTED } from './home-data';

/**
 * RDY-214 (epic RDY-212): Portal Home. The platform connections map is the main content (one
 * shared ConnectionsMap, also on the Platforms page), with a flat Needs attention strip under it.
 * No cards and no stat tiles. Leda stays the fixed flush right column with the previous chat.
 *
 * Leda entry points: "What needs my attention?" suggested prompt in the panel on Home; "Ask Leda"
 * on every attention row prefills the panel (opens it when collapsed, or the drawer on phones).
 * Node click / Enter / Space fires `onNodeSelect` (opens the RDY-215 platform detail modal).
 */
const viewports = {
  desktop1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' } },
  laptop1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' } },
  phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } },
};

const at = (vp: keyof typeof viewports, theme: 'light' | 'dark') => ({
  parameters: { viewport: { viewports, defaultViewport: vp } },
  globals: { theme },
});

const meta: Meta<DashboardHomeProps> = {
  title: 'Prototypes/Portal/DashboardHome',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'desktop1440' } },
  args: { map: MAP_DEFAULT, attention: 'ready', ledaOpen: true, ledaView: 'empty', member: false },
  argTypes: {
    attention: { control: 'inline-radio', options: ['ready', 'loading', 'empty', 'degraded'] },
    map: { control: false },
    onNodeSelect: { action: 'node selected (opens platform detail, RDY-215)' },
  },
  render: (args) => <DashboardHome key={JSON.stringify({ ...args, onNodeSelect: undefined })} {...args} />,
};
export default meta;
type Story = StoryObj<DashboardHomeProps>;

/** Press the first "Ask Leda" row action so the review shot shows the prefilled panel. */
const askLeda: Story['play'] = async ({ canvasElement }) => {
  await new Promise((r) => setTimeout(r, 50));
  canvasElement.querySelector<HTMLButtonElement>('button[aria-label^="Ask Leda about"]')?.click();
};

// 1440
export const Desktop: Story = { name: '1440 · Light, Leda open', ...at('desktop1440', 'light') };
export const DesktopDark: Story = { name: '1440 · Dark, Leda open', ...at('desktop1440', 'dark') };
export const DesktopClosed: Story = { name: '1440 · Light, Leda collapsed', args: { ledaOpen: false }, ...at('desktop1440', 'light') };
export const DesktopClosedDark: Story = { name: '1440 · Dark, Leda collapsed', args: { ledaOpen: false }, ...at('desktop1440', 'dark') };
export const DesktopAskLeda: Story = { name: '1440 · Ask Leda prefilled', play: askLeda, ...at('desktop1440', 'light') };

// States
export const AttentionLoading: Story = { name: 'State · Needs attention loading', args: { attention: 'loading' }, ...at('desktop1440', 'light') };
export const AttentionEmpty: Story = { name: 'State · All clear', args: { attention: 'empty' }, ...at('desktop1440', 'light') };
export const AttentionDegraded: Story = { name: 'State · Provider degraded', args: { attention: 'degraded' }, ...at('desktop1440', 'dark') };
export const NoPlatforms: Story = { name: 'State · No platforms connected', args: { map: MAP_EMPTY }, ...at('desktop1440', 'light') };
export const OnePlatform: Story = { name: 'State · One platform', args: { map: MAP_ONE, attention: 'empty' }, ...at('desktop1440', 'light') };
export const ManyPlatforms: Story = { name: 'State · Many platforms (11)', args: { map: MAP_MANY }, ...at('desktop1440', 'dark') };
export const MemberRestricted: Story = {
  name: 'State · Member without read:sms',
  args: { map: MAP_RESTRICTED, member: true, attention: 'degraded' },
  ...at('desktop1440', 'light'),
};

// 1024
export const Laptop: Story = { name: '1024 · Light, Leda open', ...at('laptop1024', 'light') };
export const LaptopDark: Story = { name: '1024 · Dark, Leda collapsed', args: { ledaOpen: false }, ...at('laptop1024', 'dark') };

// 390
export const Phone: Story = { name: '390 · Light', ...at('phone390', 'light') };
export const PhoneDark: Story = { name: '390 · Dark', ...at('phone390', 'dark') };
export const PhoneAskLeda: Story = { name: '390 · Ask Leda drawer', play: askLeda, ...at('phone390', 'dark') };

/* --------------------------------------------- Platforms page, same map -- */

const renderPlatforms = (args: DashboardHomeProps) => (
  <PlatformsPage key={JSON.stringify({ ...args, onNodeSelect: undefined })} {...(args as unknown as PlatformsPageProps)} />
);

export const PlatformsConnections: Story = { name: 'Platforms page · Connections (shared map)', render: renderPlatforms, ...at('desktop1440', 'light') };
export const PlatformsConnectionsDark: Story = {
  name: 'Platforms page · Connections, dark, Leda collapsed',
  render: renderPlatforms,
  args: { ledaOpen: false },
  ...at('desktop1440', 'dark'),
};
export const PlatformsPhone: Story = { name: 'Platforms page · 390', render: renderPlatforms, ...at('phone390', 'light') };
