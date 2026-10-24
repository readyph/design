import type { Meta, StoryObj } from '@storybook/react';
import { DashboardShell, ContentProbe, type DashboardShellProps } from './DashboardShell';

/**
 * RDY-213 (epic RDY-212): Portal shell with the rail Menu dropdown, the slim top bar and the fixed
 * Leda right panel. Review at 1440, 1024 and 390 in light and dark.
 *
 * Leda entry points: top-bar Leda toggle (every page), the collapsed edge tab, suggestions in the
 * empty panel; the panel header shows the page context chip Leda receives.
 */
const viewports = {
  desktop1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' } },
  laptop1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' } },
  phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } },
};

const meta: Meta<DashboardShellProps> = {
  title: 'Prototypes/Portal/DashboardShell',
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
      <ContentProbe />
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
export const DesktopLedaCollapsed: Story = { name: '1440 · Leda collapsed (edge tab)', args: { ledaOpen: false }, ...at('desktop1440', 'dark') };
export const DesktopMenuOpen: Story = { name: '1440 · Menu dropdown', play: openMenu, ...at('desktop1440', 'dark') };
export const DesktopMemberMenu: Story = { name: '1440 · Menu dropdown, member', args: { member: true, active: 'reports' }, play: openMenu, ...at('desktop1440', 'dark') };
export const DesktopLight: Story = { name: '1440 · Light, conversation', args: { ledaView: 'conversation' }, ...at('desktop1440', 'light') };
export const DesktopLightMenu: Story = { name: '1440 · Light, Menu dropdown', play: openMenu, ...at('desktop1440', 'light') };

// Laptop 1024
export const LaptopLedaOpen: Story = { name: '1024 · Leda open', args: { ledaView: 'conversation' }, ...at('laptop1024', 'dark') };
export const LaptopLedaCollapsed: Story = { name: '1024 · Leda collapsed', args: { ledaOpen: false }, ...at('laptop1024', 'light') };
export const LaptopLight: Story = { name: '1024 · Light, confirm', args: { ledaView: 'confirm' }, ...at('laptop1024', 'light') };

// Phone 390 (below lg: no rail, off-canvas nav, Leda as overlay drawer)
export const Phone: Story = { name: '390 · Page', ...at('phone390', 'dark') };
export const PhoneNav: Story = { name: '390 · Off-canvas nav', args: { navOpen: true }, ...at('phone390', 'dark') };
export const PhoneNavMember: Story = { name: '390 · Off-canvas nav, member', args: { navOpen: true, member: true }, ...at('phone390', 'light') };
export const PhoneLeda: Story = { name: '390 · Leda drawer', args: { ledaDrawerOpen: true, ledaView: 'conversation' }, ...at('phone390', 'dark') };
export const PhoneLight: Story = { name: '390 · Light, Leda confirm', args: { ledaDrawerOpen: true, ledaView: 'confirm' }, ...at('phone390', 'light') };
