import type { Meta, StoryObj } from '@storybook/react';
import { PlatformPage } from './Platform.page';

/**
 * RDY-257. Prototype only: not exported from the package. Portal Platform detail and onboarding (handover 2.3) in the real PlatformShell:
 * the map (this building focused, its partners lit) and the vertical tab list in the place column, the five sections in the sheet
 * (General info, System, Team, Connections, Leda & Memory), each with its own draft ("Unsaved" on its tab, Save and Discard, the browser's
 * "Leave site?" prompt), and the onboarding steps (`?new=<kind>`, resumable at `?id=…&setup=N`). Composed only from @readyph/ui parts.
 * Gaps for Leonardo: no text field / form field component (the page uses a local labelled input with the same classes as BlockedQuestions),
 * and C22 is person-by-platform while this Team tab is people-by-role (composed from Select and rows).
 */
const meta: Meta<typeof PlatformPage> = {
  title: 'Prototypes/Platform',
  component: PlatformPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof PlatformPage>;

export const GeneralInfo: Story = { name: 'General info', args: { platformId: 'autoworks', tab: 'general' } };
export const GeneralUnsaved: Story = { name: 'General info, unsaved draft', args: { platformId: 'autoworks', tab: 'general', dirtyTab: 'general' } };
export const System: Story = { args: { platformId: 'autoworks', tab: 'system' } };
export const SystemInventory: Story = { name: 'System (Inventory)', args: { platformId: 'stockroom', tab: 'system' } };
export const Team: Story = { args: { platformId: 'autoworks', tab: 'team' } };
export const Connections: Story = { args: { platformId: 'cafe', tab: 'connections' } };
export const ConnectionsFlashed: Story = { name: 'Connections, deep link', args: { platformId: 'cafe', tab: 'connections', flash: 'reads:stock:stockroom' } };
export const LedaAndMemory: Story = { name: 'Leda & Memory', args: { platformId: 'autoworks', tab: 'leda' } };
export const DisconnectBlocked: Story = { name: 'Disconnect blocked (still shares)', args: { platformId: 'stockroom', tab: 'general', dialog: 'blocked' } };
export const DisconnectConfirm: Story = { name: 'Disconnect confirm', args: { platformId: 'autoworks', tab: 'general', dialog: 'confirm' } };
export const OnboardingStart: Story = { name: 'Onboarding: step 1 (?new=repair)', args: { onboard: { kind: 'repair' } } };
export const OnboardingInventory: Story = { name: 'Onboarding: step 1 (?new=inventory)', args: { onboard: { kind: 'inventory' } } };
export const OnboardingFromLeda: Story = {
  name: 'Onboarding: Leda prefilled',
  args: { onboard: { kind: 'pos', byLeda: 'Add a POS for the parts counter', label: 'Parts Counter' } },
};
export const OnboardingResume: Story = { name: 'Onboarding: resume at step 3 (?setup=3)', args: { onboard: { kind: 'inventory', id: 'stockroom', step: 2 } } };
export const Loading: Story = { args: { platformId: 'autoworks', state: 'loading' } };
export const ErrorState: Story = { name: 'Error', args: { platformId: 'autoworks', state: 'error' } };
export const Phone: Story = { args: { platformId: 'autoworks', tab: 'general' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
export const PhoneLeda: Story = { name: 'Phone, Leda & Memory', args: { platformId: 'autoworks', tab: 'leda' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
