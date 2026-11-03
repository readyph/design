import type { Meta, StoryObj } from '@storybook/react';
import { ServicesPage, type ServicesProps } from './ServicesPage';
import { Remount, control, liveMeta } from './sms/live';
import { linesFromType } from './sms/wizardModel';

/** [For Review] RDY-522. Prototype only: stories are not exported from the package. Live Services page: Calendar | List, the Today panel, the Inspector, the New service wizard and the quotation flows. All reachable by clicking. */
const slot = { date: '2026-11-05', start: 11 * 60, dur: 90, dragged: true };
const SCENARIOS: Record<string, ServicesProps> = {
  'Calendar, week (default)': {},
  'Calendar, next week (Sunday closed)': { initialDate: '2026-11-09' },
  'Calendar, full day (Wed 4 Nov)': { initialDate: '2026-11-04', initialSpan: 'day' },
  'Calendar, Needs you on (the rest fade)': { initialNeedsOnly: true, initialDate: '2026-11-04', initialSpan: '3day' },
  'Calendar, one mechanic (shift and free time)': { initialFilters: { mechanic: 'm-ricky' }, initialDate: '2026-11-03' },
  'Calendar, search (others fade)': { initialFilters: { q: 'brake' }, initialDate: '2026-11-04' },
  'Calendar, vacant slot hover': { initialDate: '2026-11-05', demoHover: { date: '2026-11-05', start: 11 * 60 } },
  'Calendar, drag-selecting a duration': { initialDate: '2026-11-05', demoSelect: { date: '2026-11-05', start: 10 * 60 + 30, dur: 120, dragged: true } },
  'Calendar, service open': { initialDetail: { kind: 'service', id: 'j0412' } },
  'Calendar, inquiry open': { initialDetail: { kind: 'inquiry', id: 'iq2' } },
  'Wizard: new service from a calendar slot': { initialDate: '2026-11-05', initialFlow: { kind: 'new', slot: { date: '2026-11-05', start: 11 * 60, dur: 90, dragged: true } } },
  'Wizard: new service from an inquiry': { initialFlow: { kind: 'new', plate: 'Rodel Pascual', notes: 'Brake pads for a Ford Ranger 2019. Pa-quote po, may stock ba?' } },
  'Wizard: slot prefilled, step 2': { initialDate: '2026-11-05', initialFlow: { kind: 'new', startStep: 2, customerId: 'c01', slot, initialDraft: { lines: [...linesFromType('sv01')] } } },
  'Quote: open a parked quotation': { initialTab: 'list', initialFlow: { kind: 'view', jobId: 'j0421' } },
  'Quote: customer agreed, Book it': { initialTab: 'list', initialFlow: { kind: 'book', jobId: 'j0421', startStep: 2 } },
  'Quote: Edit quote': { initialTab: 'list', initialFlow: { kind: 'edit', jobId: 'j0421', startStep: 2 } },
  'Quote: findable in the Inspector': { initialTab: 'list', initialDetail: { kind: 'service', id: 'j0421' } },
  'List': { initialTab: 'list' },
  'List, filtered (ready and unpaid)': { initialTab: 'list', initialFilters: { view: 'ready', unpaid: true } },
  'List, bulk selected (quotes)': { initialTab: 'list', initialFilters: { view: 'quotes' }, initialSelected: ['j0414', 'j0416', 'j0421'] },
  'List, service open': { initialTab: 'list', initialDetail: { kind: 'service', id: 'j0412' } },
  'List, customer lookup open': { initialTab: 'list', initialDetail: { kind: 'customer', id: 'c01' } },
  'List, Completed history (40 loaded)': { initialTab: 'list', initialFilters: { view: 'done' }, initialSort: 'newest', initialPage: 1 },
  'List, empty results (search)': { initialTab: 'list', initialFilters: { q: 'NZZ 9981' } },
  'List, scrolling (40 loaded, loading the next 20)': { initialTab: 'list', initialPage: 1, initialLoadingMore: true },
  'List, end of list (84 services)': { initialTab: 'list', initialPage: 4 },
  'List, waiting on parts (use Inventory = slow)': { initialTab: 'list', initialFilters: { parts: true } },
  'Payment: collect on JO-0403 (ready, unpaid)': { initialTab: 'list', initialPaying: { jobId: 'j0403' } },
  'Payment: discount editor open': { initialTab: 'list', initialPaying: { jobId: 'j0403', overlay: 'discount' } },
  'Phone: updates list': { initialPhoneUpdates: true },
  'Phone: filters sheet': { initialTab: 'list', initialPhoneFilters: true, initialFilters: { unpaid: true } },
  'Phone: select mode': { initialTab: 'list', initialPhoneSelect: true, initialFilters: { view: 'quotes' }, initialSelected: ['j0414'] },
};
type Args = {
  scenario: keyof typeof SCENARIOS;
  state: NonNullable<ServicesProps['state']>;
  inventory: NonNullable<ServicesProps['inventory']>;
  tab: 'by scenario' | 'calendar' | 'list';
  needsOnly: boolean;
  panelCollapsed: boolean;
  leda: boolean;
  stress: boolean;
};

const toProps = (a: Args): ServicesProps => {
  const s = SCENARIOS[a.scenario] ?? {};
  return {
    ...s,
    state: a.state, inventory: a.inventory,
    initialTab: a.tab === 'by scenario' ? s.initialTab : a.tab,
    initialNeedsOnly: a.needsOnly || s.initialNeedsOnly,
    initialPanelCollapsed: a.panelCollapsed, ledaOpen: a.leda,
    initialDate: s.initialDate ?? (a.stress ? '2026-11-02' : undefined),
  };
};

const meta: Meta<Args> = {
  ...liveMeta,
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Prototypes/SMS/Services',
  argTypes: {
    scenario: control.select(Object.keys(SCENARIOS), 'Where the page opens: a calendar range, a list view, an open overlay (inspector, wizard, quotation). Everything stays clickable from there.', 'Open on load'),
    state: control.select(['ready', 'loading', 'first-run'], 'Data state'),
    inventory: control.select(['ok', 'slow', 'down'], 'Inventory link'),
    tab: control.select(['by scenario', 'calendar', 'list'], 'Tab', 'Layout'),
    needsOnly: control.bool('"Needs you" filter on', 'Layout'),
    panelCollapsed: control.bool('Right panel collapsed to its rail', 'Layout'),
    leda: control.bool('Leda conversation panel open', 'Layout'),
    stress: control.bool('Long names (week of 2 Nov has the long customer and service names)', 'Data'),
  },
  args: { scenario: 'Calendar, week (default)', state: 'ready', inventory: 'ok', tab: 'by scenario', needsOnly: false, panelCollapsed: false, leda: false, stress: false },
  render: (a) => <Remount on={a}><ServicesPage {...toProps(a)} /></Remount>,
};
export default meta;
type Story = StoryObj<Args>;

export const Live: Story = { name: '[For Review] Services' };
