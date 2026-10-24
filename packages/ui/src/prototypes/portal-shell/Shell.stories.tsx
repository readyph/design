import type { Meta, StoryObj } from '@storybook/react';
import { Notice } from '../../components/Notice';
import { MISSING_IN_KIT, Shell, type ShellProps } from './Shell';

/**
 * PROTOTYPE (RDY-175, epic RDY-173 feature 3) - Portal Slack-style shell.
 * Every story is the full, responsive shell at the real viewport (no side-by-side panes), so
 * breakpoints behave as in the app. Use the viewport toolbar for 1440 / 1024 / 390.
 * Leda fit: >= 1280 docked 360px panel pushes content; 1024-1279 docked and the sidebar folds
 * behind the menu button; < 1024 right sheet (full screen below 640).
 */
const viewports = {
  w1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  w1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
  w390: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
};

const meta: Meta<ShellProps> = {
  title: 'Prototypes/Portal/[For Review] Shell',
  component: Shell,
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
    leda: { control: 'inline-radio', options: ['closed', 'empty', 'conversation', 'confirm'] },
  },
  args: { theme: 'light', chrome: 'ink', role: 'admin', leda: 'closed' },
};
export default meta;
type Story = StoryObj<ShellProps>;

const at = (v: keyof typeof viewports) => ({ viewport: { viewports, defaultViewport: v } });

/* Desktop 1440 */
export const LightInk: Story = { name: '1440 / Light, ink chrome' };
export const DarkInk: Story = { name: '1440 / Dark, ink chrome', args: { theme: 'dark' }, globals: { theme: 'dark' } };
export const LightAllLight: Story = { name: '1440 / Light, all-light chrome', args: { chrome: 'light' } };
export const DarkAllLight: Story = {
  name: '1440 / Dark, all-light chrome',
  args: { theme: 'dark', chrome: 'light' },
  globals: { theme: 'dark' },
};
export const Member: Story = { name: '1440 / Member (limited)', args: { role: 'member', initialPage: 'reports' } };

/* Leda panel states (docked) */
export const LedaEmpty: Story = { name: '1440 / Leda: empty', args: { leda: 'empty' } };
export const LedaConversation: Story = { name: '1440 / Leda: conversation', args: { leda: 'conversation' } };
export const LedaConfirm: Story = { name: '1440 / Leda: confirm before write', args: { leda: 'confirm' } };
export const LedaConfirmDark: Story = {
  name: '1440 / Leda: confirm, dark',
  args: { leda: 'confirm', theme: 'dark' },
  globals: { theme: 'dark' },
};

/* 1024 */
export const Laptop: Story = { name: '1024 / Shell', parameters: at('w1024') };
export const LaptopLeda: Story = {
  name: '1024 / Leda open (sidebar folds)',
  args: { leda: 'conversation' },
  parameters: at('w1024'),
};

/* 390 */
export const Phone: Story = { name: '390 / Shell', parameters: at('w390') };
export const PhoneMenu: Story = { name: '390 / Navigation sheet', args: { menuOpen: true }, parameters: at('w390') };
export const PhoneLeda: Story = { name: '390 / Leda full-screen sheet', args: { leda: 'confirm' }, parameters: at('w390') };
export const PhoneDark: Story = {
  name: '390 / Dark',
  args: { theme: 'dark' },
  globals: { theme: 'dark' },
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
