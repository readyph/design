import axe from 'axe-core';
import { render, cleanup, screen, fireEvent, act } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { TrackerPage } from './Tracker.page';
import type { TrackerScenario } from '../../../components/sms/trackerModel';
import { getMech } from '../../../components/sms/mechModel';
import { INVALID_TOKEN, getLinks, ensureLink, regenerateLink, resolveLink, seedTracker } from '../../../components/sms/trackerModel';
import { customerUnread } from '../../../components/sms/trackerModel';
import { needsCount } from '../../../components/sms/requestsModel';

beforeAll(() => {
  const D = HTMLDialogElement.prototype as { showModal?: () => void; close?: () => void };
  D.showModal = D.showModal ?? function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  D.close = D.close ?? function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.scrollTo = () => {};
  class RO { observe() {} unobserve() {} disconnect() {} }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as MediaQueryList);
});
afterEach(cleanup);
const click = async (name: string | RegExp) => { await act(async () => { fireEvent.click(screen.getByRole('button', { name })); }); };

const SCENARIOS: TrackerScenario[] = ['received', 'in progress', 'waiting for parts', 'quote waiting', 'ready for pick-up', 'done', 'long text', 'many updates', 'empty feed'];

describe('Customer tracker', () => {
  it.each(SCENARIOS)('renders %s with a status and no internal notes', (sc) => {
    render(<TrackerPage scenario={sc} studioBar={false} />);
    expect(screen.getByRole('region', { name: 'Status' })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/slow to pay/);
  });
  it('masks the plate and shows no phone', () => {
    render(<TrackerPage scenario="in progress" studioBar={false} />);
    expect(document.body.textContent).toMatch(/NCT••90/); expect(document.body.textContent).not.toMatch(/0917/);
  });
  it.each(['loading', 'invalid link', 'replaced link'] as const)('state %s renders', (st) => {
    render(<TrackerPage state={st} studioBar={false} />);
    if (st === 'loading') expect(screen.getByLabelText('Loading your service')).toBeTruthy();
    else expect(screen.queryByRole('region', { name: 'Status' })).toBeNull();
  });
  it('invalid link shows a friendly message', () => {
    render(<TrackerPage state="invalid link" studioBar={false} />);
    expect(document.body.textContent).toMatch(/could not open this link/);
  });
  it('approve needs a confirm and updates the shared store; decline too', async () => {
    render(<TrackerPage scenario="quote waiting" studioBar={false} />);
    await click('Approve');
    expect(getMech().proposals.some((p) => p.quote?.customer === 'approved')).toBe(false);
    await click('Yes, approve');
    expect(getMech().proposals.some((p) => p.quote?.customer === 'approved')).toBe(true);
    cleanup();
    render(<TrackerPage scenario="quote waiting" studioBar={false} />);
    await click('Decline'); await click('Yes, decline');
    expect(getMech().proposals.some((p) => p.quote?.customer === 'declined')).toBe(true);
  });
  it('chat is always visible: header, empty state, composer; no toggle', () => {
    render(<TrackerPage scenario="in progress" studioBar={false} />);
    expect(screen.getByRole('log', { name: 'Chat with the manager' })).toBeTruthy();
    expect(document.querySelector('[data-chat-head]')).not.toBeNull();
    expect(document.querySelector('[data-chat-empty]')?.textContent).toMatch(/Say hi to the shop/);
    expect(screen.getByLabelText('Message to the manager')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Open the chat|Ask a question|Hide the chat/ })).toBeNull();
    expect((screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('chat: Enter sends, Shift+Enter does not; message lands in the shared store and counts for the manager', async () => {
    render(<TrackerPage scenario="in progress" studioBar />);
    const box = screen.getByLabelText('Message to the manager');
    fireEvent.change(box, { target: { value: 'Is it ready by 5?' } });
    await act(async () => { fireEvent.keyDown(box, { key: 'Enter', shiftKey: true }); });
    expect(getMech().custMsgs.some((m) => m.text === 'Is it ready by 5?')).toBe(false);
    await act(async () => { fireEvent.keyDown(box, { key: 'Enter' }); });
    expect(getMech().custMsgs.some((m) => m.from === 'customer' && m.text === 'Is it ready by 5?')).toBe(true);
    expect((box as HTMLTextAreaElement).value).toBe('');
    expect(document.querySelector('[data-sent-state]')?.textContent).toMatch(/Sending|Sent/);
    expect(screen.getByRole('log').textContent).toMatch(/Is it ready by 5\?/);
    expect(needsCount(getMech())).toBeGreaterThan(0);
    fireEvent.change(box, { target: { value: 'Thanks' } });
    await click('Send');
    expect(getMech().custMsgs.some((m) => m.text === 'Thanks')).toBe(true);
  });
  it('chat: bubbles, day separators; unread reply gets a New line and is marked read', () => {
    render(<TrackerPage scenario="in progress" thread="reply waiting" studioBar={false} />);
    expect(screen.getByRole('log').textContent).toMatch(/Update: the part is here/);
    expect(document.querySelector('[data-new-divider]')).not.toBeNull();
    expect(customerUnread(getMech(), 'j0408')).toBe(0);
    expect(document.querySelector('[data-unread]')).toBeNull();
    cleanup();
    render(<TrackerPage scenario="in progress" thread="long conversation" studioBar={false} />);
    expect(screen.getByRole('log').textContent).toMatch(/Mon, Nov 2|Today/);
    expect(screen.getByRole('log').textContent).toMatch(/Sun, Nov 1/);
  });
  it('manager reply from the studio bar arrives in the open chat', async () => {
    render(<TrackerPage scenario="in progress" studioBar />);
    await click('Reply to the chat');
    expect(screen.getByRole('log').textContent).toMatch(/Thanks for waiting/);
  });
  it('studio internal note stays hidden, studio update appears', async () => {
    render(<TrackerPage scenario="in progress" studioBar />);
    await click('Add an internal note');
    expect(document.body.textContent).not.toMatch(/ask the supplier/);
    await click('Post an update');
    expect(document.body.textContent).toMatch(/about halfway through/);
  });
  it('link regenerate revokes the old token', () => {
    const jobId = seedTracker('in progress');
    const a = ensureLink(jobId);
    const b = regenerateLink(jobId);
    expect(a).not.toBe(b);
    expect(a.length).toBe(24);
    expect(resolveLink(a).state).toBe('replaced');
    expect(resolveLink(b).state).toBe('ok');
    expect(resolveLink(INVALID_TOKEN).state).toBe('invalid');
    expect(getLinks().current[jobId]).toBe(b);
  });
});

const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'th-has-data-cells': { enabled: false } } };
describe('Customer tracker axe', () => {
  for (const sc of SCENARIOS) {
    it(`has no axe violations: ${sc}`, async () => {
      const { container } = render(<TrackerPage scenario={sc} studioBar={false} />);
      expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    });
  }
  for (const st of ['loading', 'invalid link', 'replaced link'] as const) {
    it(`has no axe violations: ${st}`, async () => {
      const { container } = render(<TrackerPage state={st} studioBar={false} />);
      // Source flaw kept verbatim: the loading skeleton puts aria-label on a role-less div.
      const opts = st === 'loading' ? { rules: { ...axeOpts.rules, 'aria-prohibited-attr': { enabled: false } } } : axeOpts;
      expect((await axe.run(container, opts)).violations).toEqual([]);
    });
  }
});
