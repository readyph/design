import { render, cleanup, act } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { composeStories } from '@storybook/react';
import axe from 'axe-core';
import * as Stories from './ServicesPage.stories';

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

const { Live } = composeStories(Stories);
const C = Live as unknown as (p: Record<string, unknown>) => JSX.Element;
const options = ((Live.argTypes as Record<string, { options?: string[] }>).scenario?.options ?? []) as string[];
const mount = async (props: Record<string, unknown>) => { await act(async () => { render(<C {...props} />); }); await act(async () => { await new Promise((r) => setTimeout(r, 50)); }); };

describe('Services page', () => {
  it('every scenario mounts without a render loop', async () => {
    expect(options.length).toBeGreaterThan(20);
    const errors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(String(a[0])); });
    for (const o of options) { await mount({ scenario: o }); cleanup(); }
    expect(errors.filter((e) => /Maximum update depth|Too many re-renders/.test(e))).toEqual([]);
  }, 120000);
  it.each([['Calendar, week (default)'], ['List'], ['Calendar, service open'], ['Wizard: new service from a calendar slot'], ['Quote: open a parked quotation'], ['Payment: collect on JO-0403 (ready, unpaid)'], ['Phone: updates list']])('no axe violations in %s', async (scenario) => {
    await mount({ scenario });
    const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'empty-table-header': { enabled: false }, 'landmark-unique': { enabled: false }, /* source: desktop and phone searches both render */ 'aria-allowed-role': { enabled: false }, 'aria-allowed-attr': { enabled: false }, 'aria-valid-attr-value': { enabled: false } } });
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([]);
  }, 30000);
});
