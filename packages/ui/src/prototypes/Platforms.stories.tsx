import type { Meta, StoryObj } from '@storybook/react';
import { PlatformsPage } from './Platforms.page';

/**
 * [For Review] RDY-256. Prototype only: not exported from the package. Portal Platforms (handover 2.2) in the real PlatformShell:
 * the map and Leda's finding with the data links and "Not shared yet" in the place column, "All platforms" (C18 rows, problem-first) in the sheet.
 * Composed only from @readyph/ui parts. Marketplace entry points: Add (place column), Add a platform, Add another platform, rail "+",
 * "Not shared yet" Add (preselects the reader), the empty state, `?add=1` and Leda's "Add a POS for the parts counter" (Ask Leda bar).
 * Opening a platform shows a toast; the real page is C15.
 */
const meta: Meta<typeof PlatformsPage> = {
  title: 'Prototypes/Portal/[For Review] Platforms',
  component: PlatformsPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof PlatformsPage>;

export const Default: Story = { name: 'Two platforms', args: { set: 'duo' } };
export const Few: Story = { name: 'Few (3, one needs setup)', args: { set: 'few' } };
export const Many: Story = { name: 'Many (7 platforms)', args: { set: 'many' } };
export const Loading: Story = { args: { set: 'duo', state: 'loading' } };
export const ErrorState: Story = { name: 'Error', args: { set: 'duo', state: 'error' } };
export const Empty: Story = { args: { set: 'empty' } };
export const MarketplaceFromAdd: Story = { name: 'Entry: ?add=1', args: { set: 'duo', add: {} } };
export const MarketplaceFromNotShared: Story = { name: 'Entry: Not shared yet, Add (POS)', args: { set: 'duo', add: { pick: 'pos' } } };
export const MarketplaceFromLeda: Story = { name: 'Entry: Leda prefilled (POS)', args: { set: 'duo', add: { pick: 'pos', fromLeda: true } } };
export const Phone: Story = { name: 'Phone', args: { set: 'many' }, parameters: { viewport: { defaultViewport: 'mobile1' } } };
