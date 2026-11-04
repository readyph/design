import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { RequestList, previewOf, type RequestListItem } from './RequestList';
import { RequestStepper } from './RequestStepper';
import { getMech } from './sms/mechModel';
import { itemsOf, seedRequests } from './sms/requestsModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('RequestList', () => {
  seedRequests({ scenario: 'default', customer: 'waiting' });
  const items = itemsOf(getMech());
  it('opens a row on click and Enter', () => {
    const onOpen = vi.fn();
    render(<RequestList items={items} selectedId={null} onOpen={onOpen} />);
    const rows = screen.getAllByRole('option');
    fireEvent.click(rows[0]);
    fireEvent.keyDown(rows[0], { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
  it('renders the empty slot', () => {
    render(<RequestList items={[]} selectedId={null} onOpen={() => {}} empty={<p>Nothing here.</p>} />);
    expect(screen.getByText('Nothing here.')).toBeTruthy();
  });
  it('has no aria-label: the name comes from the visible content, with an sr-only Unread cue (label-in-name)', () => {
    render(<RequestList items={items} selectedId={null} onOpen={() => {}} />);
    for (const row of screen.getAllByRole('option')) {
      expect(row.hasAttribute('aria-label')).toBe(false);
      for (const el of row.querySelectorAll('span.truncate, span.tabular-nums')) {
        expect(row.textContent).toContain((el.textContent ?? '').trim());
      }
    }
    const unread = items.filter((i) => i.unread).length;
    expect(screen.getAllByText('Unread')).toHaveLength(unread);
  });
  it('has no axe violations', async () => {
    const { container } = render(<RequestList items={items} selectedId={items[0]?.id ?? null} onOpen={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('RequestList with API rows (RDY-652)', () => {
  const row = (o: Partial<RequestListItem>): RequestListItem => ({ id: 'a1', kind: 'part', status: 'Needs you', needsYou: true, unread: true, title: 'Brake pad x2', preview: '2 sets for JO-9', plate: 'ZZZ 999', jobTitle: 'Brake service', sender: { id: '9f1c-uuid', name: 'Nena Cruz', short: 'Nena', initials: 'NC' }, agoLabel: '5 min ago', ...o });
  it('shows the supplied plate, title, sender and time, nothing from studio fixtures', () => {
    render(<RequestList items={[row({}), row({ id: 'a2', plate: null, jobTitle: null, title: 'Shop rags', sender: { id: 'x', name: 'Oscar Lim', short: 'Oscar', initials: 'OL' }, agoLabel: '2 h ago' })]} selectedId={null} onOpen={() => {}} />);
    const [r1, r2] = screen.getAllByRole('option');
    expect(r1!.textContent).toContain('ZZZ 999');
    expect(r1!.textContent).toContain('Brake service');
    expect(r1!.textContent).toContain('Nena');
    expect(r1!.textContent).toContain('5 min ago');
    expect(r1!.hasAttribute('aria-label')).toBe(false);
    expect(r2!.textContent).toContain('Shop use');
    expect(r2!.textContent).toContain('Oscar');
    expect(r2!.textContent).toContain('2 h ago');
  });
});

describe('RequestList preview', () => {
  const part = (preview: string) => ({ id: 'p', kind: 'part', status: 'Needs you', needsYou: true, unread: false, title: 'Brake fluid DOT 4 x1', preview, plate: null, jobTitle: null, sender: { id: 's', name: 'Nena Cruz', short: 'Nena', initials: 'NC' }, agoLabel: 'now' }) as RequestListItem;
  it('has no trailing colon when the body is empty', () => {
    expect(previewOf(part(''))).toBe('Brake fluid DOT 4 x1');
    expect(previewOf(part('  '))).toBe('Brake fluid DOT 4 x1');
  });
  it('renders the row without a trailing colon and keeps label-in-name', () => {
    const { container } = render(<RequestList items={[part(''), { ...part('2 sets'), id: 'q' }]} selectedId={null} onOpen={() => {}} />);
    const lines = Array.from(container.querySelectorAll('span.truncate')).map((e) => e.textContent);
    expect(lines).toContain('Brake fluid DOT 4 x1');
    expect(lines).toContain('Brake fluid DOT 4 x1: 2 sets');
    expect(lines.some((l) => l?.endsWith(':'))).toBe(false);
    expect(screen.getAllByRole('option')[0].textContent).not.toMatch(/:/);
  });
  it('joins title and body when there is one', () => {
    expect(previewOf(part('2 sets'))).toBe('Brake fluid DOT 4 x1: 2 sets');
  });
});

describe('RequestStepper', () => {
  it('has no axe violations in every status', async () => {
    const { container } = render(<div>{(['Requested', 'Approved', 'Ready at stockroom', 'Collected', 'Declined'] as const).map((s) => <RequestStepper key={s} status={s} />)}</div>);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
