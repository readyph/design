import { render, cleanup, act } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { composeStories } from '@storybook/react';
import * as Today from './ManagerToday.stories';
import * as Payment from './Payment.stories';
import * as Services from './Services.stories';
import * as Customers from './Customers.stories';
import * as Settings from './Settings.stories';
import * as Wizard from './Wizard.stories';
import * as Mechanic from './Mechanic.stories';
import * as Requests from './Requests.stories';

/** Every starting point offered by the live stories' controls must mount and settle (no render loop, no console error). */
beforeAll(() => {
  class RO { constructor(private cb: ResizeObserverCallback) {} observe() { this.cb([{ contentRect: { width: 1000, height: 600 } } as ResizeObserverEntry], this as unknown as ResizeObserver); } unobserve() {} disconnect() {} }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = IO;
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.scrollTo = () => {};
  const D = HTMLDialogElement.prototype as { showModal?: () => void; close?: () => void; show?: () => void };
  D.showModal = D.showModal ?? function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  D.close = D.close ?? function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as MediaQueryList);
});
afterEach(cleanup);

const pages = [
  ['Today', composeStories(Today).Live, 'overlay'],
  ['Services', composeStories(Services).Live, 'scenario'],
  ['Payment', composeStories(Payment).Live, 'job'],
  ['Customers', composeStories(Customers).Live, 'scenario'],
  ['Settings', composeStories(Settings).Live, 'scenario'],
  ['Wizard', composeStories(Wizard).Live, 'prefill'],
  ['Mechanic overlay', composeStories(Mechanic).Live, 'overlay'],
  ['Mechanic state', composeStories(Mechanic).Live, 'state'],
  ['Mechanic who', composeStories(Mechanic).Live, 'mechanic'],
  ['Requests scenario', composeStories(Requests).Live, 'scenario'],
  ['Requests selected', composeStories(Requests).Live, 'selected'],
  ['Requests overlay', composeStories(Requests).Live, 'overlay'],
] as const;

describe('live stories: every control option mounts', () => {
  for (const [name, Live, key] of pages) {
    const options = ((Live.argTypes as Record<string, { options?: string[] }>)[key]?.options ?? []) as string[];
    it(`${name}: ${options.length} starting points`, async () => {
      expect(options.length).toBeGreaterThan(1);
      const errors: string[] = [];
      const spy = vi.spyOn(console, 'error').mockImplementation((...a) => { errors.push(String(a[0])); });
      for (const o of options) {
        const C = Live as unknown as (p: Record<string, unknown>) => JSX.Element;
        await act(async () => { render(<C {...{ [key]: o }} />); });
        await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
        cleanup();
      }
      spy.mockRestore();
      expect(errors.filter((e) => /Maximum update depth|Too many re-renders/.test(e))).toEqual([]);
    }, 60000);
  }
});
