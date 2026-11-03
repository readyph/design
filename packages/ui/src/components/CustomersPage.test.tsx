import { render, cleanup, act } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { CustomersPage } from './CustomersPage';
import { composeStories } from '@storybook/react';
import * as Stories from './CustomersPage.stories';

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
const mount = async (el: JSX.Element) => { await act(async () => { render(el); }); await act(async () => { await new Promise((r) => setTimeout(r, 30)); }); };
const violations = async () => (await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'landmark-unique': { enabled: false }, /* jsdom has no CSS: the desktop and phone search both render */ 'empty-table-header': { enabled: false } } })).violations.map((v) => v.id + ': ' + v.nodes.map((n) => n.html.slice(0, 120)).join(' | '));

describe('Customers page', () => {
  it('opens on the list', async () => {
    await mount(<CustomersPage />);
    expect(document.body.textContent).toMatch(/customers/i);
  });
  it.each([
    ['list', {}],
    ['search by plate', { initialQuery: 'ndh5502' }],
    ['no match', { initialQuery: 'NBC 9999' }],
    ['view: owes', { initialView: 'owes' as const }],
    ['loading', { state: 'loading' as const }],
    ['first run', { state: 'first-run' as const }],
    ['error', { state: 'error' as const }],
    ['customer page', { initialCustomer: { id: 'c01' } }],
    ['customer sheet', { initialDetail: { kind: 'edit' as const } }],
    ['wizard', { initialFlow: { kind: 'new' as const } }],
  ])('axe: %s', async (_n, props) => {
    await mount(<CustomersPage {...props} />);
    expect(await violations()).toEqual([]);
  });
  it('story exports Live', () => { expect(composeStories(Stories).Live).toBeTruthy(); });
});
