// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Home } from './Home';
import { clearToasts } from '../components/toast/toastStore';

beforeEach(() => {
  window.localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  clearToasts();
  vi.useRealTimers();
});

const queue = () => within(screen.getByRole('list', { name: 'Needs you' }));

describe('Home', () => {
  it('opens on Today with the decisions in Needs you and one h1', () => {
    render(<Home />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 2, name: 'Today' })).toBeTruthy();
    expect(queue().getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('tab', { name: 'Today' })).toBeTruthy();
  });

  it('a queue row button opens the case and focuses Confirm; the write happens only at Confirm', async () => {
    vi.useFakeTimers();
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Order alternator' }));
    const confirm = screen.getAllByRole('button', { name: 'Order alternator' }).find((b) => b.closest('[data-state]'))!;
    expect(document.activeElement).toBe(confirm);
    expect(queue().getAllByRole('listitem')).toHaveLength(4);
    fireEvent.click(confirm);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(queue().getAllByRole('listitem')).toHaveLength(3);
    // the pressed button is gone: focus is on the result line, never on <body>
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement?.closest('[data-state="done"]')).toBeTruthy();
    // next: focus moves to the next case's heading
    fireEvent.click(screen.getByRole('button', { name: /Next: Oil filters/ }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: /Oil filters at 4/ }));
  });

  it('snoozing a case moves it to Snoozed and puts focus on the sheet, not body', async () => {
    const user = userEvent.setup();
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm PO' }));
    screen.getByRole('button', { name: 'Snooze' }).focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: /Later today/ }));
    expect(queue().getAllByRole('listitem')).toHaveLength(3);
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Today' }));
  });

  it('closing the last tab shows the overview and focuses its greeting', () => {
    render(<Home />);
    const x = screen.getByRole('tab', { name: 'Today' }).querySelector('[data-close]')!;
    fireEvent.mouseDown(x);
    fireEvent.click(x);
    expect(screen.getByRole('heading', { level: 2, name: /Good morning, Mon/ })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: /Good morning, Mon/ }));
  });

  it('quiet: opens on the overview, says nothing needs you, shows next and yesterday', () => {
    render(<Home state="quiet" />);
    expect(screen.getByText(/Both platforms are running\. Nothing needs you right now\./)).toBeTruthy();
    expect(screen.getByText(/Next: PO-0221/)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Yesterday/ })).toBeTruthy();
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('loading is busy, error offers Retry in its block, many has 8 Today blocks', () => {
    const a = render(<Home state="loading" />);
    expect(a.container.querySelector('[aria-busy="true"]')).toBeTruthy();
    cleanup();
    render(<Home state="error" />);
    expect(screen.getAllByRole('button', { name: /Try again/ }).length).toBeGreaterThan(0);
    cleanup();
    render(<Home set="many" />);
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThanOrEqual(8);
  });
});
