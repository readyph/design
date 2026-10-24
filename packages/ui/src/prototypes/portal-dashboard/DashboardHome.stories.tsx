import type { Meta, StoryObj } from '@storybook/react';
import { DashboardHome, type DashboardHomeProps } from './DashboardHome';
import { PlatformsPage, type PlatformsPageProps } from './PlatformsPage';
import { MAP_DEFAULT, MAP_EMPTY, MAP_MANY, MAP_ONE, MAP_RESTRICTED } from './home-data';

/**
 * RDY-214 (epic RDY-212): Portal Home. The platform connections map is the main content (one
 * shared ConnectionsMap, also on the Platforms page). No Needs attention strip (removed in revision 2),
 * no cards and no stat tiles. Leda stays the full-height right column with the previous chat.
 *
 * Leda entry points: "What needs my attention?" suggested prompt in the panel on Home; the small
 * "Leda" tag reopens the panel when hidden (drawer on phones).
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
  title: 'Prototypes/Portal/[For Review] DashboardHome',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'desktop1440' } },
  args: { map: MAP_DEFAULT, ledaOpen: true, ledaView: 'empty', member: false },
  argTypes: {
    map: { control: false },
    onNodeSelect: { action: 'node selected (opens platform detail, RDY-215)' },
  },
  render: (args) => <DashboardHome key={JSON.stringify({ ...args, onNodeSelect: undefined })} {...args} />,
};
export default meta;
type Story = StoryObj<DashboardHomeProps>;

// 1440
export const Desktop: Story = { name: '1440 · Light, Leda open', ...at('desktop1440', 'light') };
export const DesktopDark: Story = { name: '1440 · Dark, Leda open', ...at('desktop1440', 'dark') };
export const DesktopClosed: Story = { name: '1440 · Light, Leda hidden', args: { ledaOpen: false }, ...at('desktop1440', 'light') };
export const DesktopClosedDark: Story = { name: '1440 · Dark, Leda hidden', args: { ledaOpen: false }, ...at('desktop1440', 'dark') };

// States
export const NoPlatforms: Story = { name: 'State · No platforms connected', args: { map: MAP_EMPTY }, ...at('desktop1440', 'light') };
export const OnePlatform: Story = { name: 'State · One platform', args: { map: MAP_ONE }, ...at('desktop1440', 'light') };
export const ManyPlatforms: Story = { name: 'State · Many platforms (11)', args: { map: MAP_MANY }, ...at('desktop1440', 'dark') };
export const MemberRestricted: Story = {
  name: 'State · Member without read:sms',
  args: { map: MAP_RESTRICTED, member: true },
  ...at('desktop1440', 'light'),
};

// 1024
export const Laptop: Story = { name: '1024 · Light, Leda open', ...at('laptop1024', 'light') };
export const LaptopDark: Story = { name: '1024 · Dark, Leda hidden', args: { ledaOpen: false }, ...at('laptop1024', 'dark') };

// 390
export const Phone: Story = { name: '390 · Light', ...at('phone390', 'light') };
export const PhoneDark: Story = { name: '390 · Dark', ...at('phone390', 'dark') };

/* --------------------------------------------- Platforms page, same map -- */

const renderPlatforms = (args: DashboardHomeProps) => (
  <PlatformsPage key={JSON.stringify({ ...args, onNodeSelect: undefined })} {...(args as unknown as PlatformsPageProps)} />
);

export const PlatformsConnections: Story = { name: 'Platforms page · Connections (shared map)', render: renderPlatforms, ...at('desktop1440', 'light') };
export const PlatformsConnectionsDark: Story = {
  name: 'Platforms page · Connections, dark, Leda hidden',
  render: renderPlatforms,
  args: { ledaOpen: false },
  ...at('desktop1440', 'dark'),
};
export const PlatformsPhone: Story = { name: 'Platforms page · 390', render: renderPlatforms, ...at('phone390', 'light') };
