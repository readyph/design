import axe from 'axe-core';
import { render, cleanup, screen, fireEvent, act, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MechanicPage } from './Mechanic.page';
import { getMech } from '../../../components/sms/mechModel';

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

const open = async (name: string | RegExp) => { await act(async () => { fireEvent.click(screen.getByRole('button', { name })); }); };

describe('Mechanic app', () => {
  it('shows no pesos, and "Mark done" sends the service to For pick-up in the shared store', async () => {
    render(<MechanicPage mechanicId="m-jun" />);
    expect(document.body.textContent).not.toMatch(/₱/);
    await open(/currently working on/);
    expect(document.body.textContent).not.toMatch(/₱/);
    await open('Mark done');
    await open('Yes, mark done');
    expect(Object.values(getMech().ov).some((o) => o.status === 'FOR_PICKUP')).toBe(true);
  });
  it('service detail sections are separated by a 40px gap (gap-10), captions stay tight (mb-2)', () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const wrap = document.querySelector('[data-detail-sections]') as HTMLElement;
    expect(wrap.className).toMatch(/\bgap-10\b/);
    expect(wrap.className).toMatch(/flex-col/);
    for (const name of ['Customer', 'Service', 'Service items', 'Updates', 'Actions']) expect(wrap.querySelector(`:scope > section[aria-label="${name}"]`)).not.toBeNull();
    expect(wrap.querySelector('section h2')!.className).toMatch(/\bmb-2\b/);
  });
  const itemRows = () => screen.getAllByRole('checkbox').filter((r) => !/have it$/.test(r.getAttribute('aria-label') ?? ''));
  const partRows = () => screen.getAllByRole('checkbox').filter((r) => /have it$/.test(r.getAttribute('aria-label') ?? ''));
  it('service items are flat right-panel rows (NotifyItem: rounded, inset, no border or fill) and tapping a row toggles done', async () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const rows = itemRows();
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) { expect(r.className).toMatch(/rounded-control/); expect(r.className).toMatch(/py-2/); expect(r.className).not.toMatch(/\bborder\b|bg-surface/); expect(r.className).toMatch(/hover:bg-raised/); }
    expect(document.getElementById('mech-main')!.className).toMatch(/bg-surface/); expect(document.getElementById('mech-main')!.className).not.toMatch(/bg-raised/);
    for (const r of rows) { const mark = r.querySelector('span[aria-hidden]') as HTMLElement; expect(mark.className).toMatch(/size-\[18px\]/); }
    const row = rows.find((r) => r.getAttribute('aria-checked') === 'false')!;
    const name = row.getAttribute('aria-label')!;
    await act(async () => { fireEvent.click(row); });
    expect(screen.getByRole('checkbox', { name }).getAttribute('aria-checked')).toBe('true');
    expect(Object.values(getMech().ov).some((o) => o.services?.some((x) => x.name === name && x.done))).toBe(true);
    await act(async () => { fireEvent.click(screen.getByRole('checkbox', { name })); });
    expect(screen.getByRole('checkbox', { name }).getAttribute('aria-checked')).toBe('false');
  });
  it('revision 17: ticking or unticking a service item never changes the row order; parts order is unchanged', async () => {
    render(<MechanicPage mechanicId="m-arnel" overlay="service detail open" />);
    const names = () => itemRows().map((r) => r.getAttribute('aria-label'));
    const partNames = () => Array.from(document.querySelectorAll('table tbody tr')).map((r) => r.textContent);
    const before = names(); const partsBefore = partNames();
    expect(before.length).toBeGreaterThan(1);
    const first = itemRows()[0];
    await act(async () => { fireEvent.click(first); });
    expect(names()).toEqual(before); expect(partNames()).toEqual(partsBefore);
    await act(async () => { fireEvent.click(itemRows()[0]); });
    expect(names()).toEqual(before); expect(partNames()).toEqual(partsBefore);
  });
  it('service screen order: header, Customer (no phone, no call), Ask the manager right below it, then Service, items, Parts, Updates, actions last', () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    expect(screen.queryByRole('link', { name: /^Call / })).toBeNull();
    expect(document.body.textContent).not.toMatch(/\+?63\s?9\d{2}|09\d{9}|\bCall\b/);
    expect(screen.getByText('Plate')).toBeTruthy();
    expect(screen.getByText('Customer asked for')).toBeTruthy();
    const main = document.getElementById('mech-main')!;
    expect(within(main).getAllByRole('button')[0].textContent).toBe('Ask the manager');
    const names = ['Customer', 'Service', 'Service items', 'Parts for this service', 'Updates', 'Actions'];
    const pos = (n: string) => main.innerHTML.indexOf(`aria-label="${n}"`);
    const order = names.map(pos);
    expect(order.every((x) => x >= 0)).toBe(true);
    expect([...order].sort((x, y) => x - y)).toEqual(order);
    const ask = within(main).getByRole('button', { name: 'Ask the manager' });
    expect(main.innerHTML.indexOf('aria-label="Customer"')).toBeLessThan(main.innerHTML.indexOf('>Ask the manager<'));
    expect(main.innerHTML.indexOf('>Ask the manager<')).toBeLessThan(main.innerHTML.indexOf('aria-label="Service"'));
    expect(ask).toBeTruthy();
  });
  it('actions are the last block, in normal flow (nothing fixed, sticky or pinned)', () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const main = document.getElementById('mech-main')!;
    const actions = within(main).getByRole('region', { name: 'Actions' });
    expect([...main.querySelectorAll('[data-detail-sections] > section')].pop()).toBe(actions);
    expect(within(actions).getByRole('button', { name: 'Mark done' })).toBeTruthy();
    expect(within(actions).getByRole('button', { name: 'Pause' })).toBeTruthy();
    expect(document.body.innerHTML).not.toMatch(/\b(fixed|sticky)\b/);
  });
  it('revision 12/13: the same CalCard heads the detail, blocks in order, no bottom nav, normal bottom padding', async () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    expect(screen.queryByRole('navigation', { name: 'Mechanic' })).toBeNull();
    const main = document.getElementById('mech-main')!;
    expect(main.className).toMatch(/\bpb-6\b/); expect(main.className).not.toMatch(/pb-28/);
    const card = main.querySelector('[data-static-card]') as HTMLElement;
    expect(card).toBeTruthy();
    expect(main.querySelector('[data-detail-sections]')!.firstElementChild).toBe(card);
    expect(card.tagName).toBe('DIV'); expect(card.className).not.toMatch(/absolute/);
    expect(within(card).queryByRole('button')).toBeNull();
    for (const sel of ['[data-jo]', '[data-plate]', '[data-staff-status]', '[data-current]']) expect(card.querySelector(sel)).toBeTruthy();
    expect(card.querySelector('[data-staff-status]')!.className).toMatch(/text-\[14px\]/);
    const html = main.innerHTML;
    const at = ['data-static-card', 'aria-label="Customer"', '>Ask the manager<', 'aria-label="Service"', 'aria-label="Service items"', 'aria-label="Parts for this service"', 'aria-label="Updates"', 'aria-label="Actions"'].map((k) => html.indexOf(k));
    expect(at.every((x) => x >= 0)).toBe(true); expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(document.querySelector('[data-back-bar]')).toBeNull();
  });
  it('revision 13: no bottom nav on any screen (no nav landmark, tablist, pill)', async () => {
    const { unmount } = render(<MechanicPage mechanicId="m-jun" />);
    const noNav = () => {
      expect(screen.queryByRole('navigation', { name: 'Mechanic' })).toBeNull(); expect(screen.queryByRole('tablist')).toBeNull();
      expect(document.body.innerHTML).not.toMatch(/bottom-\[calc\(12px/);
      expect(document.querySelectorAll('nav').length).toBe(1);
    };
    noNav();
    await open('Profile'); noNav();
    unmount();
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />); noNav();
    await open('Request more parts'); noNav();
  });
  it('revision 13: header has the business logo left and the user avatar button (Profile) right; no Ready mark', async () => {
    render(<MechanicPage mechanicId="m-jun" />);
    const header = document.querySelector('header')!;
    expect(within(header).queryByRole('img', { name: 'Ready' })).toBeNull();
    expect(header.textContent).not.toMatch(/\bReady(PH)?\b/);
    const biz = within(header).getByRole('img', { name: 'Dela Cruz Auto Works' });
    const prof = within(header).getByRole('button', { name: 'Profile' });
    expect(biz.compareDocumentPosition(prof) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(prof).getByRole('img', { name: 'Jun Bautista' })).toBeTruthy();
    expect(prof.textContent).toMatch(/JB|J/);
    expect(prof.className).toMatch(/focus-visible:outline/); expect(prof.className).toMatch(/hover:ring/); expect(prof.className).toMatch(/\bsize-10\b/);
    await act(async () => { fireEvent.click(prof); });
    expect(screen.getByRole('region', { name: 'Tell me' }) ?? screen.getByText('Tell me')).toBeTruthy();
    expect(prof.getAttribute('aria-current')).toBe('page');
    const trail = within(document.querySelector('[data-crumbs]') as HTMLElement);
    expect(trail.getAllByRole('listitem').map((l) => l.textContent)).toEqual(['Services', 'Profile']);
  });
  const crumbBar = () => document.querySelector('[data-crumbs]') as HTMLElement;
  const trailOf = () => within(crumbBar()).getAllByRole('listitem').map((l) => l.textContent);
  it('revision 13: breadcrumbs are fixed outside the scroller on every screen, with the right trail', async () => {
    const { unmount } = render(<MechanicPage mechanicId="m-jun" />);
    const main = () => document.getElementById('mech-main')!;
    const check = (trail: string[]) => {
      const bar = crumbBar(); expect(bar).toBeTruthy();
      expect(main().contains(bar)).toBe(false);
      expect(bar.previousElementSibling).toBe(document.querySelector('header')); expect(bar.nextElementSibling).toBe(main());
      expect(bar.className).toMatch(/\bbg-surface\b/); expect(bar.className).toMatch(/border-b/); expect(bar.className).toMatch(/\bh-10\b/); expect(bar.className).toMatch(/text-\[13px\]/); expect(bar.className).toMatch(/overflow-hidden/);
      expect(trailOf()).toEqual(trail);
    };
    check(['Services']);
    expect(document.querySelector('[data-crumb-back]')).toBeNull();
    expect(within(crumbBar()).getByText('Services').getAttribute('aria-current')).toBe('page');
    expect(within(crumbBar()).queryByRole('button')).toBeNull();
    unmount();
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const tail = trailOf()[1]; expect(trailOf()[0]).toBe('Services'); expect(tail).toMatch(/^JO-\d{4} \S+/);
    check(['Services', tail]);
    expect(within(crumbBar()).getByText(tail).getAttribute('aria-current')).toBe('page');
    await open('Request more parts');
    check(['Services', tail, 'Request a part']);
    await open('Back to ' + tail);
    check(['Services', tail]);
  });
  it('revision 13: request trail without a service, and request sent keeps the trail', async () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const tail = trailOf()[1];
    await open('Request more parts');
    await act(async () => { fireEvent.change(screen.getByRole('combobox'), { target: { value: 'oil' } }); });
    await act(async () => { fireEvent.click(screen.getAllByRole('option')[0]); });
    await open('Send to manager');
    expect(trailOf()).toEqual(['Services', tail, 'Request a part']);
    await act(async () => { fireEvent.click(within(crumbBar()).getByRole('button', { name: tail })); });
    expect(screen.getByRole('region', { name: 'Parts for this service' })).toBeTruthy();
    expect(trailOf()).toEqual(['Services', tail]);
  });
  it('revision 13: back chevron is a ghost icon button (no fill, no border, no hover fill), 40px tap, goes up one level; crumbs navigate', async () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const back = document.querySelector('[data-crumb-back]') as HTMLElement;
    expect(back.getAttribute('aria-label')).toBe('Back to Services');
    expect(back.className).toMatch(/\bbg-transparent\b/); expect(back.className).not.toMatch(/(^|\s)(hover:|focus:|active:)?bg-(?!transparent)/); expect(back.className).not.toMatch(/hover:bg-/);
    expect(back.className).toMatch(/\bborder-0\b/); expect(back.className).toMatch(/\bsize-10\b/); expect(back.className).toMatch(/hover:text-text/); expect(back.className).toMatch(/focus-visible:outline/);
    expect(back.querySelector('svg')).toBeTruthy();
    for (const b of within(crumbBar()).getAllByRole('button')) { expect(b.className).toMatch(/\bbg-transparent\b/); expect(b.className).not.toMatch(/hover:bg-/); }
    await act(async () => { fireEvent.click(back); });
    expect(document.querySelector('[data-day-header]')).toBeTruthy();
    expect(trailOf()).toEqual(['Services']);
    // from detail, the Services crumb goes up too
    await act(async () => { fireEvent.click(document.querySelector('[data-step] button')!); });
    expect(trailOf()[1]).toMatch(/^JO-/);
    await act(async () => { fireEvent.click(within(crumbBar()).getByRole('button', { name: 'Services' })); });
    expect(document.querySelector('[data-day-header]')).toBeTruthy();
  });
  it('revision 13: a long last crumb truncates (one line, never wraps) and keeps its full text in the title', () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" stress />);
    const cur = crumbBar().querySelector('[aria-current="page"]') as HTMLElement;
    expect(cur.className).toMatch(/\btruncate\b/); expect(cur.getAttribute('title')).toBe(cur.textContent);
    const ol = crumbBar().querySelector('ol')!; expect(ol.className).toMatch(/whitespace-nowrap/); expect(ol.className).toMatch(/flex-nowrap/); expect(ol.className).toMatch(/overflow-hidden/);
    expect(cur.parentElement!.className).toMatch(/min-w-0/);
  });
  it('parts are a checklist table: Part | Qty | Stock | Have it, 16px checkboxes', () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" scenario="all blocked" />);
    const table = within(screen.getByRole('region', { name: 'Parts for this service' })).getByRole('table');
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Part', 'Qty', 'Stock', 'Have it']);
    const boxes = within(table).getAllByRole('checkbox');
    expect(boxes.length).toBeGreaterThan(0);
    for (const b of boxes) expect(b.className).toMatch(/\bh-4 w-4\b/);
  });
  it('parts checklist: have-it checkboxes change the "x of y parts ready" count; Request more parts opens Need a part for this service', async () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" scenario="all blocked" />);
    const count = () => screen.getByText(/\d+ of \d+ parts ready/).textContent!;
    const [r0, total] = count().match(/(\d+) of (\d+)/)!.slice(1).map(Number);
    expect(total).toBeGreaterThan(0);
    const row = partRows().find((r) => !(r as HTMLInputElement).checked && !(r as HTMLInputElement).disabled)!;
    await act(async () => { fireEvent.click(row); });
    expect(Number(count().match(/^(\d+)/)![1])).toBe(r0 + 1);
    await act(async () => { fireEvent.click(row); });
    expect(Number(count().match(/^(\d+)/)![1])).toBe(r0);
    await open('Request more parts');
    expect(screen.getByRole('heading', { level: 1, name: 'Need a part' })).toBeTruthy();
    expect(screen.getByRole('radiogroup', { name: 'Usually needed for this service' })).toBeTruthy();
  });
  it('no "Need help" section; actions sit in the feed composer and the parts section', () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    expect(document.body.textContent).not.toMatch(/Need help/i);
    expect(screen.queryByRole('heading', { name: /help/i })).toBeNull();
    const feed = screen.getByRole('region', { name: 'Updates' });
    expect(within(feed).getByRole('button', { name: 'Photo' })).toBeTruthy();
    expect(within(feed).getByRole('switch', { name: 'Found a problem' })).toBeTruthy();
    expect(within(screen.getByRole('region', { name: 'Parts for this service' })).getByRole('button', { name: 'Request more parts' })).toBeTruthy();
  });
  it('composer is one unit: textarea, ghost actions (no outlined buttons), Post disabled until text or photo, photo chip removable, Found a problem is a switch that flags the composer', async () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const feed = screen.getByRole('region', { name: 'Updates' });
    const box = feed.querySelectorAll('[data-composer]');
    expect(box.length).toBe(1);
    const ta = within(feed).getByLabelText('Add a note or photo');
    expect(ta.tagName).toBe('TEXTAREA');
    expect(box[0].contains(ta)).toBe(true);
    const photoBtn = within(feed).getByRole('button', { name: 'Photo' });
    expect(box[0].contains(photoBtn)).toBe(true);
    expect(photoBtn.className).not.toMatch(/\bborder\b/);
    const sw = within(feed).getByRole('switch', { name: 'Found a problem' });
    expect(box[0].contains(sw)).toBe(true);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    const post = () => within(feed).getByRole('button', { name: 'Post' }) as HTMLButtonElement;
    expect(post().disabled).toBe(true);
    await act(async () => { fireEvent.change(ta, { target: { value: 'x' } }); });
    expect(post().disabled).toBe(false);
    await act(async () => { fireEvent.change(ta, { target: { value: '' } }); });
    expect(post().disabled).toBe(true);
    await open('Photo');
    expect(within(feed).getByRole('img', { name: 'Photo ready' })).toBeTruthy();
    expect(post().disabled).toBe(false);
    await open('Remove photo');
    expect(within(feed).queryByRole('img', { name: 'Photo ready' })).toBeNull();
    expect(post().disabled).toBe(true);
    await act(async () => { fireEvent.click(screen.getByRole('switch', { name: 'Found a problem' })); });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(box[0].textContent).toContain('This will be sent to your manager as a problem.');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByLabelText('What did you see?')).toBeNull();
    expect(post().disabled).toBe(true);
  });
  it('feed: newest first; a new note and a found problem appear on top; a part request appears and reaches the store', async () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const feed = () => screen.getByRole('region', { name: 'Updates' });
    expect(within(feed()).getAllByRole('listitem').length).toBeGreaterThan(0);
    await act(async () => { fireEvent.change(screen.getByLabelText('Add a note or photo'), { target: { value: 'Old belt was cracked' } }); });
    await open('Post');
    expect(within(feed()).getAllByRole('listitem')[0].textContent).toContain('Old belt was cracked');
    await act(async () => { fireEvent.click(screen.getByRole('switch', { name: 'Found a problem' })); });
    await act(async () => { fireEvent.change(screen.getByLabelText('Add a note or photo'), { target: { value: 'Rear pads almost gone' } }); });
    await open('Post');
    const top = within(feed()).getAllByRole('listitem')[0];
    expect(top.textContent).toContain('Rear pads almost gone');
    expect(top.textContent).toContain('Found a problem');
    expect(getMech().proposals[0].text).toBe('Rear pads almost gone');
    expect(screen.getByRole('switch', { name: 'Found a problem' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('plain words: the word "job" never shows on home, the service screen or the request screen', async () => {
    const { unmount } = render(<MechanicPage mechanicId="m-jun" />);
    expect(document.body.textContent).not.toMatch(/\bjobs?\b|job order/i);
    unmount();
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    expect(document.body.textContent).not.toMatch(/\bjobs?\b|job order/i);
    await open('Request more parts');
    expect(document.body.textContent).not.toMatch(/\bjobs?\b|job order/i);
  });
  it('home is a vertical day schedule (revision 9): axis, now line, Today cards in time order without overlap, states, tap opens the service', async () => {
    render(<MechanicPage mechanicId="m-jun" />);
    const list = screen.getByRole('list', { name: 'Services today, in order' });
    const lis = [...list.querySelectorAll('[data-step]')];
    const steps = lis.map((li) => li.getAttribute('data-step'));
    expect(steps.filter((x) => x === 'now')).toHaveLength(1);
    for (const k of ['done', 'next', 'waiting']) expect(steps).toContain(k);
    // axis labels and the now line with its 10:20 pill
    const axis = [...document.querySelectorAll('[data-axis]')].map((x) => x.textContent);
    expect(axis).toContain('8:00'); expect(axis).toContain('12:00'); expect(document.body.textContent).toContain('7:30');
    expect(document.querySelectorAll('[data-now-line]')).toHaveLength(1);
    expect(document.querySelector('[data-now-pill]')!.textContent).toBe('10:20');
    // day header: MON 2, count, Now button
    expect(screen.getByText('Mon')).toBeTruthy(); expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText(`${lis.length} services`)).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Now' })); });
    // cards sit in one column in time order and never overlap
    const rects = lis.map((li) => ({ top: Number(li.getAttribute('data-top')), h: Number(li.getAttribute('data-height')) }));
    for (let i = 1; i < rects.length; i++) expect(rects[i].top).toBeGreaterThanOrEqual(rects[i - 1].top + rects[i - 1].h);
    for (const r of rects) expect(r.h).toBeGreaterThanOrEqual(124);
    // the shared Floor card (CalCard): mono JO number + plate, status dot + word, states
    const cards = lis.map((li) => li.querySelector('button')!);
    for (const c of cards) { expect(c.className).toMatch(/rounded-control border/); expect(c.querySelector('span.font-mono')!.textContent).toMatch(/^JO-/); expect(c.querySelector('span[aria-hidden].rounded-full')).toBeTruthy(); }
    const byStep = (k: string) => lis.filter((li) => li.getAttribute('data-step') === k).map((li) => li.querySelector('button')!);
    expect(byStep('now')[0].textContent).toContain('Working'); expect(byStep('now')[0].className).toMatch(/border-accent/); expect(byStep('now')[0].className).toMatch(/bg-accent-tint/);
    expect(byStep('done')[0].textContent).toContain('Done'); expect(byStep('done')[0].className).toMatch(/opacity-70/);
    expect(byStep('next')[0].textContent).toContain('Not started');
    expect(byStep('waiting')[0].className).toMatch(/bg-warn-bg/); expect(byStep('waiting')[0].textContent).toMatch(/Waiting for parts/);
    // mechanic view: no money, no mechanic avatar
    expect(document.body.textContent).not.toMatch(/₱|unpaid/);
    expect(cards.some((c) => c.querySelector('[class*="size-6"]') && c.querySelector('img'))).toBe(false);
    expect(['Pending', 'checklist', 'overlay'].filter((w) => document.body.textContent!.includes(w))).toEqual([]);
    // tap a card opens the service
    await act(async () => { fireEvent.click(byStep('next')[0]); });
    expect(screen.getByRole('region', { name: 'Service items' })).toBeTruthy();
  });
  it('home scenarios: no services keeps the empty state; many services and all waiting still stack without overlap', () => {
    const r1 = render(<MechanicPage mechanicId="m-jun" scenario="no services" />);
    expect(screen.getByText('No cars for you yet')).toBeTruthy(); expect(document.querySelector('[data-step]')).toBeNull();
    r1.unmount();
    const r2 = render(<MechanicPage mechanicId="m-jun" stress />);
    const rs = [...document.querySelectorAll('[data-step]')].map((li) => ({ top: Number(li.getAttribute('data-top')), h: Number(li.getAttribute('data-height')) }));
    expect(rs.length).toBeGreaterThan(8);
    for (let i = 1; i < rs.length; i++) expect(rs[i].top).toBeGreaterThanOrEqual(rs[i - 1].top + rs[i - 1].h);
    r2.unmount();
    render(<MechanicPage mechanicId="m-jun" scenario="all blocked" />);
    expect(screen.getByText('All your cars are waiting for parts.')).toBeTruthy();
  });
  it('Today look (revision 8): plain surface page, no bordered boxes or count pills, Today rows and tokens only', async () => {
    const check = (root: HTMLElement) => {
      const html = root.innerHTML;
      expect(html).not.toMatch(/bg-raised(?![-\w])[^"]*px-3 pt-3/); // no grey page
      expect(html).not.toMatch(/rounded-card[^"]*border|border[^"]*rounded-card/); // no MechCard / bordered section boxes
      expect(html).not.toMatch(/bg-raised-2 px-1\.5/); // no count pills
      expect(html).not.toMatch(/#[0-9a-fA-F]{3,6}\b|rgb\(|\[\d+px\]\s*shadow/); // no hand-written colours
    };
    const home = render(<MechanicPage mechanicId="m-jun" />);
    const main = document.getElementById('mech-main')!;
    expect(main.className).toMatch(/\bbg-surface\b/); expect(main.className).toMatch(/\bpx-0\b/); expect(document.querySelector("[data-day-header]")!.className).toMatch(/\bpx-4\b/);
    check(main);
    // The Floor view's cards carry every car; section captions are Today's Status-view captions.
    const rows = within(main).getAllByRole('button').filter((b) => /rounded-control border/.test(b.className) && b.querySelector('span.font-mono'));
    expect(rows.length).toBeGreaterThanOrEqual(4);
    for (const h of main.querySelectorAll('h2')) { expect(h.className).toMatch(/border-b border-control/); expect(h.className).toMatch(/text-\[13px\] font-semibold/); }
    home.unmount();
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const detail = document.getElementById('mech-main')!;
    check(detail);
    expect(within(detail).getByRole('region', { name: 'Updates' }).querySelectorAll('ul > li > div[class*="rounded-control"][class*="py-3"]').length).toBeGreaterThan(0);
    for (const h of detail.querySelectorAll('h2')) expect(h.className).toMatch(/border-b border-control/);
  });
  it('a part request lands in the store as Requested and shows the Sent state', async () => {
    render(<MechanicPage mechanicId="m-ricky" overlay="request part open" />);
    await act(async () => { fireEvent.change(screen.getByRole('combobox'), { target: { value: 'oil' } }); });
    await act(async () => { fireEvent.click(screen.getAllByRole('option')[0]); });
    await open('Send to manager');
    expect(getMech().requests[0].status).toBe('Requested');
    expect(getMech().requests[0].by).toBe('m-ricky');
    expect(screen.getByText('Your manager will say when it is ready.')).toBeTruthy();
  });
});

describe('Mechanic home, revision 10 (staff cards)', () => {
  it('header has no greeting; home has no Continue / Start section and no global Need a part / My requests', () => {
    render(<MechanicPage mechanicId="m-jun" />);
    expect(document.body.textContent).not.toMatch(/Hi,? Jun/);
    const header = document.querySelector('header')!;
    expect(header.querySelector('h1')!.className).toMatch(/sr-only/);
    expect(within(header).getByRole('img', { name: 'Dela Cruz Auto Works' })).toBeTruthy(); expect(within(header).queryByRole('img', { name: 'Ready' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^(Continue|Start)\b/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Need a part/ })).toBeNull();
    expect(screen.queryByText(/My requests/)).toBeNull();
    const main = document.getElementById('mech-main')!;
    expect(main.firstElementChild!.getAttribute('aria-label')).toBe('Today');
    expect(screen.getByText('Mon')).toBeTruthy();
  });
  it('"Currently working on" appears exactly once, on the Working card', () => {
    render(<MechanicPage mechanicId="m-jun" />);
    expect(screen.getAllByText('Currently working on')).toHaveLength(1);
    const li = document.querySelector('[data-step="now"]')!;
    expect(li.textContent).toContain('Currently working on'); expect(li.querySelector('[data-current] .animate-pulse')).toBeTruthy();
    expect(li.querySelector('button')!.className).toMatch(/border-accent/);
  });
  it('status is one step bigger (14px semibold); stats are icon + short form on the same row, full words in title and name', () => {
    render(<MechanicPage mechanicId="m-jun" />);
    const li = document.querySelector('[data-step="now"]')!;
    const st = li.querySelector('[data-staff-status]')!;
    expect(st.className).toMatch(/text-\[14px\]/); expect(st.className).toMatch(/font-semibold/); expect(st.textContent).toBe('Working');
    const stats = [...li.querySelectorAll('[data-staff-stat]')];
    expect(stats.length).toBeGreaterThan(0);
    expect(st.parentElement).toBe(stats[0].parentElement!.parentElement);
    for (const x of stats) { expect(x.textContent).toMatch(/^\d+\/\d+$/); expect(x.className).toMatch(/whitespace-nowrap/); expect(x.getAttribute('title')).toBe(x.getAttribute('aria-label')); expect(x.querySelector('svg')).toBeTruthy(); }
    const items = stats.find((x) => /items done/.test(x.getAttribute('aria-label')!))!;
    expect(items.getAttribute('aria-label')).toMatch(/^\d+ of \d+ items done$/);
    const full = items.getAttribute('aria-label')!; const parts = stats.find((x) => /parts ready/.test(x.getAttribute('aria-label')!))?.getAttribute('aria-label');
    cleanup();
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    expect(screen.getByText(`${full.match(/^\d+ of \d+/)![0]} done`)).toBeTruthy();
    if (parts) expect(screen.getByText(parts)).toBeTruthy();
  });
  it('row 1 puts number + plate left and the working pill right on one row; they truncate, the pill never wraps', () => {
    render(<MechanicPage mechanicId="m-jun" />);
    const card = document.querySelector('[data-step="now"] button')!;
    const jo = card.querySelector('[data-jo]')!; const plate = card.querySelector('[data-plate]')!; const pill = card.querySelector('[data-current]')!;
    const row = jo.parentElement!.parentElement!;
    expect(row.contains(pill)).toBe(true); expect(row.className).toMatch(/items-center/);
    expect(jo.className).toMatch(/truncate/); expect(plate.className).toMatch(/truncate/);
    expect(pill.className).toMatch(/whitespace-nowrap/); expect(pill.className).toMatch(/flex-none/);
    expect(pill.parentElement!.className).toMatch(/flex-none/);
    expect(pill.querySelector('[aria-hidden]:not(.animate-pulse)')!.textContent).toBe('Working now');
  });
  it('unread manager message: a chat-bubble icon with a red dot (no text), count in the name, clears after opening the service', async () => {
    render(<MechanicPage mechanicId="m-jun" />);
    const waiting = document.querySelector('[data-step="waiting"]')!;
    const u = waiting.querySelector('[data-unread]')!;
    expect(u.getAttribute('aria-label')).toMatch(/^Manager (replied|asked you) - \d+ new messages?$/); expect(u.getAttribute('title')).toBe(u.getAttribute('aria-label'));
    expect(u.textContent).toBe(''); expect(u.querySelector('svg')).toBeTruthy();
    expect(u.querySelector('[data-unread-dot]')!.className).toMatch(/bg-bad/); expect(u.querySelector('[data-unread-dot]')!.className).toMatch(/ring-/);
    expect(document.querySelector('main')!.textContent).not.toMatch(/Manager replied|Manager asked you|new messages?/);
    expect(document.querySelectorAll('[data-unread]').length).toBeGreaterThanOrEqual(2);
    await act(async () => { fireEvent.click(waiting.querySelector('button')!); });
    expect(screen.getByRole('region', { name: 'Service items' })).toBeTruthy();
    await open('Back to Services');
    expect(document.querySelector('[data-step="waiting"] [data-unread]')).toBeNull();
    expect(document.querySelectorAll('[data-unread]').length).toBeGreaterThanOrEqual(1);
  });
  it('staff card structure: flag chips under the status row, divider then last activity with the time at the right', () => {
    render(<MechanicPage mechanicId="m-jun" />);
    const last = [...document.querySelectorAll('[data-last]')];
    expect(last.length).toBeGreaterThan(0);
    for (const l of last) {
      expect(l.className).toMatch(/border-t/);
      expect(l.querySelector('[data-last-text]')!.textContent).toMatch(/^.+: ".+"$/);
      expect(l.querySelector('[data-last-text]')!.className).toMatch(/truncate/);
      const ago = l.querySelector('[data-last-ago]')!; expect(ago.textContent).toMatch(/^(Just now|\d+ min ago|\d+ hr ago)$/); expect(ago.className).toMatch(/flex-none/);
    }
    expect(last.some((l) => /^Manager: "Alternator is coming/.test(l.querySelector('[data-last-text]')!.textContent!))).toBe(true);
    const w = document.querySelector('[data-step="waiting"]')!;
    expect(w.querySelector('[data-staff-flags]')!.textContent).toMatch(/out|late/);
    expect(w.querySelector('button')!.className).toMatch(/\bp-3\b/);
  });
  it('a new note becomes the last activity; a part request is listed inside the service with its status', async () => {
    render(<MechanicPage mechanicId="m-jun" overlay="service detail open" />);
    const reqs = () => screen.queryByRole('group', { name: 'Requests for this service' });
    await act(async () => { fireEvent.change(screen.getByLabelText('Add a note or photo'), { target: { value: 'Got the part, fitting now' } }); });
    await open('Post');
    await open('Back to Services');
    expect(document.querySelector('[data-step="now"] [data-last]')!.textContent).toContain('Got the part, fitting now');
    await act(async () => { fireEvent.click(document.querySelector('[data-step="waiting"] button')!); });
    expect(within(reqs()!).getByText('Approved')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Request more parts' })).toBeTruthy();
  });
  it('taller cards still stack without overlap and stay compact', () => {
    render(<MechanicPage mechanicId="m-jun" />);
    const lis = [...document.querySelectorAll('[data-step]')];
    const r = lis.map((li) => ({ step: li.getAttribute('data-step'), top: Number(li.getAttribute('data-top')), h: Number(li.getAttribute('data-height')) }));
    for (let i = 1; i < r.length; i++) expect(r[i].top).toBeGreaterThanOrEqual(r[i - 1].top + r[i - 1].h);
    for (const x of r) expect(x.h).toBeGreaterThanOrEqual(124);
  });
  it('sticky day header is opaque, directly under the app header and breadcrumbs, above cards and the now line (regression)', () => {
    render(<MechanicPage mechanicId="m-jun" />);
    const main = document.getElementById('mech-main')!;
    expect(main.className).toMatch(/overflow-y-auto/); expect(main.className).toMatch(/\bpt-0\b/); expect(main.className).not.toMatch(/\bpt-4\b/);
    const hd = document.querySelector('[data-day-header]')!;
    expect(hd.className).toMatch(/\bsticky\b/); expect(hd.className).toMatch(/\btop-0\b/); expect(hd.className).toMatch(/\bz-20\b/);
    expect(hd.className).toMatch(/\bbg-surface\b/); expect(hd.className).toMatch(/border-b/); expect(hd.className).toMatch(/\bpx-4\b/);
    expect(hd.className).not.toMatch(/(^|\s)-m[xytblr]?-/); expect(hd.className).not.toMatch(/bg-surface\//);
    expect(hd.parentElement!.parentElement).toBe(main);
    expect(main.contains(document.querySelector('header'))).toBe(false); expect(main.contains(document.querySelector('[data-crumbs]'))).toBe(false); expect(main.previousElementSibling).toBe(document.querySelector('[data-crumbs]'));
    const body = document.querySelector('[data-now-line]')!.parentElement!.parentElement!;
    expect(body.className).toMatch(/\bisolate\b/); expect(body.className).toMatch(/\bz-0\b/);
    expect(document.querySelector('[data-now-line]')!.className).toMatch(/z-\[1\]/);
    expect(document.querySelector('[data-step] button')!.className).toMatch(/z-\[2\]/);
    for (const el of main.querySelectorAll('*')) expect(el.getAttribute('class') ?? '').not.toMatch(/(^|\s)-m[tl]?-\d/);
  });
  it('request sent from a service returns to that service', async () => {
    render(<MechanicPage mechanicId="m-ricky" overlay="service detail open" />);
    await open('Request more parts');
    await act(async () => { fireEvent.change(screen.getByRole('combobox'), { target: { value: 'oil' } }); });
    await act(async () => { fireEvent.click(screen.getAllByRole('option')[0]); });
    await open('Send to manager');
    await open('Back to this service');
    expect(screen.getByRole('region', { name: 'Parts for this service' })).toBeTruthy();
  });
});

const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'th-has-data-cells': { enabled: false } } };
describe('Mechanic axe', () => {
  const scenarios = ['normal', 'no services', 'day off', 'loading', 'all blocked'] as const;
  const overlays = ['none', 'service detail open', 'request part open', 'scan sheet', 'pause reason', 'mark-done confirm'] as const;
  for (const sc of scenarios) {
    it(`has no axe violations: state ${sc}`, async () => {
      const { container } = render(<MechanicPage scenario={sc} />);
      expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    });
  }
  for (const ov of overlays) {
    it(`has no axe violations: overlay ${ov}`, async () => {
      const { container } = render(<MechanicPage overlay={ov} />);
      expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    });
  }
  it('has no axe violations: stress', async () => {
    const { container } = render(<MechanicPage stress />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
