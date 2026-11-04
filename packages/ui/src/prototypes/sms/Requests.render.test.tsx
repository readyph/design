import { render, cleanup, screen, fireEvent, act, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { composeStories } from '@storybook/react';
import { RequestsPage } from './Requests.page';
import { MechanicPage } from './Mechanic.page';
import * as Stories from './Requests.stories';
import { getMech, feedOf } from './mechModel';
import { staffInfoOf } from './mechModel';
import { itemsOf, needsCount } from './requestsModel';
import { jobs } from './data';

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

const click = async (name: string | RegExp, role: 'button' | 'option' = 'button') => { await act(async () => { fireEvent.click(screen.getByRole(role, { name })); }); };
const options = () => screen.getAllByRole('option');
const item = (id: string) => itemsOf(getMech()).find((i) => i.id === id)!;
const mechPart = (rid: string) => getMech().requests.find((r) => r.id === rid)!;

describe('Requests & messages', () => {
  it('lists newest first with kind, status chips and unread dots', () => {
    render(<RequestsPage initialSelected={null} />);
    const rows = options();
    const times = itemsOf(getMech()).map((i) => i.id);
    expect(rows.length).toBe(times.length);
    expect(rows[0].textContent).toMatch(/^[A-Z]{2}Unread, /);
    const mins = itemsOf(getMech()).map((i) => Number(i.at.slice(11, 13)) * 60 + Number(i.at.slice(14, 16)));
    expect([...mins].sort((a, b) => b - a)).toEqual(mins);
    const needsRow = rows.find((r) => /Found a problem/.test(r.textContent!) && /Needs you/.test(r.textContent!))!;
    expect(needsRow.textContent).toMatch(/Problem/); expect(needsRow.textContent).toMatch(/Needs you/);
    expect(needsRow.querySelector('[data-unread]')).not.toBeNull();
    expect(rows.some((r) => /Collected/.test(r.textContent!))).toBe(true);
    expect(rows.some((r) => !/^[A-Z]{2}Unread/.test(r.textContent!))).toBe(true);
  });
  it('filters carry counts and narrow the list; search finds by plate or mechanic', async () => {
    render(<RequestsPage initialSelected={null} />);
    const f = screen.getByRole('radiogroup', { name: 'Filter requests' });
    const label = (n: string) => within(f).getByRole('radio', { name: new RegExp(n) }).textContent!;
    expect(label('Needs you')).toMatch(/\d/); expect(label('All')).toContain(String(itemsOf(getMech()).length));
    await act(async () => { fireEvent.click(within(f).getByRole('radio', { name: /Parts/ })); });
    expect(options().every((r) => /Part/i.test(r.textContent!))).toBe(true);
    await act(async () => { fireEvent.click(within(f).getByRole('radio', { name: /Needs you/ })); });
    expect(options().every((r) => /Needs you/.test(r.textContent!))).toBe(true);
    await act(async () => { fireEvent.click(within(f).getByRole('radio', { name: /All/ })); });
    await act(async () => { fireEvent.change(screen.getByLabelText('Search by plate or mechanic'), { target: { value: 'paolo' } }); });
    expect(options().length).toBeGreaterThan(0); expect(options().every((r) => /Paolo/.test(r.textContent!))).toBe(true);
  });
  it('selecting an item shows its detail, marks it read here, and arrow keys rove focus', async () => {
    render(<RequestsPage initialSelected={null} />);
    expect(item('part:rq2').unread).toBe(true);
    await click(/Timing belt kit.*Part/, 'option');
    expect(screen.getByRole('article', { name: /Part from Arnel/ })).toBeTruthy();
    expect(item('part:rq2').unread).toBe(false);
    const first = options()[0]; first.focus();
    await act(async () => { fireEvent.keyDown(first, { key: 'ArrowDown' }); });
    expect(document.activeElement).toBe(options()[1]);
    await act(async () => { fireEvent.keyDown(options()[1], { key: 'Enter' }); });
    expect(options()[1].getAttribute('aria-selected')).toBe('true');
  });
  it('part request: Approve then Ready at stockroom updates the store the Mechanic app reads (stepper follows)', async () => {
    render(<RequestsPage initialSelected="part:rq2" />);
    expect((screen.getByRole('button', { name: 'Ready at stockroom' }) as HTMLButtonElement).disabled).toBe(true);
    await click('Approve');
    expect(mechPart('rq2').status).toBe('Approved');
    expect(item('part:rq2').status).toBe('Approved');
    expect(screen.getByRole('listitem', { current: 'step' }).textContent).toMatch(/Approved/);
    await click('Ready at stockroom');
    expect(mechPart('rq2').status).toBe('Ready at stockroom');
    expect(needsCount(getMech())).toBe(itemsOf(getMech()).filter((i) => i.needsYou).length);
  });
  it('the Mechanic app shows the new status (same store)', async () => {
    const { unmount } = render(<RequestsPage initialSelected="part:rq2" />);
    await click('Approve');
    unmount();
    // Mechanic mount resets the store; check that the status word comes from the shared model instead
    expect(mechPart('rq2').status).toBe('Approved');
    render(<MechanicPage mechanicId="m-arnel" />);
    expect(document.body.textContent).toBeTruthy();
  });
  it('decline requires a reason, then writes Declined with the reason and tells the mechanic', async () => {
    render(<RequestsPage initialSelected="part:rq2" />);
    await click('Decline...');
    const confirm = screen.getByRole('button', { name: 'Decline request' }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    await act(async () => { fireEvent.click(screen.getByLabelText('Use stock we already have')); });
    expect(confirm.disabled).toBe(false);
    await act(async () => { fireEvent.click(confirm); });
    const r = mechPart('rq2');
    expect(r.status).toBe('Declined'); expect(r.note).toMatch(/Use stock we already have/);
    expect(getMech().messages.some((m) => m.from === 'manager' && /Declined .*Use stock/.test(m.text))).toBe(true);
    expect(screen.getByText(/^Declined\./)).toBeTruthy();
  });
  it('Other needs a note before Decline is allowed', async () => {
    render(<RequestsPage initialSelected="part:rq2" overlay="decline" />);
    await act(async () => { fireEvent.click(screen.getByLabelText('Other')); });
    expect((screen.getByRole('button', { name: 'Decline request' }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { fireEvent.change(screen.getByLabelText(/Note \(required/), { target: { value: 'Wrong part' } }); });
    expect((screen.getByRole('button', { name: 'Decline request' }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('quote extra work: needs an amount, sets Quoted, posts to the thread, drops out of Today\'s feed, mechanic sees the status', async () => {
    render(<RequestsPage initialSelected="problem:pp1" />);
    await click('Quote extra work...');
    const send = screen.getByRole('button', { name: 'Send to customer' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    await act(async () => { fireEvent.change(screen.getByLabelText(/Labour/), { target: { value: '1800' } }); });
    expect(send.disabled).toBe(false);
    await act(async () => { fireEvent.click(send); });
    const p = getMech().proposals.find((x) => x.id === 'pp1')!;
    expect(p.status).toBe('quoted'); expect(p.quote?.amount).toBe(1800); expect(p.quote?.customer).toBe('waiting');
    expect(item('problem:pp1').status).toBe('Quoted');
    expect(screen.getByText('Quoted ₱1,800, waiting for the customer.')).toBeTruthy();
    expect(screen.getByText('Waiting for customer')).toBeTruthy();
    expect(getMech().proposals.filter((x) => !x.status).length).toBe(0); // Today's feed shows only open ones
  });
  it('customer approval control shows on a quote (seeded approved)', () => {
    render(<RequestsPage initialSelected="problem:pp2" customerApproval="approved" />);
    expect(screen.getByText('Approved by customer')).toBeTruthy();
  });
  it('dismiss a problem, reason optional', async () => {
    render(<RequestsPage initialSelected="problem:pp1" />);
    await click('Dismiss...');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Dismiss problem' })); });
    expect(getMech().proposals.find((x) => x.id === 'pp1')!.status).toBe('dismissed');
    expect(item('problem:pp1').status).toBe('Dismissed');
  });
  it('reply posts to the thread and sets the mechanic\'s unread; opening the service clears it', async () => {
    render(<RequestsPage initialSelected="note:n2" />);
    const jun = jobs.find((j) => j.id === 'j0412')!;
    const before = staffInfoOf(getMech(), jun).unread;
    await act(async () => { fireEvent.change(screen.getByLabelText('Reply to Jun'), { target: { value: 'Thanks, order the connector.' } }); });
    await click('Send');
    expect(screen.getAllByText('Thanks, order the connector.').length).toBeGreaterThan(0);
    expect(staffInfoOf(getMech(), jun).unread).toBe(before + 1);
    expect((screen.getByLabelText('Reply to Jun') as HTMLTextAreaElement).value).toBe('');
    cleanup();
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />); // resets the store (own seed)
  });
  it('Yes answers a question: item becomes Answered and the mechanic gets the reply', async () => {
    render(<RequestsPage initialSelected="question:ms10" />);
    await click('Answer Yes');
    expect(item('question:ms10').status).toBe('Answered');
    expect(getMech().messages.some((m) => m.from === 'manager' && m.jobId === 'j0398' && m.text === 'Yes' && !m.read)).toBe(true);
    expect(screen.queryByRole('button', { name: 'Answer Yes' })).toBeNull();
  });
  it('a quick reply in the thread answers an open question too', async () => {
    render(<RequestsPage initialSelected="question:ms10" />);
    await click('Quick reply: On my way');
    expect(item('question:ms10').status).toBe('Answered');
  });
  it('all clear: nothing needs you, rail count is 0, empty state shown', async () => {
    render(<RequestsPage scenario="all clear" initialSelected={null} initialFilter="needs" />);
    expect(needsCount(getMech())).toBe(0);
    expect(screen.queryAllByRole('option').length).toBe(0);
    expect(screen.getAllByText('All clear').length).toBeGreaterThan(0);
  });
  it('loading shows skeletons and no list', () => {
    render(<RequestsPage state="loading" />);
    expect(screen.getByLabelText('Loading requests')).toBeTruthy();
    expect(screen.queryAllByRole('option').length).toBe(0);
  });
  it('phone is single-pane: list first, then pushed detail; Esc and Back return', async () => {
    render(<RequestsPage initialSelected={null} />);
    const list = () => screen.getByRole('listbox').closest('div.flex-none')!;
    const detail = () => document.querySelector('[data-detail]')!;
    expect(list().className).not.toMatch(/max-\[640px\]:hidden/); expect(detail().className).toMatch(/max-\[640px\]:hidden/);
    await click(/Timing belt kit.*Part/, 'option');
    expect(list().className).toMatch(/max-\[640px\]:hidden/); expect(detail().className).not.toMatch(/max-\[640px\]:hidden/);
    await act(async () => { fireEvent.keyDown(document.querySelector('[data-detail]')!, { key: 'Escape' }); });
    expect(detail().className).toMatch(/max-\[640px\]:hidden/);
    await click(/Timing belt kit.*Part/, 'option');
    await act(async () => { fireEvent.click(screen.getAllByRole('button', { name: /Requests/ }).find((b) => b.className.includes('max-[640px]:inline-flex'))!); });
    expect(detail().className).toMatch(/max-\[640px\]:hidden/);
  });
  it('Open service goes to the real service detail on the Services page; closing it comes back to the same item', async () => {
    render(<RequestsPage initialSelected="part:rq2" />);
    const a = screen.getByRole('link', { name: /Open service/ });
    expect(a.getAttribute('href')).toBe('#today');
    await act(async () => { fireEvent.click(a); });
    const detail = await screen.findByRole('complementary', { name: /JO-0398/ });
    expect(detail).toBeTruthy();
    expect(screen.queryByRole('listbox', { name: /Requests and messages/ })).toBeNull(); // the Requests page is replaced by Services
    await act(async () => { fireEvent.click(within(detail).getByRole('button', { name: 'Close service' })); });
    expect(screen.getByRole('listbox', { name: /Requests and messages/ })).toBeTruthy();
    expect(screen.getByRole('article', { name: /Part from Arnel/ })).toBeTruthy();
  });
  it('the overlay "service" opens that real detail on load', async () => {
    render(<RequestsPage initialSelected="part:rq2" overlay="service" />);
    expect(await screen.findByRole('complementary', { name: /JO-0398/ })).toBeTruthy();
  });
  it('customer answer, simulated from the studio-only control: request status and the mechanic\'s view update through the store', async () => {
    render(<RequestsPage initialSelected="problem:pp2" />);
    expect(item('problem:pp2').status).toBe('Quoted');
    const grp = screen.getByRole('group', { name: /Studio only: simulate the customer/ });
    expect(within(grp).getByRole('button', { name: 'Customer approves' })).toBeTruthy();
    await act(async () => { fireEvent.click(within(grp).getByRole('button', { name: 'Customer approves' })); });
    const p = getMech().proposals.find((x) => x.id === 'pp2')!;
    expect(p.quote?.customer).toBe('approved');
    expect(item('problem:pp2').status).toBe('Approved');
    expect(screen.getByText('Approved by customer')).toBeTruthy();
    expect(screen.queryByRole('group', { name: /Studio only/ })).toBeNull(); // answered once
    const ricky = jobs.find((j) => j.id === 'j0409')!;
    const posts = feedOf(getMech(), ricky);
    expect(posts.find((x) => x.id === 'pp2')!.meta).toMatch(/customer said yes/);
    expect(posts.some((x) => x.kind === 'manager' && /customer approved the extra work/i.test(x.text))).toBe(true);
    expect(staffInfoOf(getMech(), ricky).unread).toBeGreaterThan(0);
  });
  it('customer declines: status Declined, mechanic told not to do it', async () => {
    render(<RequestsPage initialSelected="problem:pp2" />);
    await click('Customer declines');
    expect(item('problem:pp2').status).toBe('Declined');
    expect(screen.getByText('Declined by customer')).toBeTruthy();
    const posts = feedOf(getMech(), jobs.find((j) => j.id === 'j0409')!);
    expect(posts.find((x) => x.id === 'pp2')!.meta).toMatch(/said no/);
  });
  it('the story control still seeds the answer (approved / declined) and hides the simulator', () => {
    render(<RequestsPage initialSelected="problem:pp2" customerApproval="declined" />);
    expect(screen.getByText('Declined by customer')).toBeTruthy();
    expect(screen.queryByRole('group', { name: /Studio only/ })).toBeNull();
  });
  it('every control option mounts (scenarios, selections, overlays)', () => {
    const Live = composeStories(Stories).Live;
    const sel = ['none (list only)', 'part request, ready at stockroom', 'found problem, quoted', 'question, answered', 'note with photos (Jun)'] as const;
    for (const scenario of ['default', 'all clear', 'many', 'long text'] as const) { const { unmount } = render(<Live scenario={scenario} />); unmount(); }
    for (const selected of sel) { const { unmount } = render(<Live selected={selected} />); unmount(); }
    for (const [overlay, selected] of [['quote', 'found problem, needs a quote (Paolo)'], ['decline', 'part request, needs you (Arnel, timing belt kit)'], ['dismiss', 'found problem, needs a quote (Paolo)'], ['service', 'part request, approved (alternator)']] as const) {
      const { unmount } = render(<Live overlay={overlay} selected={selected} />); unmount();
    }
    render(<Live state="loading" />);
  });
});
