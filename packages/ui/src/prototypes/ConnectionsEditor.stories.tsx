import type { Meta, StoryObj } from '@storybook/react';
import { PlatformShell } from '../components/PlatformShell';
import { Demo } from '../components/ConnectionsEditor.demo';
import { LedaNote } from '../components/LedaNote';

/** [For Review] RDY-286 (C26). Prototype only: stories are not exported from the package. Connections tab in the real PlatformShell sheet. */
const meta: Meta = {
  title: 'Prototypes/Portal/[For Review] Connections editor',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const sheet = (node: React.ReactNode) => <PlatformShell sheetLabel="Connections">{node}</PlatformShell>;

export const InSheet: StoryObj = { name: 'Entry: platform Connections tab', render: () => sheet(<Demo inSheet />) };
export const FromConnectData: StoryObj = { name: 'Entry: Connect data link (flash)', render: () => sheet(<Demo inSheet flashId="reads:stock:main" />) };
export const FromLeda: StoryObj = {
  name: 'Entry: Leda prefilled',
  render: () => sheet(<Demo inSheet defaultChoice="shares:catalog:pasig" ledaNote={<LedaNote>Pasig Loyalty could use your catalog for rewards. Nothing is shared until you press Add connection.</LedaNote>} />),
};
