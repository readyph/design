import type { Meta, StoryObj } from '@storybook/react';
import { Cube } from '@phosphor-icons/react';
import { Link } from '../../components/Link';
import { PlatformsPage } from '../platform-connection/PortalPlatforms';
import { storyHref } from '../platform-connection/data';
import { LabPlatformMap, type LabPlatformMapProps } from './LabPlatformMap';

/**
 * RDY-225 (epic RDY-222): Lab platform map, standalone Portal page `/lab/platform-map` outside the
 * Portal shell. Top bar (back to Portal, title, Experiment tag), the Town Scene region (placeholder
 * until RDY-224 merges), hover/focus bubble, detail modal, compact side list that doubles as the
 * legend, and loading / error / empty states. Lights are view-only local state (reset on reload).
 *
 * Accessible fallback: one visually hidden, focusable button per building; Tab moves between them,
 * focus or hover shows the bubble, Enter opens the detail modal.
 *
 * Leda entry points: none. The page is outside the shell, so the Leda panel is not shown, and lights
 * are local view state, so there is no Leda action ("no Leda impact" on the delivery tickets).
 */
const viewports = {
  desktop1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' } },
  phone375: { name: 'Phone 375', styles: { width: '375px', height: '812px' } },
};

/** Story id of this page; update when the [For Review] prefix is removed. */
const PAGE_STORY = 'prototypes-portal-lab-platform-map-for-review-page--desktop-dark';

const meta: Meta<LabPlatformMapProps> = {
  title: 'Prototypes/Portal/Lab Platform Map/[For Review] Page',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'desktop1440' } },
  args: { state: 'default', lightsOff: ['rs-cdo'] },
  argTypes: {
    state: { control: 'inline-radio', options: ['default', 'loading', 'error', 'empty'] },
    bubbleFor: { control: 'select', options: [undefined, 'inv', 'rs-dvo', 'rs-ceb', 'rs-cdo'] },
    modalFor: { control: 'select', options: [undefined, 'inv', 'rs-dvo', 'rs-ceb', 'rs-cdo'] },
  },
  // Remount when args change so review controls reset local state.
  render: (args) => <LabPlatformMap key={JSON.stringify(args)} {...args} />,
};
export default meta;
type Story = StoryObj<LabPlatformMapProps>;

const at = (vp: keyof typeof viewports, theme: 'light' | 'dark') => ({
  parameters: { viewport: { viewports, defaultViewport: vp } },
  globals: { theme },
});

// Desktop 1440
export const DesktopDark: Story = { name: '1440 · Default', ...at('desktop1440', 'dark') };
export const DesktopLight: Story = { name: '1440 · Default, light', ...at('desktop1440', 'light') };
export const DesktopBubble: Story = { name: '1440 · Bubble open', args: { bubbleFor: 'rs-dvo' }, ...at('desktop1440', 'dark') };
export const DesktopBubbleLight: Story = { name: '1440 · Bubble open, light', args: { bubbleFor: 'inv' }, ...at('desktop1440', 'light') };
export const DesktopModalLightsOn: Story = { name: '1440 · Modal, lights on', args: { modalFor: 'inv' }, ...at('desktop1440', 'dark') };
export const DesktopModalLightsOff: Story = { name: '1440 · Modal, lights off', args: { modalFor: 'rs-cdo' }, ...at('desktop1440', 'light') };
export const DesktopLoading: Story = { name: '1440 · Loading', args: { state: 'loading' }, ...at('desktop1440', 'dark') };
export const DesktopError: Story = { name: '1440 · Error', args: { state: 'error' }, ...at('desktop1440', 'light') };
export const DesktopEmpty: Story = { name: '1440 · Empty tenant', args: { state: 'empty' }, ...at('desktop1440', 'dark') };

// Phone 375
export const PhoneDark: Story = { name: '375 · Default', ...at('phone375', 'dark') };
export const PhoneLight: Story = { name: '375 · Default, light', ...at('phone375', 'light') };
export const PhoneBubble: Story = { name: '375 · Bubble open', args: { bubbleFor: 'rs-cdo' }, ...at('phone375', 'dark') };
export const PhoneModalLightsOn: Story = { name: '375 · Modal, lights on', args: { modalFor: 'rs-dvo' }, ...at('phone375', 'light') };
export const PhoneModalLightsOff: Story = { name: '375 · Modal, lights off', args: { modalFor: 'rs-cdo' }, ...at('phone375', 'dark') };
export const PhoneLoading: Story = { name: '375 · Loading', args: { state: 'loading' }, ...at('phone375', 'light') };
export const PhoneError: Story = { name: '375 · Error', args: { state: 'error' }, ...at('phone375', 'dark') };
export const PhoneEmpty: Story = { name: '375 · Empty tenant', args: { state: 'empty' }, ...at('phone375', 'light') };

/** Entry point: a small "Try 3D view" link in the Platforms page header (link placement only). */
const tryLink = <Link href={storyHref(PAGE_STORY)} icon={Cube} className="text-sm">Try 3D view</Link>;
export const EntryPointDesktop: Story = {
  name: 'Entry point · Platforms page 1440',
  render: () => <PlatformsPage extraActions={tryLink} />,
  ...at('desktop1440', 'dark'),
};
export const EntryPointPhone: Story = {
  name: 'Entry point · Platforms page 375',
  render: () => <PlatformsPage extraActions={tryLink} />,
  ...at('phone375', 'light'),
};
