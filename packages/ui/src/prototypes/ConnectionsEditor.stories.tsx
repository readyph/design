import type { Meta, StoryObj } from '@storybook/react';
import { PlatformShell } from '../components/PlatformShell';
import { Demo } from '../components/ConnectionsEditor.demo';
import { LedaNote } from '../components/LedaNote';

/** RDY-286 (C26). Prototype only: stories are not exported from the package. Connections tab in the real PlatformShell sheet. */
const meta: Meta = {
  title: 'Prototypes/Portal/Connections editor',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const sheet = (node: React.ReactNode) => <PlatformShell heading="Auto Works" sheetLabel="Connections">{node}</PlatformShell>;

export const InSheet: StoryObj = { name: 'Entry: platform Connections tab', render: () => sheet(<Demo inSheet />) };
export const FromConnectData: StoryObj = { name: 'Entry: Connect data link (flash)', render: () => sheet(<Demo inSheet flashId="reads:stock:main" />) };
export const FromLeda: StoryObj = {
  name: 'Entry: Leda prefilled',
  render: () => sheet(<Demo inSheet defaultChoice="shares:catalog:pasig" ledaNote={<LedaNote>Pasig Loyalty could use your catalog for rewards. Nothing is shared until you press Add connection.</LedaNote>} />),
};
export const SlowSave: StoryObj = {
  name: 'Stress: slow save (800 ms)',
  render: () => sheet(<><Demo inSheet delay={800} /><label className="block p-pad text-ui text-text">Another field <input aria-label="Another field" className="ml-2 h-8 rounded-control border border-control bg-surface px-2" /></label></>),
};
export const SlowSave2s: StoryObj = { name: 'Stress: very slow save (2 s)', render: () => sheet(<Demo inSheet delay={2000} />) };
export const FailedSave: StoryObj = { name: 'Stress: save fails', render: () => sheet(<Demo inSheet delay={800} fail />) };
export const DeepLinkSlow: StoryObj = { name: 'Stress: deep link, slow save', render: () => sheet(<Demo inSheet delay={800} flashId="reads:stock:main" />) };
