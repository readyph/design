import type { Meta, StoryObj } from '@storybook/react';
import { SettingsPage, type SettingsProps, type SettingsSectionId } from './Settings.page';
import type { ServicesPricesProps } from './ServicesPrices.page';
import { Remount, control, liveMeta } from './live';

/** Live Settings: section menu (Shop details, Team, Services & prices, Notifications), Save / Discard bar, staff and template modals. Phone and dark: toolbar Viewport and Theme. */
const SECTIONS: Record<string, SettingsSectionId> = { 'Shop details': 'shop', Team: 'team', 'Services & prices': 'services', Notifications: 'notifications' };
const SCENARIOS: Record<string, NonNullable<SettingsProps['data']>> = {
  'Default (Kapitolyo shop)': 'default',
  'New shop (blank details, no logo, empty team)': 'new',
  'Many staff (40, stress)': 'stress',
  'Long text (names, address, texts)': 'long',
  'Logo uploaded': 'logo',
};
const OVERLAYS: Record<string, SettingsProps['initialOverlay']> = {
  None: 'none', 'Edit staff': 'edit-staff', 'Add staff': 'add-staff', 'Template modal (Quote ready)': 'template', 'Unsaved-changes dialog': 'unsaved',
};
const STATES: Record<string, NonNullable<SettingsProps['initialState']>> = { 'Saved (clean)': 'saved', 'Edited, unsaved': 'dirty', 'Invalid (errors showing)': 'invalid' };
const SERVICES: Record<string, ServicesPricesProps> = {
  'Table (default)': {},
  'Filtered to Brakes': { initialCategory: 'Brakes' },
  'Search with no result': { initialQuery: 'turbo' },
  'Form: add a service': { initialForm: 'new' },
  'Form: Change oil with 2 linked parts': { initialForm: 'sv01' },
  'Confirm: Deactivate': { initialAsk: 'sv10' },
  'Empty (no services yet)': { state: 'empty' },
  'Loading': { state: 'loading' },
};
type Args = { section: string; scenario: string; saveState: string; overlay: string; pushed: boolean; servicesScenario: string };

const meta: Meta<Args> = {
  ...liveMeta,
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Prototypes/SMS/Settings',
  argTypes: {
    section: control.select(Object.keys(SECTIONS), 'Which section is open (the left menu switches it live)', 'Where'),
    scenario: control.select(Object.keys(SCENARIOS), 'Data: default shop, brand-new shop, many staff, long text, logo uploaded', 'Data'),
    saveState: control.select(Object.keys(STATES), 'Save bar: clean, edited (bar visible) or invalid (errors showing). Applies to Shop details and Notifications', 'State'),
    overlay: control.select(Object.keys(OVERLAYS), 'Open a modal or the unsaved-changes dialog on load. Edit staff / Add staff open Team; Template opens Notifications', 'State'),
    pushed: control.bool('Phone only: open the section directly instead of the menu list', 'Where'),
    servicesScenario: control.select(Object.keys(SERVICES), 'Services & prices section: its own starting points (filters, forms, confirm, empty, loading)', 'Services & prices'),
  },
  args: { section: 'Shop details', scenario: 'Default (Kapitolyo shop)', saveState: 'Saved (clean)', overlay: 'None', pushed: false, servicesScenario: 'Table (default)' },
  render: (a) => (
    <Remount on={a}>
      <SettingsPage initialSection={SECTIONS[a.section]} data={SCENARIOS[a.scenario]} initialState={STATES[a.saveState]} initialOverlay={OVERLAYS[a.overlay]} initialPushed={a.pushed} servicesProps={SERVICES[a.servicesScenario]} />
    </Remount>
  ),
};
export default meta;
type Story = StoryObj<Args>;

export const Live: Story = { name: 'Settings' };
