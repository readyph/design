import type { Meta, StoryObj } from '@storybook/react';
import { NewServiceWizardPage, type NewServiceWizardPageProps } from './NewServiceWizardPage';
import { customLine, lineFromType, linesFromType, partLine } from './sms/wizardModel';
import { Remount, control, liveMeta } from './sms/live';

/**
 * [For Review] RDY-528. Prototype only: stories are not exported from the package. Live New service wizard (modal, 2 steps: Services & price, Review & confirm; Schedule and staff is a visible block inside the review, mileage and concerns are an optional row) and the quotation lifecycle (the Services page behind it is RDY-522), so
 * Book service / Save as quotation / Book it run for real. The wizard is also reachable by clicking New service on Today, Services and Customers.
 * Controls open it at any step, with any prefill, or on a parked quote.
 */
const PREFILLS = ['empty (customer first)', 'customer + 2 services', 'custom price + custom line', 'services with their parts', 'not enough stock', 'part out of stock, on order', 'custom service with an Inventory part', 'from a calendar slot (date, time, length)'] as const;
const MODES = ['new service', 'view parked quote', 'book parked quote', 'edit parked quote'] as const;
const EDITS = ['none', 'customer and car', 'services and price', 'more details', 'remarks'] as const;
const EDIT_ID = { 'none': undefined, 'customer and car': 'customer', 'services and price': 'lines', 'more details': 'job', 'remarks': 'remarks' } as const;
type Args = { mode: (typeof MODES)[number]; step: 1 | 2; editing: (typeof EDITS)[number]; prefill: (typeof PREFILLS)[number]; quotationPreview: boolean; remarks: boolean };

const two = () => [...linesFromType('sv01'), ...linesFromType('sv13')];
const customPrice = () => { const l = lineFromType('sv13')!; return [...linesFromType('sv01'), { ...l, price: 650 }, customLine('Replace wiper arm', 380)]; };
const short = () => linesFromType('sv10').map((l) => (l.kind === 'part' ? { ...l, qty: 3 } : l));
const customWithPart = () => { const c = customLine('Fabricate exhaust bracket', 900); return [c, partLine('pr06', c.key)]; };
const draftLines: Record<(typeof PREFILLS)[number], () => ReturnType<typeof two>> = {
  'empty (customer first)': () => [],
  'customer + 2 services': two,
  'custom price + custom line': customPrice,
  'services with their parts': () => [...linesFromType('sv01'), ...linesFromType('sv10')],
  'not enough stock': short,
  'part out of stock, on order': () => linesFromType('sv17'),
  'custom service with an Inventory part': customWithPart,
  'from a calendar slot (date, time, length)': two,
};

function toProps(a: Args): NewServiceWizardPageProps {
  if (a.mode !== 'new service') {
    return { initialFlow: { kind: a.mode === 'view parked quote' ? 'view' : a.mode === 'book parked quote' ? 'book' : 'edit', jobId: 'j0421', startStep: a.step, initialEdit: EDIT_ID[a.editing] } as never };
  }
  const empty = a.prefill === 'empty (customer first)';
  const slot = a.prefill.startsWith('from a calendar slot') ? { date: '2026-11-05', start: 11 * 60, dur: 90, dragged: true } : undefined;
  return {
    initialFlow: {
      kind: 'new', customerId: empty ? undefined : 'c01', startStep: a.step, initialEdit: EDIT_ID[a.editing], initialPreview: a.quotationPreview && a.step === 2, slot,
      initialDraft: empty ? undefined : { lines: draftLines[a.prefill](), ...(a.remarks ? { remarks: 'Customer wants the old pads back. Call before replacing the wiper arm.' } : {}) },
    } as never,
  };
}

const meta: Meta<Args> = {
  ...liveMeta,
  tags: ['!autodocs'], // literal on purpose: the CSF indexer cannot read tags through a spread
  title: 'Components/SMS/New service wizard page',
  argTypes: {
    mode: control.select(MODES, 'New service, or open a parked quotation (view, Customer agreed - Book it, Edit)', 'Open on load'),
    step: { control: 'inline-radio', options: [1, 2], description: 'Step it opens on: 1 Services & price, 2 Review & confirm (needs a customer and a service)', table: { category: 'Open on load' } },
    editing: control.select(EDITS, 'Step 2: which block opens in its editor (more details = the optional mileage and concerns row expanded)', 'Open on load'),
    prefill: control.select(PREFILLS, 'What is already in the order (new service only)', 'Open on load'),
    quotationPreview: control.bool('Step 2: open the printable quotation preview', 'Open on load'),
    remarks: control.bool('Step 2: remarks filled in', 'Open on load'),
  },
  args: { mode: 'new service', step: 1, editing: 'none', prefill: 'customer + 2 services', quotationPreview: false, remarks: false },
  render: (a) => <Remount on={a}><NewServiceWizardPage {...toProps(a)} /></Remount>,
};
export default meta;
type Story = StoryObj<Args>;

export const Live: Story = { name: '[For Review] New service wizard' };
