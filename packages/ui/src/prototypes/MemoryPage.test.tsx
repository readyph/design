// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryPage } from './MemoryPage';

beforeEach(() => {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
  vi.unstubAllGlobals();
});

describe('Memory page', () => {
  it('tabs: arrow keys move focus and the content follows', async () => {
    const user = userEvent.setup();
    render(<MemoryPage />);
    const topics = screen.getByRole('tab', { name: 'Topics' });
    act(() => topics.focus());
    await user.keyboard('{ArrowRight}');
    const blocked = screen.getByRole('tab', { name: 'Blocked questions' });
    expect(document.activeElement).toBe(blocked);
    expect(blocked.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('heading', { level: 2, name: 'Blocked questions' })).toBeTruthy();
  });

  it('Try it opens as a dialog, and Escape returns focus to the button that opened it', async () => {
    const user = userEvent.setup();
    render(<MemoryPage />);
    const btn = screen.getByRole('button', { name: 'Try it' });
    await user.click(btn);
    expect(screen.getByRole('dialog')).toBeTruthy();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(btn));
  });

  it('read only: switches are disabled and a note says who can change it', () => {
    render(<MemoryPage readOnly />);
    expect(screen.getAllByText(/Only owners, admins and managers can change it/).length).toBeGreaterThan(0);
    const sw = within(screen.getByRole('main')).getAllByRole('switch');
    expect(sw.length).toBeGreaterThan(0);
    sw.forEach((s) => expect((s as HTMLButtonElement).disabled || s.getAttribute('aria-disabled') === 'true').toBe(true));
  });

  it('exact data: the prototype\'s topics, three folders and the 18 of 22 headline', () => {
    render(<MemoryPage />);
    expect(screen.getAllByText(/Customers' Leda can use 18 of 22 topics\. 4 stay off: Supplier lead times, Costs and margins, Suppliers, Stock counts and value\./).length).toBe(1);
    const folders = screen.getByRole('list', { name: 'Folders' });
    expect(within(folders).getAllByRole('listitem').length).toBe(4);
    expect(screen.getByText('Company profile')).toBeTruthy();
  });

  it('deep link state: the Memory room is in the left column and Try it opens per request', async () => {
    const user = userEvent.setup();
    render(<MemoryPage initialTab="requests" />);
    expect(screen.getByText(/2,201 of 16,000 characters/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /Try it: Can I bring my car in on Saturday morning/ }));
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('error: says the last saved switches stay in use and hides Try it', () => {
    render(<MemoryPage state="error" />);
    expect(screen.getByText(/keeps using the last saved switches/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try it' })).toBeNull();
  });

  it('empty: offers to add a company topic', () => {
    render(<MemoryPage state="empty" />);
    expect(screen.getByRole('button', { name: /Add a company topic/ })).toBeTruthy();
  });

  it('folder pick filters Blocked questions and the breadcrumb names the folder', async () => {
    const user = userEvent.setup();
    render(<MemoryPage />);
    expect(screen.getByRole('navigation', { name: 'Folder' }).textContent).toContain('All topics');
    const folders = screen.getByRole('list', { name: 'Folders' });
    await user.click(within(folders).getByText('Parts Stockroom'));
    expect(screen.getByRole('navigation', { name: 'Folder' }).textContent).toContain('Parts Stockroom');
    await user.click(screen.getByRole('tab', { name: 'Blocked questions' }));
    const main = screen.getByRole('main');
    expect(within(main).getByText(/Which shops do you supply/)).toBeTruthy();
    expect(within(main).queryByText(/parts supplier/)).toBeNull();
    expect(within(main).getByRole('combobox', { name: /^Business/ }).textContent).toContain('Parts Stockroom');
  });

  it('Blocked tab business filter changes the list and keeps focus on the filter', async () => {
    const user = userEvent.setup();
    render(<MemoryPage initialTab="blocked" />);
    const main = screen.getByRole('main');
    expect(within(main).getByText(/parts supplier/)).toBeTruthy();
    const filter = within(main).getByRole('combobox', { name: /^Business/ });
    await user.click(filter);
    await user.click(screen.getByRole('option', { name: /Parts Stockroom/ }));
    expect(within(main).queryByText(/parts supplier/)).toBeNull();
    expect(within(main).getByText(/Which shops do you supply/)).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(filter));
  });

  it('uses the shared Portal frame: Memory is current in the rail and More is current on the phone nav', async () => {
    const user = userEvent.setup();
    render(<MemoryPage />);
    const rail = screen.getAllByRole('navigation', { name: 'Portal' });
    const memoryLinks = screen.getAllByRole('link', { name: 'Memory' }).filter((a) => a.getAttribute('aria-current') === 'page');
    expect(rail.length).toBeGreaterThan(0);
    expect(memoryLinks.length).toBeGreaterThan(0);
    const more = screen.getByRole('button', { name: 'More' });
    expect(more.getAttribute('aria-current')).toBe('page');
    await user.click(more);
    expect(screen.getByRole('menuitem', { name: 'Memory' })).toBeTruthy();
  });
});
