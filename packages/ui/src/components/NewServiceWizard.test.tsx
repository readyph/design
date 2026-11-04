import { Profiler, type ReactElement } from 'react';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { NewServiceWizardPage } from './NewServiceWizardPage';
import { linesFromType, emptyDraft, jobFieldsOf, vehicleIdOf, wizardMissing } from './sms/wizardModel';
import { customers } from './sms/data';
import { emptyDraft as protoEmptyDraft, jobFieldsOf as protoJobFields, wizardMissing as protoMissing } from '../prototypes/sms/wizardModel';

/** [For Review] RDY-528. Regression guard: opening the wizard (any step, prefilled, from a quote) must settle. Fails on "Maximum update depth" or a render-count blow-up. */
beforeAll(() => {
  class RO { constructor(private cb: ResizeObserverCallback) {} observe() { this.cb([{ contentRect: { width: 1000, height: 600 } } as ResizeObserverEntry], this as unknown as ResizeObserver); } unobserve() {} disconnect() {} }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = IO;
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.scrollTo = () => {};
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as MediaQueryList);
});
afterEach(cleanup);

async function mount(el: ReactElement) {
  let commits = 0;
  const errors: string[] = [];
  const spy = vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(String(a[0])); });
  await act(async () => { render(<Profiler id="p" onRender={() => { commits++; }}>{el}</Profiler>); });
  await act(async () => { await new Promise((r) => setTimeout(r, 900)); }); // simulated loads (600ms) must end
  spy.mockRestore();
  expect(errors.filter((e) => /Maximum update depth|Too many re-renders/.test(e))).toEqual([]);
  expect(commits).toBeLessThan(150);
  return commits;
}

const lines = () => [...linesFromType('sv01'), ...linesFromType('sv13')];
const flows = [
  ['step 1 empty', { kind: 'new' }],
  ['step 1 customer + services', { kind: 'new', customerId: 'c01', initialDraft: { lines: lines() } }],
  ['step 2 review', { kind: 'new', customerId: 'c01', startStep: 2, initialDraft: { lines: lines() } }],
  ['step 2, more details expanded', { kind: 'new', customerId: 'c01', startStep: 2, initialEdit: 'job', initialDraft: { lines: lines() } }],
  ['step 2, services editor', { kind: 'new', customerId: 'c01', startStep: 2, initialEdit: 'lines', initialDraft: { lines: lines() } }],
  ['step 2, customer editor', { kind: 'new', customerId: 'c01', startStep: 2, initialEdit: 'customer', initialDraft: { lines: lines() } }],
  ['slot prefill', { kind: 'new', startStep: 2, customerId: 'c01', initialDraft: { lines: lines() }, slot: { date: '2026-11-05', start: 660, dur: 90, dragged: true } }],
  ['book parked quote', { kind: 'book', jobId: 'j0421', startStep: 2 }],
  ['edit parked quote', { kind: 'edit', jobId: 'j0421', startStep: 2 }],
  ['view quote', { kind: 'view', jobId: 'j0421' }],
] as const;

describe('Wizard revision 6', () => {
  it('step 1: subtotal under the table, no side panel, no total in the footer', async () => {
    const { screen } = await import('@testing-library/react');
    await mount(<NewServiceWizardPage initialFlow={{ kind: 'new', customerId: 'c01', initialDraft: { lines: lines() } } as never} />);
    const dlg = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg.querySelector('aside')).toBeNull();
    expect(dlg.querySelector('[data-row="total"]')?.textContent).toMatch(/Subtotal/);
    expect(dlg.querySelector('footer')?.textContent ?? '').not.toMatch(/Total|₱/);
    expect(screen.getByRole('combobox', { name: 'Add a service' })).toBeTruthy();
  });
  it('step 2: Schedule and staff is visible with date, time and mechanic', async () => {
    const { screen } = await import('@testing-library/react');
    await mount(<NewServiceWizardPage initialFlow={{ kind: 'new', customerId: 'c01', startStep: 2, initialDraft: { lines: lines() } } as never} />);
    expect(document.body.querySelector('[data-block="schedule"]')).not.toBeNull();
    const { within } = await import('@testing-library/react');
    const dlg = within(document.body.querySelector('[role="dialog"]') as HTMLElement);
    expect(dlg.getByText('Mechanic')).toBeTruthy();
    expect(dlg.getByText('Date')).toBeTruthy();
    expect(dlg.getAllByText(/No mechanic yet/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Book service' })).toBeTruthy();
  });
});

describe('New service wizard settles', () => {
  for (const [name, f] of flows) {
    it(`${name}`, async () => {
      await mount(<NewServiceWizardPage initialFlow={f as never} />);
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    });
  }
});

describe('Wizard revision 7', () => {
  it('Add a service: list scrolls inside the dialog (wheel is not cancelled by the scroll lock), custom row pinned, Add custom service link', async () => {
    const { screen, within } = await import('@testing-library/react');
    await mount(<NewServiceWizardPage initialFlow={{ kind: 'new', customerId: 'c01', initialDraft: { lines: lines() } } as never} />);
    const box = screen.getByRole('combobox', { name: 'Add a service' });
    await act(async () => { fireEvent.focus(box); fireEvent.change(box, { target: { value: 'e' } }); });
    const scroller = document.body.querySelector('[data-combo-scroll]') as HTMLElement;
    expect(scroller.className).toMatch(/overflow-y-auto/);
    const seen = vi.fn();
    document.addEventListener('wheel', seen);
    scroller.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 200 }));
    document.removeEventListener('wheel', seen);
    expect(seen).not.toHaveBeenCalled();
    const custom = screen.getByRole('option', { name: /custom service/ });
    expect(scroller.contains(custom)).toBe(false); // pinned footer, outside the scrolling matches
    expect(within(document.body.querySelector('[role="dialog"]') as HTMLElement).getByRole('button', { name: /Add custom service/ })).toBeTruthy();
    await act(async () => { fireEvent.change(box, { target: { value: '' } }); });
    expect(screen.getByRole('option', { name: /Add a custom service/ })).toBeTruthy();
  });
  it('lines table labels parts as a group and the service price as labour', async () => {
    await mount(<NewServiceWizardPage initialFlow={{ kind: 'new', customerId: 'c01', initialDraft: { lines: lines() } } as never} />);
    const dlg = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg.querySelector('[data-group="parts"]')?.textContent).toBe('Parts');
    expect(dlg.textContent).toMatch(/Labour/);
  });
});

/** RDY-640: a customer with no car cannot be booked; no vehicles[0]! left to throw. */
const noCar = { ...customers[0]!, vehicles: [] };
describe('Wizard with a customer who has no car (RDY-640)', () => {
  it('model: "a car" is missing, and job fields no longer throw (both copies)', () => {
    for (const [mk, miss, fields] of [[emptyDraft, wizardMissing, jobFieldsOf], [protoEmptyDraft, protoMissing, protoJobFields]] as const) {
      const d = mk({ customer: noCar, lines: lines() });
      expect(miss(d)).toEqual(['a car']);
      expect(() => fields(d, 'book')).not.toThrow();
      expect(fields(d, 'book').vehicleId).toBe('');
      const withCar = mk({ customer: customers[0]!, lines: lines() });
      expect(miss(withCar)).toEqual([]);
      expect(fields(withCar, 'quote').vehicleId).toBe(customers[0]!.vehicles[0]!.id);
    }
    expect(vehicleIdOf(emptyDraft({ customer: noCar }))).toBe('');
  });
  it('Next is disabled with "Still needed: a car", and Add car enables it with the new car on the job', async () => {
    const { screen, within } = await import('@testing-library/react');
    await mount(<NewServiceWizardPage initialFlow={{ kind: 'new', customerId: 'c01', initialDraft: { customer: noCar, vehicleId: '', lines: lines() } } as never} />);
    const dlg = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg.textContent).toMatch(/Still needed: a car\./);
    const next = within(dlg).getByRole('button', { name: 'Next' }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    await act(async () => { fireEvent.click(within(dlg).getByRole('button', { name: /^Add car$/ })); });
    const type = async (label: RegExp, value: string) => act(async () => { fireEvent.change(within(dlg).getByLabelText(label), { target: { value } }); });
    await type(/Plate/, 'ABC 123'); await type(/Make/, 'Toyota'); await type(/Model/, 'Vios');
    await act(async () => { fireEvent.click(within(dlg).getAllByRole('button', { name: /^Add car$/ }).pop()!); });
    expect(dlg.textContent).not.toMatch(/Still needed/);
    expect((within(dlg).getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(false);
    await act(async () => { fireEvent.click(within(dlg).getByRole('button', { name: 'Next' })); });
    expect(screen.getByRole('button', { name: /Book service/ })).toBeTruthy();
  });
});

describe('New service wizard axe', () => {
  const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
  for (const [name, f] of flows) {
    it(`${name}: no axe violations`, async () => {
      await mount(<NewServiceWizardPage initialFlow={f as never} />);
      const dlg = document.body.querySelector('[role="dialog"]') as HTMLElement;
      expect((await axe.run(dlg, axeOpts)).violations).toEqual([]);
    });
  }
});
