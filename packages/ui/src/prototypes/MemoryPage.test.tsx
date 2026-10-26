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
    expect(screen.getByRole('heading', { level: 1, name: 'Blocked questions' })).toBeTruthy();
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

  it('error: says the last saved switches stay in use and hides Try it', () => {
    render(<MemoryPage state="error" />);
    expect(screen.getByText(/keeps using the last saved switches/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try it' })).toBeNull();
  });

  it('empty: offers to add a company topic', () => {
    render(<MemoryPage state="empty" />);
    expect(screen.getByRole('button', { name: /Add a company topic/ })).toBeTruthy();
  });
});
