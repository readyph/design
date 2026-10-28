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
    expect(screen.getByText('No activity yet')).toBeTruthy();
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

  it('retryLabel renames the error button; refs stay whole', () => {
    const { rerender } = render(<PlatformToday platform={autoWorks} error onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    rerender(<PlatformToday platform={autoWorks} error onRetry={() => {}} retryLabel="Retry" />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    cleanup();
    const item = { id: 'a', ref: 'JO-0412', title: 'Vios', link: { platform: stockroom, ref: 'ALT-NCP150', text: '0 on hand' } };
    render(<PlatformToday platform={autoWorks} lists={[{ id: 'l', title: 'Jobs', total: 1, items: [item] }]} />);
    expect(screen.getByText('JO-0412').className).toContain('whitespace-nowrap');
    expect(screen.getByText('ALT-NCP150').className).toContain('whitespace-nowrap');
  });

  describe('link chips (RDY-326)', () => {
    const linked = { ...jobs, items: [{ ...jobs.items[0], link: { platform: stockroom, ref: 'ALT-NCP150', text: '0 on hand', onSelect: vi.fn() } }] };
    const target = { ...stock, items: [{ id: 'm9', ref: 'ALT-NCP150', title: 'Alternator', tone: 'bad' as const }, { id: 'm8', ref: 'OTHER-1', title: 'Other' }] };

    it('click focuses and flashes only the target row and calls onLinkActivate; a missing row does nothing', () => {
      const onLinkActivate = vi.fn();
      render(
        <>
          <PlatformToday platform={autoWorks} lists={[linked]} onLinkActivate={onLinkActivate} />
          <PlatformToday platform={stockroom} lists={[target]} />
        </>,
      );
      const block = document.querySelector('[data-platform-id="Cebu Parts Stockroom"]') as HTMLElement;
      const row = block.querySelector('[data-ref="ALT-NCP150"]') as HTMLElement;
      const other = block.querySelector('[data-ref="OTHER-1"]') as HTMLElement;
      fireEvent.click(screen.getByRole('button', { name: /ALT-NCP150\s+0 on hand/ }));
      expect(onLinkActivate).toHaveBeenCalledWith({ platformId: 'Cebu Parts Stockroom', ref: 'ALT-NCP150' });
      expect(row.className).toContain('animate-row-flash');
      expect(document.activeElement).toBe(row);
      expect(other.className).not.toContain('animate-row-flash');
      expect(block.className).not.toContain('animate-row-flash');
    });

    it('a missing row does nothing but still reports the activation', () => {
      const onLinkActivate = vi.fn();
      render(<PlatformToday platform={autoWorks} lists={[linked]} onLinkActivate={onLinkActivate} />);
      fireEvent.click(screen.getByRole('button', { name: /ALT-NCP150\s+0 on hand/ }));
      expect(onLinkActivate).toHaveBeenCalledOnce();
      expect(document.querySelector('.motion-safe\\:animate-row-flash')).toBeNull();
    });

    it('hover and focus fire onLinkHover with the link; leaving fires null', () => {
      const onLinkHover = vi.fn();
      render(<PlatformToday platform={{ ...autoWorks, id: 'auto-works' }} lists={[linked]} onLinkHover={onLinkHover} />);
      const chip = screen.getByRole('button', { name: /ALT-NCP150\s+0 on hand/ });
      fireEvent.mouseEnter(chip);
      expect(onLinkHover).toHaveBeenLastCalledWith(linked.items[0].link, 'auto-works');
      fireEvent.mouseLeave(chip);
      expect(onLinkHover).toHaveBeenLastCalledWith(null);
      fireEvent.focus(chip);
      expect(onLinkHover).toHaveBeenLastCalledWith(linked.items[0].link, 'auto-works');
      fireEvent.blur(chip);
      expect(onLinkHover).toHaveBeenLastCalledWith(null);
    });
  });
});
