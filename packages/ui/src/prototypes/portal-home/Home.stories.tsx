import type { Meta, StoryObj } from '@storybook/react';
import { Notice } from '../../components/Notice';
import { Home, MISSING_IN_KIT, type HomeProps } from './Home';

/**
 * PROTOTYPE (RDY-177, epic RDY-173 features 1, 2, 5) - Portal Home in the Slack-style shell.
 * Every story is the full, responsive shell at the real viewport (use the viewport toolbar for
 * 1440 / 1024 / 390). Type in the composer or pick a chip to open Leda; switch the period;
 * press "Load more" in the activity feed.
 */
const viewports = {
  w1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  w1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
  w390: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
};

const meta: Meta<HomeProps> = {
  title: 'Prototypes/Portal/[For Review] Home',
  component: Home,
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { viewports, defaultViewport: 'w1440' },
  },
  globals: { theme: 'light' },
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    chrome: { control: 'inline-radio', options: ['ink', 'light'] },
    role: { control: 'inline-radio', options: ['admin', 'member'] },
    providers: { control: 'inline-radio', options: ['live', 'pending'] },
    activity: { control: 'inline-radio', options: ['ready', 'loading', 'empty'] },
    platforms: { control: 'inline-radio', options: ['mixed', 'offline'] },
    initialPeriod: { control: 'inline-radio', options: ['today', 'week', 'month', 'quarter'] },
    leda: { control: 'inline-radio', options: ['closed', 'empty', 'conversation', 'confirm'] },
  },
  args: {
    theme: 'light',
    chrome: 'ink',
    role: 'admin',
    providers: 'live',
    activity: 'ready',
    platforms: 'mixed',
    initialPeriod: 'month',
    leda: 'closed',
  },
};
export default meta;
type Story = StoryObj<HomeProps>;

const at = (v: keyof typeof viewports) => ({ viewport: { viewports, defaultViewport: v } });
const dark = { args: { theme: 'dark' as const }, globals: { theme: 'dark' } };

/* 1440 */
export const Light: Story = { name: '1440 / Light' };
export const Dark: Story = { name: '1440 / Dark', ...dark };
export const LedaOpen: Story = { name: '1440 / Asked Leda from the composer', args: { leda: 'conversation' } };
export const Today: Story = { name: '1440 / Period: today', args: { initialPeriod: 'today' } };
export const ProvidersPending: Story = {
  name: '1440 / Live metrics not shipped (period hidden)',
  args: { providers: 'pending' },
};
export const PlatformOffline: Story = { name: '1440 / Platform offline', args: { platforms: 'offline' } };
export const ActivityLoading: Story = { name: '1440 / Activity: loading', args: { activity: 'loading' } };
export const ActivityEmpty: Story = { name: '1440 / Activity: empty', args: { activity: 'empty' } };
export const Member: Story = { name: '1440 / Member (no activity permission)', args: { role: 'member' } };

/* 1024 */
export const Laptop: Story = { name: '1024 / Light', parameters: at('w1024') };
export const LaptopDark: Story = { name: '1024 / Dark', ...dark, parameters: at('w1024') };

/* 390 */
export const Phone: Story = { name: '390 / Light', parameters: at('w390') };
export const PhoneDark: Story = { name: '390 / Dark', ...dark, parameters: at('w390') };
export const PhonePending: Story = {
  name: '390 / Live metrics not shipped',
  args: { providers: 'pending' },
  parameters: at('w390'),
};

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
