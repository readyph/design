// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
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

  it('announces the latest message: snooze after j / k is heard', () => {
    render(<Queue {...base} onSnooze={() => {}} />);
    fireEvent.keyDown(document, { key: 'j' });
    expect(screen.getByRole('status').textContent).toMatch(/1 of 4/);
    fireEvent.keyDown(document, { key: 's' });
    expect(screen.getByRole('status').textContent).toBe('Snooze asked for Alternator for the 11:00 Vios');
  });

  it('after a snooze the cursor takes the next item, so j goes one further', () => {
    function Host() {
      const [open, setOpen] = useState(items);
      return <Queue {...base} items={open} onSnooze={(id) => setOpen(open.filter((i) => i.id !== id))} />;
    }
    render(<Host />);
    fireEvent.keyDown(document, { key: 'j' });
    fireEvent.keyDown(document, { key: 'j' });
    fireEvent.keyDown(document, { key: 's' });
    const cur = () => document.querySelector('[data-current="true"]')?.getAttribute('data-row-id');
    expect(cur()).toBe('q3');
    fireEvent.keyDown(document, { key: 'j' });
    expect(cur()).toBe('q4');
  });

  it('lets a long unbreakable action label wrap inside the row', () => {
    render(<Queue {...base} items={[{ ...items[0], action: 'Approve-the-replacement-order-now' }]} />);
    const b = screen.getByRole('button', { name: 'Approve-the-replacement-order-now' });
    expect(b.className).toContain('whitespace-normal');
    expect(b.className).toContain('max-w-full');
  });

  it('retryLabel renames the error buttons', () => {
    const err = [{ platform: allPlatforms[0]! }];
    const { rerender } = render(<Queue {...base} errors={err} onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    rerender(<Queue {...base} errors={err} onRetry={() => {}} retryLabel="Retry" />);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  });

  it('does not scroll while loading (no focusable content inside), and scrolls otherwise', () => {
    const { container, rerender } = render(<Queue {...base} loading />);
    const box = () => container.querySelector('[aria-busy], .overflow-y-auto, .overflow-hidden') as HTMLElement;
    expect(box().className).toContain('overflow-hidden');
    expect(box().className).not.toContain('overflow-y-auto');
    rerender(<Queue {...base} />);
    expect(container.querySelector('ul')!.parentElement!.className).toContain('overflow-y-auto');
  });

  it('belowHeadline sits between the headline and the list', () => {
    render(<Queue {...base} belowHeadline={<button type="button">Ask Leda</button>} />);
    const headline = screen.getByText(/4 decisions\. First/);
    const ask = screen.getByRole('button', { name: 'Ask Leda' });
    const list = screen.getByRole('list', { name: 'Needs you' });
    expect(headline.compareDocumentPosition(ask) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(ask.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('the cursor row carries the primary button, the others secondary', () => {
    render(<Queue {...base} defaultCursorId={items[0]!.id} />);
    const classes = () => within(screen.getByRole('list', { name: 'Needs you' })).getAllByRole('button').map((b) => b.className);
    const [first, second] = classes();
    expect(first).not.toBe(second);
    fireEvent.keyDown(document, { key: 'j' });
    expect(classes().slice(0, 2)).toEqual([second, first]);
  });

  it('forced colors: plain rows hide the border, the cursor row uses Highlight', () => {
    render(<Queue {...base} defaultCursorId={items[0]!.id} />);
    const rows = within(screen.getByRole('list', { name: 'Needs you' })).getAllByRole('listitem');
    expect(rows[1]!.className).toContain('forced-colors:border-[Canvas]');
    expect(rows[0]!.className).toContain('forced-colors:data-[current=true]:border-[Highlight]');
  });
});
