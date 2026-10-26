import type { Meta, StoryObj } from '@storybook/react';
import { Home } from './Home';

/**
 * [For Review] RDY-255. Prototype only: stories are not exported from the package.
 * Portal Home in the real PlatformShell: the map and Needs you in the place column, Today / a case / the overview in the sheet,
 * and Leda's entry points (L1 to L10: Ask bar, centred bar and chips, phone bar, palette, conversation panel, headline,
 * proposals and watching, case note and proposal, Today blocks, status bar usage).
 * The chrome (rail, phone top bar with account and Leda, phone nav with labelled tabs and More) is the shared `PortalFrame`
 * (`./PortalFrame.tsx`, not exported from the package): Memory, Platforms and Platform detail adopt it instead of local chrome.
 */
const meta: Meta<typeof Home> = {
  title: 'Prototypes/Portal/[For Review] Home',
  component: Home,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    set: { control: 'inline-radio', options: ['live', 'few', 'many'] },
    state: { control: 'inline-radio', options: ['live', 'quiet', 'loading', 'error'] },
  },
};
export default meta;
type Story = StoryObj<typeof Home>;

/** Four decisions; opens on Today. Click an item's button (or press Enter) to open its case, then Confirm. */
export const Live: Story = { args: { set: 'live', state: 'live' } };
/** Nothing needs you: opens on the overview (greeting, Leda bar and chips, last 7 days, next, yesterday). */
export const Quiet: Story = { args: { set: 'live', state: 'quiet' } };
/** Skeletons everywhere; Leda's mark plays Aurora. */
export const Loading: Story = { args: { set: 'live', state: 'loading' } };
/** One platform fails to load: its block, queue line and chart slot say so with Retry; the rest renders. */
export const PlatformError: Story = { args: { set: 'live', state: 'error' } };
/** Eight platforms: Today is 8 blocks (2 rows each), the overview is compact rows. */
export const ManyPlatforms: Story = { args: { set: 'many', state: 'live' } };
export const ManyPlatformsQuiet: Story = { args: { set: 'many', state: 'quiet' } };
/** Three platforms. */
export const FewPlatforms: Story = { args: { set: 'few', state: 'live' } };
export const FewPlatformsQuiet: Story = { args: { set: 'few', state: 'quiet' } };
/** Leda's conversation panel open on load (scope "About all your platforms"). */
export const ConversationOpen: Story = { args: { set: 'live', state: 'live', startChat: true } };
/** At 375 and 320 (phone: map strip, Leda bar, items; a row pushes to the case). */
export const Phone: Story = { args: { set: 'live', state: 'live' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
