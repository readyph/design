import { Profiler, type ReactElement } from 'react';
import { render, cleanup, act, fireEvent } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ServicesPage } from './Services.page';
import { ManagerTodayPage } from './ManagerToday.page';
import { CustomersPage } from './Customers.page';
import { ServicesPricesPage } from './ServicesPrices.page';
import { linesFromType } from './wizardModel';

/** Regression guard: opening the wizard (any step, prefilled, from a quote) must settle. Fails on "Maximum update depth" or a render-count blow-up. */
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

async function click(name: RegExp | string, role = 'button', nth = 0) {
  const { screen } = await import('@testing-library/react');
  const el = screen.getAllByRole(role, { name })[nth]!;
  await act(async () => { fireEvent.click(el); });
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 700)); });

describe('New service wizard, opened by click', () => {
  const pages: [string, () => ReactElement][] = [['Today', () => <ManagerTodayPage />], ['Services', () => <ServicesPage initialTab="list" />], ['Customers', () => <CustomersPage />]];
  for (const [name, el] of pages) {
    it(`${name}: New service, add a catalogue service, step through`, async () => {
      const errors: string[] = [];
      vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(String(a[0])); });
      let commits = 0;
      await act(async () => { render(<Profiler id="p" onRender={() => { commits++; }}>{el()}</Profiler>); });
      await settle();
      const before = commits;
      await click(/^new service$/i);
      await settle();
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
      const { screen } = await import('@testing-library/react');
      const box = screen.getByRole('combobox', { name: 'Add a service' });
      await act(async () => { fireEvent.focus(box); fireEvent.change(box, { target: { value: 'oil' } }); });
      await click(/./, 'option', 0);
      await settle();
      expect(commits - before).toBeLessThan(200);
      vi.restoreAllMocks();
      expect(errors.filter((e) => /Maximum update depth|Too many re-renders/.test(e))).toEqual([]);
    });
  }
});

describe('Wizard revision 6', () => {
  it('step 1: subtotal under the table, no side panel, no total in the footer', async () => {
    const { screen } = await import('@testing-library/react');
    await mount(<ServicesPage initialTab="list" initialFlow={{ kind: 'new', customerId: 'c01', initialDraft: { lines: lines() } } as never} />);
    const dlg = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg.querySelector('aside')).toBeNull();
    expect(dlg.querySelector('[data-row="total"]')?.textContent).toMatch(/Subtotal/);
    expect(dlg.querySelector('footer')?.textContent ?? '').not.toMatch(/Total|₱/);
    expect(screen.getByRole('combobox', { name: 'Add a service' })).toBeTruthy();
  });
  it('step 2: Schedule and staff is visible with date, time and mechanic', async () => {
    const { screen } = await import('@testing-library/react');
    await mount(<ServicesPage initialTab="list" initialFlow={{ kind: 'new', customerId: 'c01', startStep: 2, initialDraft: { lines: lines() } } as never} />);
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
    it(`Services page: ${name}`, async () => {
      await mount(<ServicesPage initialTab="list" initialFlow={f as never} />);
      expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    });
  }
  it('Today renders', async () => { await mount(<ManagerTodayPage />); });
  it('Customers page renders', async () => { await mount(<CustomersPage />); });
  it('Settings page renders and opens a service modal', async () => { await mount(<ServicesPricesPage initialForm="new" />); });
});

describe('Wizard revision 7', () => {
  it('Add a service: list scrolls inside the dialog (wheel is not cancelled by the scroll lock), custom row pinned, Add custom service link', async () => {
    const { screen, within } = await import('@testing-library/react');
    await mount(<ServicesPage initialTab="list" initialFlow={{ kind: 'new', customerId: 'c01', initialDraft: { lines: lines() } } as never} />);
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
    await mount(<ServicesPage initialTab="list" initialFlow={{ kind: 'new', customerId: 'c01', initialDraft: { lines: lines() } } as never} />);
    const dlg = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg.querySelector('[data-group="parts"]')?.textContent).toBe('Parts');
    expect(dlg.textContent).toMatch(/Labour/);
  });
});
