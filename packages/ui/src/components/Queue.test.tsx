// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { Queue } from './Queue';
import { allPlatforms, done, items, snoozed, watching } from './Queue.data';

afterEach(cleanup);
const base = { items, watching, snoozed, done, platforms: allPlatforms };

describe('Queue', () => {
  it('shows title, count, headline and one action per item', () => {
    render(<Queue {...base} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Needs you' })).toBeTruthy();
    expect(screen.getByText(/4 decisions\. First: Alternator/)).toBeTruthy();
    expect(within(screen.getByRole('list', { name: 'Needs you' })).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'Order alternator' }).getAttribute('aria-describedby')).toBeTruthy();
  });

  it('folds the pinned groups to one line and opens them in place', () => {
    render(<Queue {...base} />);
    const snz = screen.getByRole('button', { name: /Snoozed/ });
    expect(snz.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText(/Later today/)).toBeNull();
    fireEvent.click(snz);
    expect(screen.getByText(/Later today · 13:00/)).toBeTruthy();
    expect(screen.getByRole('group', { name: /Snoozed/ }).querySelector('h2')).toBeTruthy();
  });

  it('filters by platform from the menu state and shows the filtered empty state', () => {
    const onFilterChange = vi.fn();
    render(<Queue {...base} defaultFilter="stock" onFilterChange={onFilterChange} />);
    expect(within(screen.getByRole('list', { name: 'Needs you' })).getAllByRole('listitem')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Show all platforms' }));
    expect(onFilterChange).toHaveBeenCalledWith(null);
    expect(within(screen.getByRole('list', { name: 'Needs you' })).getAllByRole('listitem')).toHaveLength(4);
    cleanup();
    render(<Queue {...base} items={items.filter((i) => i.platform.id !== 'hq')} defaultFilter="hq" />);
    expect(screen.getAllByText('Nothing to decide here.').length).toBeGreaterThan(0);
  });

  it('empty, loading and error states', () => {
    const { rerender } = render(<Queue {...base} items={[]} />);
    expect(screen.getByText('Nothing open')).toBeTruthy();
    rerender(<Queue {...base} loading />);
    expect(screen.getByText('Loading Needs you')).toBeTruthy();
    const onRetry = vi.fn();
    rerender(<Queue {...base} errors={[{ platform: allPlatforms[1], lastLoaded: '9:10 AM' }]} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledWith('stock');
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('j / k move the cursor, Enter opens, s snoozes', () => {
    const onOpen = vi.fn();
    const onSnooze = vi.fn();
    render(<Queue {...base} onOpen={onOpen} onSnooze={onSnooze} />);
    fireEvent.keyDown(document, { key: 'j' });
    fireEvent.keyDown(document, { key: 'j' });
    const rows = screen.getAllByRole('listitem');
    expect(rows[1].getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledWith('q2');
    fireEvent.keyDown(document, { key: 's' });
    expect(onSnooze).toHaveBeenCalledWith('q2');
    fireEvent.keyDown(document, { key: 'k' });
    expect(rows[0].getAttribute('aria-current')).toBe('true');
  });

  it('crosses into an opened pinned group', () => {
    const onOpen = vi.fn();
    render(<Queue {...base} defaultOpenGroups={['watching']} onOpen={onOpen} defaultCursorId="q4" />);
    fireEvent.keyDown(document, { key: 'j' });
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledWith('w1');
  });

  it('s only snoozes open items, and keys do not fire while typing or with shortcuts off', () => {
    const onSnooze = vi.fn();
    render(
      <div>
        <input aria-label="note" />
        <Queue {...base} onSnooze={onSnooze} defaultOpenGroups={['watching']} defaultCursorId="w1" />
      </div>,
    );
    fireEvent.keyDown(document, { key: 's' });
    expect(onSnooze).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByLabelText('note'), { key: 'j' });
    expect(document.querySelector('[data-current="true"]')?.getAttribute('data-row-id')).toBe('w1');
    cleanup();
    render(<Queue {...base} onSnooze={onSnooze} defaultCursorId="q1" shortcuts={false} />);
    fireEvent.keyDown(document, { key: 's' });
    expect(onSnooze).not.toHaveBeenCalled();
  });

  it('clicking the row opens it, clicking the button only acts', () => {
    const onOpen = vi.fn();
    const onAction = vi.fn();
    render(<Queue {...base} onOpen={onOpen} onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm PO' }));
    expect(onAction).toHaveBeenCalledWith('q2');
    expect(onOpen).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('PO-0221 waits for your OK'));
    expect(onOpen).toHaveBeenCalledWith('q2');
  });

  it('marks urgent due times for screen readers', () => {
    render(<Queue {...base} />);
    expect(screen.getByText('Urgent, due')).toBeTruthy();
  });
});
