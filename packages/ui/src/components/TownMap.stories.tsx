import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TownMap, type TownMapHandle, type TownMapProps } from './TownMap';
import { Button } from './Button';
import { books, cafe, eight, eightLinks, longName, stockroom, three, threeLinks, two, twoLinks, autoWorks, hq } from './TownMap.data';

const meta: Meta<typeof TownMap> = {
  title: 'Components/Data display/Platform map',
  component: TownMap,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Platform map (C16, new; replaces the Lab TownScene RDY-224). The owner\'s isometric town: a building per platform (warehouse = Inventory, service = repair shop, store = POS, **generic office** for any other kind with the kind on its sign, HQ plot), empty lots (`null` slots), roads for data links, and an HTML label button per building. It fills its parent width and is `--map-h` tall (326px at 1440x900, 254px below 960, 160px phone). Put it at the top of the place column.',
          '',
          '**Prototype API to React.** `mount(el, {dim})` = mounting the component, `dimOthers`. `render(platforms, connections)` = `platforms` (row by row, `null` = empty lot) and `links`. `select(id)` = `selected`. `highlight(ids)` = `highlight`. `focus(id)` = `focus`. `onPick` = `onSelect` (also `null` for empty ground and Escape). `onHover` = `onHover` (pointer only, like map.js mouseenter; keyboard focus shows the focus outline). `labelHTML/labelClass/labelAria` = built in (`platformLabel` overrides the name). `state()`, `morph(from, ms)`, `runVan(from, to)`, `rotate`, `zoom`, `placeLabels` = ref methods (`TownMapHandle`). `setDark` = no-op kept for compat: colours follow the tokens (`--map-*`, status and accent variables, `light-dark()` for the rest), so light, dark and `data-theme` need no call. `refreshLabels` is not needed: labels are React.',
          '',
          '**Status is never colour alone.** Buildings: lights (running lit, slow flickering, offline dark) plus the label line "Kind · since 10:12 AM" / "· offline" / "· no data" and a shape mark (filled dot = slow, ring = offline, dashed ring = no data). Roads: solid = working (cobalt, vans), long dashes = slow (amber, slow vans), short dashes = broken (raspberry, no vans); the legend and a screen-reader list say it in words.',
          '',
          '**Keyboard and AT.** The map is a group with a list of buttons (one per platform, `aria-pressed`); the drawing is `aria-hidden`. Escape clears the selection. Rotate / zoom / legend appear on hover, on `:focus-within`, and always on touch; Ctrl or Cmd + wheel zooms (a plain wheel scrolls the page). Hidden below 640px, where the strip is for pointing at a building.',
          '',
          '**Motion.** Vans, flowing road dots, lights flicker, rotation easing and `morph` are all static under `prefers-reduced-motion`. The loop stops when nothing moves and pauses off-screen; observers and frames are released on unmount.',
          '',
          '**Notes for Leonardo.** Data per platform: `{id, name, shortName?, kind, mapType?, status, statusSince?, count?, logo?, color?, index?, hq?, error?}`. Tokens added: `map-side-2`; `map-top/side/road` light values replaced (were placeholders). Preset keyframes `town-flow-a/b` (+ slow). Label size and the 8px edge margin follow the prototype; labels sit at their roof with a 1px stem.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-frame p-2" style={{ maxWidth: 460 }}>
        <Story />
      </div>
    ),
  ],
  args: { platforms: three, links: threeLinks, caption: '3 platforms + HQ' },
};
export default meta;
type Story = StoryObj<typeof TownMap>;

function Interactive(args: TownMapProps) {
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const ref = useRef<TownMapHandle>(null);
  return (
    <div>
      <TownMap ref={ref} {...args} selected={sel} highlight={hover ? [hover] : null} onSelect={setSel} onHover={setHover} />
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" onClick={() => ref.current?.runVan('stockroom', 'autoworks')}>Run a van</Button>
        <Button variant="secondary" onClick={() => setSel(null)}>Clear</Button>
      </div>
    </div>
  );
}

export const Default: Story = { render: (a) => <Interactive {...a} /> };
export const TwoPlatforms: Story = { render: (a) => <Interactive {...a} />, args: { platforms: two, links: twoLinks, caption: '2 platforms + HQ' } };
export const EightPlatforms: Story = { render: (a) => <Interactive {...a} />, args: { platforms: eight, links: eightLinks, caption: '8 platforms + HQ' } };
export const Selected: Story = { args: { selected: 'autoworks' } };
export const SelectedNoDim: Story = { args: { selected: 'autoworks', dimOthers: false } };
export const Focus: Story = { args: { focus: 'stockroom' } };
export const Highlight: Story = { args: { highlight: ['stockroom', 'cafe'] } };
export const GenericOfficeAndOffline: Story = { args: { platforms: [books, cafe, stockroom, hq], links: [{ from: 'stockroom', to: 'cafe', status: 'ok' }] } };
export const LongNames: Story = { args: { platforms: [longName, { ...autoWorks, name: 'Auto Works Quezon City Branch with an Unbroken Extra Long Name', shortName: undefined }, cafe, hq], links: threeLinks.slice(0, 1) } };
export const Loading: Story = { args: { loading: true } };
export const PlatformNoData: Story = { args: { platforms: [stockroom, { ...autoWorks, error: true }, cafe, hq] } };
export const ErrorState: Story = { args: { error: true, onRetry: () => {} } };
export const NoPlatformsYet: Story = { args: { platforms: [null], links: [], caption: undefined } };
