import type { Meta, StoryObj } from '@storybook/react';
import { PlatformToday } from './PlatformToday';
import { ProgressBar } from './ProgressBar';
import { autoWorks, cafe, jobs, longName, stock, stockroom, unbreakable } from './PlatformToday.data';

const meta: Meta<typeof PlatformToday> = {
  title: 'Components/Data display/Platform Today',
  component: PlatformToday,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Platform Today block (C24): one block per platform, the same for every kind. Sticky header (24px logo, full name that wraps, kind, Open), facts line (`FactsLine`, up to 3 facts + "Leda acts here" / "Leda reads only"), then each list as a `ListGroup` (title, "View all N", up to `maxRows` ruled rows that wrap, link chips to the other platform). No lists: latest activity.',
          '',
          'It is built for the place column (`surface="frame"`, 320 to 460px) and also works in the sheet (`surface="surface"`). The header sticks to the nearest scrolling ancestor.',
          '',
          '**Keyboard.** Lists inside do not listen for j / k (`shortcuts={false}`, default): a page keeps page shortcuts on one component. Turn `shortcuts` on only if this block is the main list. Tab order: Open, then each row\'s chip and "View all".',
          '',
          '**Data for Leonardo (generic across kinds).** `platform {name, src?, index?, color?, hq?}`, `kind`, `facts[] {value,label,tone?}`, `leda: acts|reads|offline`, `lists[] {id,title,total,items[],onViewAll}`, `items[] {id,ref?,title,detail?,state?,tone?,qty?,at?,link?{platform,ref?,text,onSelect}}`, `activity[] {id,at,text}`. Rows shown: `pickTodayRows(items, maxRows)` keeps the first row of each tone. The portal sends 3 rows (2 below a 900px sheet or with 4+ platforms).',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story, ctx) => (
      <div className={ctx.args.surface === 'surface' ? 'bg-surface p-4' : 'bg-frame p-4'} style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
  args: { platform: autoWorks, kind: 'Auto repair', onOpen: () => {}, maxRows: 3 },
};
export default meta;
type Story = StoryObj<typeof PlatformToday>;

const facts = [
  { value: 7, label: 'open jobs' },
  { value: 2, label: 'late', tone: 'bad' as const },
  { value: '₱18,400', label: 'today' },
];

export const Default: Story = { args: { facts, leda: 'acts', lists: [{ ...jobs, onViewAll: () => {} }] } };
export const TwoLists: Story = { args: { platform: stockroom, kind: 'Inventory', facts: [{ value: 412, label: 'products' }, { value: 3, label: 'below minimum', tone: 'warn' }], leda: 'reads', lists: [{ ...stock, onViewAll: () => {} }, { ...jobs, id: 'j2', title: 'Orders to pick', total: 2, items: jobs.items.slice(1, 3) }] } };
export const LinkChip: Story = { args: { facts, leda: 'acts', lists: [{ ...jobs, items: jobs.items.slice(0, 1), total: 1 }] } };
export const ActivityOnly: Story = { args: { platform: cafe, kind: 'Point of sale', facts: [{ value: 64, label: 'sales' }], leda: 'reads', activity: [{ id: 'a1', at: '10:12 AM', text: 'Closed shift for Lia Santos' }, { id: 'a2', at: '9:30 AM', text: 'Stock of oat milk reached 0' }, { id: 'a3', at: '8:00 AM', text: 'Opened for the day' }] } };
export const NoLists: Story = { args: { platform: cafe, kind: 'Point of sale', note: 'Opens at 8:00 AM', leda: 'reads' } };
export const Loading: Story = { args: { facts, loading: true } };
export const ErrorState: Story = { args: { facts, error: true, onRetry: () => {}, lastLoaded: '9:10 AM', leda: 'offline' } };
export const LongNamesAndStrings: Story = {
  args: {
    platform: longName,
    kind: 'Distribution centre, Southern Luzon',
    facts: [{ value: unbreakable, label: 'reference' }, { value: 9, label: 'open' }],
    leda: 'offline',
    lists: [{ id: 'x', title: unbreakable, total: 5, items: [{ id: 'u', ref: unbreakable, title: unbreakable, detail: unbreakable, state: 'Waiting for the supplier to confirm', tone: 'warn', link: { platform: stockroom, ref: unbreakable, text: unbreakable, onSelect: () => {} } }] , onViewAll: () => {} }],
  },
};
export const Hq: Story = {
  args: {
    platform: { name: 'HQ', hq: true },
    kind: 'Team and plan',
    facts: [{ value: 6, label: 'people' }, { value: 2, label: 'invites pending' }, { value: '1,240 / 5,000', label: 'Leda requests' }],
    lists: [{ id: 'inv', title: 'Invites', total: 2, items: [{ id: 'i1', title: 'Marco Reyes · Manager', detail: 'Auto Works · by Ana Cruz', state: 'Waiting for you', tone: 'warn', at: 'Oct 24' }, { id: 'i2', title: 'Lia Santos · Staff', detail: 'Café POS · by Ana Cruz', state: 'Waiting for you', tone: 'warn', at: 'Oct 25' }] }],
    onOpen: undefined,
    children: <div className="mt-5"><ProgressBar value={25} aria-label="Leda requests used this cycle" label="Business plan" /></div>,
  },
};
export const OnSurface: Story = { args: { facts, leda: 'acts', surface: 'surface', lists: [jobs] } };
/** Rows with `onActivate`: the title is a real button (Tab reaches it; Enter and Space activate it). The last activated row id is written to `data-activated` on the block's wrapper. */
export const ActivatableRows: Story = {
  args: {
    facts,
    leda: 'acts',
    lists: [
      {
        ...jobs,
        onViewAll: () => {},
        items: jobs.items.map((i) => ({
          ...i,
          onActivate: () => {
            document.body.dataset.activated = i.id;
          },
        })),
      },
    ],
  },
};
