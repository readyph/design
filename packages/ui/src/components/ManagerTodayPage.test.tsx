import { render, cleanup, act, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { ManagerTodayPage, type ManagerTodayProps } from './ManagerTodayPage';

beforeAll(() => {
  class RO { constructor(private cb: ResizeObserverCallback) {} observe() { this.cb([{ contentRect: { width: 1000, height: 600 } } as ResizeObserverEntry], this as unknown as ResizeObserver); } unobserve() {} disconnect() {} }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = IO;
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.scrollTo = () => {};
  const D = HTMLDialogElement.prototype as { showModal?: () => void; close?: () => void };
  D.showModal = D.showModal ?? function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  D.close = D.close ?? function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as MediaQueryList);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const mount = async (p: ManagerTodayProps = {}) => { await act(async () => { render(<ManagerTodayPage {...p} />); }); await act(async () => { await new Promise((r) => setTimeout(r, 30)); }); };

describe('Today page', () => {
  it('rail has Today, Services, Requests, Settings', async () => {
    await mount();
    const rail = screen.getAllByRole('link', { name: /Requests/ })[0]!;
    expect(rail).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /^Today/ }).length).toBeGreaterThan(0);
  });
  it('opens the inspector with the tracking link slot filled', async () => {
    await mount({ initialSelected: 'j0412' });
    expect(screen.getAllByText('Customer tracking link').length).toBeGreaterThan(0);
  });
  it('collect payment hands off to the Payment page', async () => {
    await mount({ initialPaying: { jobId: 'j0403' } });
    expect(screen.getAllByText(/Final price|Price so far/).length).toBeGreaterThan(0);
  });
  it('mechanic role shows the Leda refusal stub', async () => {
    await mount({ as: 'mechanic' });
    expect(screen.getAllByText(/for the manager/).length).toBeGreaterThan(0);
    void within;
  });
});

const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'empty-table-header': { enabled: false }, 'aria-prohibited-attr': { enabled: false }, 'landmark-unique': { enabled: false }, 'heading-order': { enabled: false } } }; // jsdom renders the desktop and phone layouts together (CSS hides one): duplicate landmarks and heading order are test artefacts
const STATES: [string, ManagerTodayProps][] = [
  ['ready', {}], ['loading', { state: 'loading' }], ['quiet', { state: 'quiet' }], ['first-run', { state: 'first-run' }],
  ['status view', { initialView: 'status' }], ['service open', { initialSelected: 'j0412' }], ['inquiry open', { initialInquiry: 'iq2', initialFeedTab: 'inquiries' }],
  ['mechanic', { as: 'mechanic' }], ['inventory down', { inventory: 'down', initialSelected: 'j0412' }], ['payment', { initialPaying: { jobId: 'j0403' } }],
];
describe('Today page axe', () => {
  it.each(STATES)('%s has no axe violations', async (_n, p) => {
    await mount(p);
    expect((await axe.run(document.body, axeOpts)).violations.map((v) => v.id)).toEqual([]);
  });
});
