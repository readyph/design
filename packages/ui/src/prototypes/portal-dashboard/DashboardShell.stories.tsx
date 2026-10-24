import type { Meta, StoryObj } from '@storybook/react';
import { DashboardShell, type DashboardShellProps } from './DashboardShell';
import { TownOverview, type TownOverviewProps } from './TownOverview';

/**
 * RDY-213 (epic RDY-212): Portal shell with the rail Menu dropdown, no top bar, and Leda as a
 * full-height fixed right column (24rem at lg, 28rem from xl) behind one separator. The chat inside is the
 * previous Portal Leda chat, unchanged. Content shows the platform connections as the Town Scene (RDY-224, shared with the Lab platform map page): hover or focus a building for the bubble, select it for the detail modal (Open / Manage connections), the legend highlights a connection. Review at 1440, 1024 and 390 in light and dark.
 *
 * Leda entry points: the small "Leda" tag shown when the panel is hidden (every page), quick actions in
 * the empty panel, and the confirm-before-write proposal for a connection change.
 */
const viewports = {
  desktop1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' } },
  laptop1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' } },
  phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } },
};

const meta: Meta<DashboardShellProps> = {
  title: 'Prototypes/Portal/[For Review] DashboardShell',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'desktop1440' } },
  args: { active: 'home', member: false, ledaOpen: true, ledaView: 'empty' },
  argTypes: {
    active: { control: 'select', options: ['home', 'reports', 'team', 'platforms', 'memory', 'settings'] },
    ledaView: { control: 'inline-radio', options: ['empty', 'conversation', 'confirm'] },
  },
  render: (args) => (
    // Remount when args change so review controls reset the shell state.
    <DashboardShell key={JSON.stringify(args)} {...args}>
      <TownOverview />
    </DashboardShell>
  ),
};
export default meta;
type Story = StoryObj<DashboardShellProps>;

const at = (vp: keyof typeof viewports, theme: 'light' | 'dark') => ({
  parameters: { viewport: { viewports, defaultViewport: vp } },
  globals: { theme },
});

/** Radix opens the dropdown on pointerdown; open it for the review screenshot. */
const openMenu: Story['play'] = async ({ canvasElement }) => {
  const btn = canvasElement.querySelector<HTMLButtonElement>('button[aria-label="Menu"]');
  btn?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'mouse' }));
};

// Desktop 1440
export const DesktopLedaEmpty: Story = { name: '1440 · Leda open, empty', ...at('desktop1440', 'dark') };
export const DesktopLedaConversation: Story = { name: '1440 · Leda conversation', args: { ledaView: 'conversation' }, ...at('desktop1440', 'dark') };
export const DesktopConfirmAction: Story = { name: '1440 · Confirm-before-write', args: { ledaView: 'confirm' }, ...at('desktop1440', 'dark') };
export const DesktopLedaCollapsed: Story = { name: '1440 · Leda hidden (Ask Leda button)', args: { ledaOpen: false }, ...at('desktop1440', 'dark') };
export const DesktopMenuOpen: Story = { name: '1440 · Menu dropdown', play: openMenu, ...at('desktop1440', 'dark') };
export const DesktopMemberMenu: Story = { name: '1440 · Menu dropdown, member', args: { member: true, active: 'reports' }, play: openMenu, ...at('desktop1440', 'dark') };
export const DesktopLight: Story = { name: '1440 · Light, conversation', args: { ledaView: 'conversation' }, ...at('desktop1440', 'light') };
export const DesktopLightMenu: Story = { name: '1440 · Light, Menu dropdown', play: openMenu, ...at('desktop1440', 'light') };

// Laptop 1024
export const LaptopLedaOpen: Story = { name: '1024 · Leda open', args: { ledaView: 'conversation' }, ...at('laptop1024', 'dark') };
export const LaptopLedaCollapsed: Story = { name: '1024 · Leda hidden (Ask Leda button)', args: { ledaOpen: false }, ...at('laptop1024', 'light') };
export const LaptopLight: Story = { name: '1024 · Light, confirm', args: { ledaView: 'confirm' }, ...at('laptop1024', 'light') };

// Phone 390 (below lg: no rail, off-canvas nav, Leda as overlay drawer)
export const Phone: Story = { name: '390 · Page', ...at('phone390', 'dark') };
export const PhoneNav: Story = { name: '390 · Off-canvas nav', args: { navOpen: true }, ...at('phone390', 'dark') };
export const PhoneNavMember: Story = { name: '390 · Off-canvas nav, member', args: { navOpen: true, member: true }, ...at('phone390', 'light') };
export const PhoneLeda: Story = { name: '390 · Leda drawer', args: { ledaDrawerOpen: true, ledaView: 'conversation' }, ...at('phone390', 'dark') };
export const PhoneLight: Story = { name: '390 · Light, Leda confirm', args: { ledaDrawerOpen: true, ledaView: 'confirm' }, ...at('phone390', 'light') };

// Town scene states
const withTown = (town: TownOverviewProps): Story['render'] => (args) => (
  <DashboardShell key={JSON.stringify([args, town])} {...args}>
    <TownOverview {...town} />
  </DashboardShell>
);
export const DesktopTownBubble: Story = { name: '1440 · Scene, bubble open', args: { ledaOpen: false }, render: withTown({ bubbleFor: 'inv-central' }), ...at('desktop1440', 'light') };
export const DesktopTownSelected: Story = { name: '1440 · Scene, platform selected', args: { ledaOpen: false }, render: withTown({ modalFor: 'inv-davao' }), ...at('desktop1440', 'dark') };
export const LaptopTownBubble: Story = { name: '1024 · Scene, bubble open', args: { ledaOpen: false }, render: withTown({ bubbleFor: 'st-bgc' }), ...at('laptop1024', 'light') };
export const PhoneTownSelected: Story = { name: '390 · Scene, platform selected', render: withTown({ modalFor: 'st-cebu' }), ...at('phone390', 'light') };
export const DesktopTownDark: Story = { name: '1440 · Scene, dark', args: { ledaOpen: false }, render: withTown({ bubbleFor: 'st-bgc' }), ...at('desktop1440', 'dark') };
