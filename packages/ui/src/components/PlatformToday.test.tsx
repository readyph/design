// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PlatformToday, pickTodayRows } from './PlatformToday';
import { autoWorks, jobs, stock, stockroom } from './PlatformToday.data';

afterEach(cleanup);

describe('PlatformToday', () => {
  it('names the section by the platform and shows kind, facts and Leda mode', () => {
    render(<PlatformToday platform={autoWorks} kind="Auto repair" leda="acts" facts={[{ value: 7, label: 'open jobs' }]} lists={[jobs]} />);
    const s = screen.getByRole('region', { name: 'Auto Works Quezon City' });
    expect(within(s).getByText('Auto repair')).toBeTruthy();
    expect(within(s).getByText('Leda acts here')).toBeTruthy();
    expect(within(s).getByRole('list', { name: 'Auto Works Quezon City facts' })).toBeTruthy();
  });

  it('shows at most maxRows rows and View all N only when there are more', () => {
    const { rerender } = render(<PlatformToday platform={autoWorks} lists={[jobs]} maxRows={2} />);
    expect(screen.getAllByRole('listitem').filter((li) => li.hasAttribute('data-row-id'))).toHaveLength(2);
    expect(screen.getByRole('button', { name: /View all 7 in Open jobs/ })).toBeTruthy();
    rerender(<PlatformToday platform={autoWorks} lists={[{ ...jobs, total: 4 }]} maxRows={4} />);
    expect(screen.queryByRole('button', { name: /View all/ })).toBeNull();
  });

  it('keeps the first row of each tone when trimming', () => {
    const picked = pickTodayRows(stock.items, 2);
    expect(picked.map((i) => i.id)).toEqual(['m1', 'm2']);
  });

  it('link chip has an accessible name that says where it leads, and calls onSelect', () => {
    const onSelect = vi.fn();
    const l = { ...jobs, items: [{ ...jobs.items[0], link: { platform: stockroom, ref: 'ALT-NCP150', text: '0 on hand', onSelect } }] };
    render(<PlatformToday platform={autoWorks} lists={[l]} />);
    const chip = screen.getByRole('button', { name: /ALT-NCP150\s+0 on hand\s+in Cebu Parts Stockroom/ });
    fireEvent.click(chip);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it('a row with onActivate has a real title button (focusable, click opens once); without it, plain text', () => {
    const onActivate = vi.fn();
    const l = { ...jobs, items: [{ ...jobs.items[0], title: 'Brake pads', onActivate }, { ...jobs.items[1], title: 'Plain row' }] };
    render(<PlatformToday platform={autoWorks} lists={[l]} />);
    const b = screen.getByRole('button', { name: 'Brake pads' });
    b.focus();
    expect(document.activeElement).toBe(b);
    expect(b.getAttribute('type')).toBe('button');
    fireEvent.click(b);
    expect(onActivate).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Plain row' })).toBeNull();
  });

  it('marks the frame surface so rules use --frame-rule; the sheet resets it', () => {
    const { container, rerender } = render(<PlatformToday platform={autoWorks} lists={[jobs]} />);
    expect(container.querySelector('section')?.getAttribute('data-surface')).toBe('frame');
    rerender(<PlatformToday platform={autoWorks} lists={[jobs]} surface="surface" />);
    expect(container.querySelector('section')?.getAttribute('data-surface')).toBe('surface');
  });

  it('paints the header with the scope background variable, not a fixed colour (RDY-306)', () => {
    const { container } = render(<PlatformToday platform={autoWorks} lists={[jobs]} />);
    const header = container.querySelector('header') as HTMLElement;
    expect(header.className).toContain('bg-[var(--scope-bg)]');
    expect(header.className).not.toMatch(/\bbg-(frame|surface)\b/);
  });

  it('lists do not take j / k by default; shortcuts turns them on', () => {
    const { unmount } = render(<PlatformToday platform={autoWorks} lists={[jobs]} />);
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(document.querySelector('[data-current="true"]')).toBeNull();
    unmount();
    render(<PlatformToday platform={autoWorks} lists={[jobs]} shortcuts />);
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(document.querySelector('[data-current="true"]')).not.toBeNull();
  });

  it('shows activity when there are no lists, and an empty line when nothing', () => {
    const { rerender } = render(<PlatformToday platform={autoWorks} activity={[{ id: 'a', at: '9:00 AM', text: 'Opened' }]} />);
    expect(screen.getByText('Opened')).toBeTruthy();
    rerender(<PlatformToday platform={autoWorks} />);
    expect(screen.getByText('Nothing yet today.')).toBeTruthy();
  });

  it('loading is busy with no lists; error shows retry', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<PlatformToday platform={autoWorks} lists={[jobs]} loading />);
    expect(screen.getByRole('region').getAttribute('aria-busy')).toBe('true');
    expect(screen.queryByText('Open jobs')).toBeNull();
    rerender(<PlatformToday platform={autoWorks} lists={[jobs]} error onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('Open button has the platform name and className cannot replace layout classes', () => {
    const onOpen = vi.fn();
    render(<PlatformToday platform={autoWorks} onOpen={onOpen} className="mt-4" />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Auto Works Quezon City' }));
    expect(onOpen).toHaveBeenCalled();
    expect(screen.getByRole('region').className).toContain('min-w-0');
  });

  it('HQ variant renders the logo as HQ and children after the lists', () => {
    render(<PlatformToday platform={{ name: 'HQ', hq: true }} kind="Team and plan" lists={[jobs]}><p>Plan bar</p></PlatformToday>);
    expect(screen.getByText('Plan bar')).toBeTruthy();
  });
});
