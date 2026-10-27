// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Breadcrumbs } from './Breadcrumbs';

afterEach(cleanup);

const items = [
  { label: 'All platforms', href: '/platforms' },
  { label: 'Team', href: '/team' },
  { label: 'Ana Reyes' },
];

describe('Breadcrumbs', () => {
  it('trail: nav landmark, links, current page is not a link', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    const cur = screen.getByText('Ana Reyes').closest('[aria-current]')!;
    expect(cur.getAttribute('aria-current')).toBe('page');
    expect(cur.tagName).toBe('SPAN');
    expect(cur.className).toContain('text-text');
  });
  it('trail: renders logos and hides separators', () => {
    const { container } = render(<Breadcrumbs items={[{ label: 'A', href: '#', logo: <i data-testid="logo" /> }, { label: 'B' }]} />);
    expect(screen.getByTestId('logo')).toBeTruthy();
    expect(container.querySelectorAll('li[aria-hidden]')).toHaveLength(1);
  });
  it('sheet: bordered back control then current in 600', () => {
    render(<Breadcrumbs variant="sheet" items={items} />);
    const back = screen.getByRole('link');
    expect(back.textContent).toBe('←Team');
    expect(back.className).toContain('border-control');
    expect(back.className).toContain('bg-transparent');
    expect(back.className).not.toContain('rounded-full');
    const cur = screen.getByText('Ana Reyes');
    expect(cur.getAttribute('aria-current')).toBe('page');
    expect(cur.className).toContain('font-semibold');
  });
  it('phone: plain back link only', () => {
    render(<Breadcrumbs variant="phone" items={items} />);
    const back = screen.getByRole('link');
    expect(back.textContent).toBe('Team');
    expect(back.className).not.toMatch(/\bbg-(?!transparent)|border /);
    expect(screen.queryByText('Ana Reyes')).toBeNull();
  });
  it('onClick-only crumb is a button and fires', () => {
    const fn = vi.fn();
    render(<Breadcrumbs variant="sheet" items={[{ label: 'Memory', onClick: fn }, { label: 'Item' }]} />);
    fireEvent.click(screen.getByRole('button', { name: /Memory/ }));
    expect(fn).toHaveBeenCalled();
  });
  it('className goes on the wrapper, not the nav', () => {
    const { container } = render(<Breadcrumbs items={items} className="mt-4 w-40" aria-label="Trail" />);
    expect((container.firstChild as HTMLElement).className).toContain('mt-4');
    expect(screen.getByRole('navigation', { name: 'Trail' }).className).not.toContain('mt-4');
  });
  it('single item has no back control', () => {
    render(<Breadcrumbs variant="sheet" items={[{ label: 'Only' }]} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Only').getAttribute('aria-current')).toBe('page');
  });
  it('trail: never wraps; ancestors shrink, current crumb shrinks last', () => {
    const { container } = render(<Breadcrumbs items={items} />);
    const ol = container.querySelector('ol')!;
    expect(ol.className).toContain('flex-nowrap');
    expect(ol.className).not.toContain('flex-wrap');
    const lis = Array.from(ol.querySelectorAll(':scope > li'));
    expect(lis[0].className).toContain('shrink');
    expect(lis[0].className).not.toContain('shrink-0');
    expect(lis[1].getAttribute('aria-hidden')).toBe('true');
    expect(lis[1].className).toContain('shrink-0');
    expect(lis[lis.length - 1].className).toContain('shrink-0');
  });
  it('phone: back link is at least 44x44 on small screens', () => {
    render(<Breadcrumbs variant="phone" items={items} />);
    const a = screen.getByRole('link');
    expect(a.className).toContain('max-sm:min-h-11');
    expect(a.className).toContain('max-sm:min-w-11');
  });
});
