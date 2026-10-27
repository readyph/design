import type { Meta, StoryObj } from '@storybook/react';
import { PlatformsPage } from './Platforms.page';

/**
 * RDY-256, exact copy RDY-360. Prototype only: not exported from the package. Portal Platforms (handover 2.2) as an exact copy of the
 * workshop page `platforms.html` (workshop/prototypes/portal-home/round-2/final): the same data, wording, sizes, map, shell and flows,
 * in the real PlatformShell and composed only from @readyph/ui parts.
 *
 * Each story is a state of that page. Data sets are the prototype's: two platforms (default), `?set=few`, `?set=many` (8, the scale test).
 * Marketplace entry points: Add (place column), Add a platform, Add another platform, the rail "+", "Not shared yet" Add (preselects the
 * reader), the empty state, `?add=1` and Leda's "Add a POS for the parts counter". Opening a platform shows a toast; the real page is C15.
 * Anything that takes a click in the workshop page (row menu, Disconnect, the palette, Leda's panel) works the same here.
 */
const meta: Meta<typeof PlatformsPage> = {
  title: 'Prototypes/Platforms',
  component: PlatformsPage,
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof PlatformsPage>;
const phone = { viewport: { defaultViewport: 'mobile1' } };

export const Default: Story = { name: 'Two platforms', args: { set: 'duo' } };
export const Few: Story = { name: 'Few (3, one offline)', args: { set: 'few' } };
export const Many: Story = { name: 'Many (8 platforms)', args: { set: 'many' } };
export const Loading: Story = { args: { set: 'duo', state: 'loading' } };
export const ErrorState: Story = { name: 'Error', args: { set: 'duo', state: 'error' } };
export const Empty: Story = { args: { set: 'empty' } };
export const MarketplaceFromAdd: Story = { name: 'Entry: ?add=1', args: { set: 'duo', add: {} } };
export const MarketplaceFromNotShared: Story = { name: 'Entry: Not shared yet, Add (POS)', args: { set: 'duo', add: { pick: 'pos' } } };
export const MarketplaceFromLeda: Story = { name: 'Entry: Leda prefilled (POS)', args: { set: 'duo', add: { pick: 'pos', fromLeda: true } } };
export const PaletteOpen: Story = { name: 'Ask Leda palette', args: { set: 'duo', start: { palette: true } } };
export const LedaAnswer: Story = { name: 'Leda panel: What shares data with what?', args: { set: 'many', start: { ask: 'What shares data with what?' } } };
export const LedaRefusal: Story = { name: 'Leda panel: refuses to disconnect', args: { set: 'duo', start: { ask: 'Disconnect Parts Stockroom' } } };
export const DisconnectConfirm: Story = { name: 'Disconnect: confirm', args: { set: 'duo', start: { disconnect: 'autoworks' } } };
export const DisconnectBlocked: Story = { name: 'Disconnect: still shares data', args: { set: 'duo', start: { disconnect: 'stockroom' } } };
export const Phone: Story = { name: 'Phone', args: { set: 'many' }, parameters: phone };
export const PhoneDefault: Story = { name: 'Phone: two platforms', args: { set: 'duo' }, parameters: phone };
export const PhoneFew: Story = { name: 'Phone: few', args: { set: 'few' }, parameters: phone };
export const PhoneLoading: Story = { name: 'Phone: loading', args: { set: 'duo', state: 'loading' }, parameters: phone };
export const PhoneError: Story = { name: 'Phone: error', args: { set: 'duo', state: 'error' }, parameters: phone };
export const PhoneEmpty: Story = { name: 'Phone: empty', args: { set: 'empty' }, parameters: phone };
export const PhoneMarketplace: Story = { name: 'Phone: marketplace', args: { set: 'duo', add: {} }, parameters: phone };
