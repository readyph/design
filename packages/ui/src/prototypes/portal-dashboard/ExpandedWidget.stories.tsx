import type { Meta, StoryObj } from '@storybook/react';
import { ExpandedWidgetPrototype, type ExpandedWidgetPrototypeProps } from './ExpandedWidget';
import { FOLLOW_UP_CONVERSATION } from './expandedWidgetData';

/**
 * RDY-216 (epic RDY-212): Leda widgets expand into the content panel instead of a modal. Expand
 * (top right of a widget, or "Show all" on a capped list) replaces the Home diagram with the full
 * widget, the top-bar title becomes the widget title, and "Back to platforms" returns Home with the
 * scroll restored. One expanded widget at a time; the source message is marked "Expanded".
 * Content is flat (no cards, no stat tiles). Built on the RDY-213 shell (design#58).
 *
 * Leda entry points: the Expand control and "Show all" on every Leda widget in the panel; the
 * composer placeholder names the expanded widget so follow-ups can refer to it (Follow-up story).
 */
const viewports = {
  desktop1440: {
    name: 'Desktop 1440',
    styles: { width: '1440px', height: '900px' },
  },
  laptop1024: {
    name: 'Laptop 1024',
    styles: { width: '1024px', height: '768px' },
  },
  phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } },
};

const meta: Meta<ExpandedWidgetPrototypeProps> = {
  title: 'Prototypes/Portal/ExpandedWidget',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { viewports, defaultViewport: 'desktop1440' },
  },
  args: { ledaOpen: true },
  argTypes: {
    initialExpanded: {
      control: 'select',
      options: [undefined, 'low-stock', 'week-stats', 'sales-chart', 'platform-overview'],
    },
  },
  render: ({ conversation, ...args }) => (
    // Remount when args change so review controls reset the page state.
    <ExpandedWidgetPrototype key={JSON.stringify(args)} conversation={conversation} {...args} />
  ),
};
export default meta;
type Story = StoryObj<ExpandedWidgetPrototypeProps>;

const at = (vp: keyof typeof viewports, theme: 'light' | 'dark') => ({
  parameters: { viewport: { viewports, defaultViewport: vp } },
  globals: { theme },
});

// Desktop 1440
export const DesktopHome: Story = {
  name: '1440 · Home, widgets in Leda',
  ...at('desktop1440', 'dark'),
};
export const DesktopList: Story = {
  name: '1440 · Expanded list, Leda open',
  args: { initialExpanded: 'low-stock' },
  ...at('desktop1440', 'dark'),
};
export const DesktopListCollapsed: Story = {
  name: '1440 · Expanded list, Leda collapsed',
  args: { initialExpanded: 'low-stock', ledaOpen: false },
  ...at('desktop1440', 'dark'),
};
export const DesktopStats: Story = {
  name: '1440 · Expanded stats (flat)',
  args: { initialExpanded: 'week-stats' },
  ...at('desktop1440', 'light'),
};
export const DesktopChart: Story = {
  name: '1440 · Expanded chart',
  args: { initialExpanded: 'sales-chart' },
  ...at('desktop1440', 'dark'),
};
export const DesktopOverview: Story = {
  name: '1440 · Expanded platform overview',
  args: { initialExpanded: 'platform-overview' },
  ...at('desktop1440', 'light'),
};
export const DesktopFollowUp: Story = {
  name: '1440 · Follow-up about the expanded list',
  args: { initialExpanded: 'low-stock', conversation: FOLLOW_UP_CONVERSATION },
  ...at('desktop1440', 'light'),
};

// Laptop 1024
export const LaptopList: Story = {
  name: '1024 · Expanded list, Leda open',
  args: { initialExpanded: 'low-stock' },
  ...at('laptop1024', 'light'),
};
export const LaptopStats: Story = {
  name: '1024 · Expanded stats, Leda open',
  args: { initialExpanded: 'week-stats' },
  ...at('laptop1024', 'dark'),
};
export const LaptopOverviewCollapsed: Story = {
  name: '1024 · Expanded overview, Leda collapsed',
  args: { initialExpanded: 'platform-overview', ledaOpen: false },
  ...at('laptop1024', 'dark'),
};

// Phone 390 (Leda is a drawer; Expand closes it and the widget fills the content)
export const PhoneDrawer: Story = {
  name: '390 · Leda drawer with widgets',
  args: { ledaDrawerOpen: true },
  ...at('phone390', 'dark'),
};
export const PhoneList: Story = {
  name: '390 · Expanded list (drawer closed)',
  args: { initialExpanded: 'low-stock' },
  ...at('phone390', 'dark'),
};
export const PhoneStats: Story = {
  name: '390 · Expanded stats',
  args: { initialExpanded: 'week-stats' },
  ...at('phone390', 'light'),
};
export const PhoneChart: Story = {
  name: '390 · Expanded chart',
  args: { initialExpanded: 'sales-chart' },
  ...at('phone390', 'light'),
};
export const PhoneOverview: Story = {
  name: '390 · Expanded overview',
  args: { initialExpanded: 'platform-overview' },
  ...at('phone390', 'dark'),
};
