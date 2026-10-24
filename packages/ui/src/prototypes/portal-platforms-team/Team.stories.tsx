import type { Meta, StoryObj } from '@storybook/react';
import { TeamPrototype, type TeamPrototypeProps } from './TeamPage';

/**
 * PROTOTYPE (RDY-178, epic RDY-173 features 3, 6, 7) - Portal Team in the RDY-175 shell.
 * Member table at 36px rows, Compact at 32px (density toggle, md+); stacked list below md.
 * Dialogs (invite, reset link) use the kit Modal at 8px radius.
 * Leda entry point: Ask Leda in the top bar opens the side panel.
 * Kit gaps for both pages are listed in `Prototypes/Portal/[For Review] Platforms` > Notes.
 */
const viewports = {
  w1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  w1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
  w390: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
};

const meta: Meta<TeamPrototypeProps> = {
  title: 'Prototypes/Portal/[For Review] Team',
  component: TeamPrototype,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'w1440' } },
  globals: { theme: 'light' },
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    role: { control: 'inline-radio', options: ['admin', 'member'] },
    density: { control: 'inline-radio', options: ['default', 'compact'] },
    leda: { control: 'inline-radio', options: ['closed', 'empty', 'conversation', 'confirm'] },
  },
  args: { theme: 'light', role: 'admin', density: 'default', leda: 'closed', dialog: 'none', state: 'ready' },
};
export default meta;
type Story = StoryObj<TeamPrototypeProps>;

const at = (v: keyof typeof viewports) => ({ viewport: { viewports, defaultViewport: v } });
const dark = { args: { theme: 'dark' as const }, globals: { theme: 'dark' } };

/* 1440 */
export const Light: Story = { name: '1440 / Light (36px rows)' };
export const Compact: Story = { name: '1440 / Compact (32px rows)', args: { density: 'compact' } };
export const Dark: Story = { name: '1440 / Dark', ...dark };
export const CompactDark: Story = { name: '1440 / Compact, dark', args: { density: 'compact', theme: 'dark' }, globals: { theme: 'dark' } };
export const WithLeda: Story = { name: '1440 / Leda open (invite confirm)', args: { leda: 'confirm' } };
export const Invite: Story = { name: '1440 / Invite member', args: { dialog: 'invite' } };
export const InviteError: Story = { name: '1440 / Invite: invalid email', args: { dialog: 'invite-error' } };
export const InviteDark: Story = { name: '1440 / Invite, dark', args: { dialog: 'invite', theme: 'dark' }, globals: { theme: 'dark' } };
export const ResetLink: Story = { name: '1440 / Send reset link', args: { dialog: 'reset' } };
export const ResetLimited: Story = { name: '1440 / Reset link: rate limited', args: { dialog: 'reset-limited' } };
export const JustYou: Story = { name: '1440 / First run (just you)', args: { state: 'just-you' } };
export const NoAccess: Story = { name: '1440 / Member: no access', args: { role: 'member' } };

/* 1024 */
export const Laptop: Story = { name: '1024 / Light', parameters: at('w1024') };
export const LaptopDark: Story = { name: '1024 / Dark', ...dark, parameters: at('w1024') };
export const LaptopLeda: Story = { name: '1024 / Leda open (sidebar folds)', args: { leda: 'conversation' }, parameters: at('w1024') };

/* 390 */
export const Phone: Story = { name: '390 / Light', parameters: at('w390') };
export const PhoneDark: Story = { name: '390 / Dark', ...dark, parameters: at('w390') };
export const PhoneInvite: Story = { name: '390 / Invite member', args: { dialog: 'invite' }, parameters: at('w390') };
