import type { Meta, StoryObj } from '@storybook/react';
import { Team } from './Team';

/**
 * RDY-258. Prototype only: stories are not exported from the package.
 * Portal Team in the real PlatformShell (shared `PortalFrame`): the place column (map, where they work, roles by kind,
 * Portal access, seats), the sheet (everyone as a table with a role per platform, grouped Waiting to join / Suspended / People),
 * the person subpage (roles on each platform, Portal access, account, password, activity, suspend), the invite dialog
 * (create, then send now or later) and Leda's entry points (ask bar, palette, conversation, her drafted invite).
 * Guards (own access, creator, last admin, suspend, reset link rules) show their reason instead of acting.
 */
const meta: Meta<typeof Team> = {
  title: 'Prototypes/Team',
  component: Team,
  parameters: { layout: 'fullscreen', viewport: { defaultViewport: 'desktop' } },
  argTypes: {
    set: { control: 'inline-radio', options: ['live', 'few', 'many'] },
    state: { control: 'inline-radio', options: ['live', 'loading', 'error', 'solo', 'noaccess', 'manager', 'over'] },
  },
};
export default meta;
type Story = StoryObj<typeof Team>;

/** Nine people, Rico's invite not sent, Carlo's expired. Click a name (or press j / k and Enter) to open the person. */
export const Live: Story = { args: { set: 'live', state: 'live' } };
/** Grace Lumbao's page: a role per platform, Portal access, one Save / Discard. */
export const Person: Story = { args: { set: 'live', state: 'live', person: 'grace' } };
/** Liza (Admin): the roles rows are replaced by full access. */
export const PersonAdmin: Story = { args: { set: 'live', state: 'live', person: 'liza' } };
/** Ramon: the creator. His Portal access and suspend are locked with the reason. */
export const PersonCreator: Story = { args: { set: 'live', state: 'live', person: 'mon' } };
/** The invite dialog open on load. */
export const InviteDialog: Story = { args: { set: 'live', state: 'live', startInvite: true } };
export const Loading: Story = { args: { set: 'live', state: 'loading' } };
export const ErrorState: Story = { name: 'Error', args: { set: 'live', state: 'error' } };
/** Just you so far: the first-invite box. */
export const Solo: Story = { args: { set: 'live', state: 'solo' } };
/** Arnel (stock clerk): no access to the team; the admins are named. */
export const NoAccess: Story = { args: { set: 'live', state: 'noaccess' } };
/** Jun (Auto Works manager): sees the team, invites to his platform; role changes, suspend and reset are locked. */
export const Manager: Story = { args: { set: 'live', state: 'manager' } };
/** Free plan, 3 seats: 10 of 3, amber and red messages; invites still work. */
export const OverSeats: Story = { args: { set: 'live', state: 'over' } };
/** Three platforms: one column each. */
export const ThreePlatforms: Story = { args: { set: 'few', state: 'live' } };
/** Eight platforms: the roles become one cell of chips ("All 8 · Manager"). */
export const ManyPlatforms: Story = { args: { set: 'many', state: 'live' } };
export const Phone: Story = { args: { set: 'live', state: 'live' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const PhonePerson: Story = { args: { set: 'live', state: 'live', person: 'grace' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
