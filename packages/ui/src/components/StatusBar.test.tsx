// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PlatformShell } from './PlatformShell';
import { StatusBar } from './StatusBar';

afterEach(cleanup);
const p = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), name: `Plat ${i}` }));

describe('StatusBar', () => {
  it('interactive items use the shared focusRing (outline 2px, offset 2px), not ring-2 + ring-offset', () => {
    render(<StatusBar ledaFirst={false} platforms={p(2).map((x) => ({ ...x, onSelect: () => {} }))} people={{ count: 12, onSelect: () => {} }} plan="Starter" updatedAt="9:12 AM" />);
    const items = screen.getAllByRole('button');
    expect(items.length).toBeGreaterThan(0);
    for (const el of items) {
      expect(el.className).toContain('focus-visible:outline-offset-2');
      expect(el.className).not.toContain('ring-offset');
    }
  });

  it('has no footer of its own; the shell footer is the only one', () => {
    render(<PlatformShell status={<StatusBar platforms={p(2)} />}>x</PlatformShell>);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(screen.getByRole('contentinfo', { name: 'Status' })).toBeTruthy();
  });
  it('shows plan, updated time, people and invite counts with full names', () => {
    render(<StatusBar ledaFirst={false} platforms={p(2)} people={{ count: 12 }} invites={{ count: 2 }} plan="Starter" updatedAt="9:12 AM" />);
    expect(screen.getByText('Starter plan')).toBeTruthy();
    expect(screen.getByText('Updated 9:12 AM')).toBeTruthy();
    expect(screen.getByLabelText('12 people')).toBeTruthy();
    expect(screen.getByLabelText('2 invites waiting')).toBeTruthy();
  });
  it('hides invites at 0 and drops text at narrow widths via container classes', () => {
    const { container } = render(<StatusBar ledaFirst={false} invites={{ count: 0 }} plan="Pro" updatedAt="1:00 PM" />);
    expect(screen.queryByLabelText(/invite/)).toBeNull();
    expect(screen.getByText('Updated 1:00 PM').closest('li')!.className).toContain('@max-[960px]/status:hidden');
    expect(screen.getByText('Pro plan').closest('li')!.className).toContain('@max-[780px]/status:hidden');
    expect(container.querySelectorAll('footer')).toHaveLength(0);
  });
  it('workshop order (default): Leda first, "N platforms · all running", people with invites pending folded in, plan', () => {
    const { container } = render(
      <StatusBar platforms={p(2)} people={{ count: 9 }} invites={{ count: 1 }} leda={{ used: 1742, max: 2000, daysLeft: '7 days left' }} plan="Starter" updatedAt="9:12 AM" />,
    );
    const text = container.textContent ?? '';
    expect(text.indexOf('Leda')).toBeLessThan(text.indexOf('2 platforms'));
    expect(text.indexOf('2 platforms')).toBeLessThan(text.indexOf('9 people'));
    expect(text.indexOf('9 people')).toBeLessThan(text.indexOf('Starter plan'));
    expect(screen.getByText('· all running')).toBeTruthy();
    expect(screen.getByText('· 1 invite pending')).toBeTruthy();
    expect(screen.getByLabelText('9 people · 1 invite pending')).toBeTruthy();
    expect(screen.queryByLabelText(/invite waiting/)).toBeNull();
    // shell.css breakpoints: days left and the summary go at 960, invites, plan and Updated at 1180
    expect(screen.getByText('7 days left').className).toContain('max-[960px]:hidden');
    expect(screen.getByText('· 1 invite pending').className).toContain('max-[1180px]:hidden');
    expect(screen.getByText('Starter plan').closest('li')!.className).toContain('max-[1180px]:hidden');
    expect(screen.getByText('Updated 9:12 AM').closest('li')!.className).toContain('max-[1180px]:hidden');
  });
  it('workshop spacing: 2px between items, divider margins 6 and 8, items 26px with 9px padding on a 20px line', () => {
    const { container } = render(<StatusBar platforms={p(2)} people={{ count: 3 }} />);
    expect(container.querySelector('ul')!.className).toContain('gap-0.5');
    expect(container.querySelector('li > span[aria-hidden]')!.className).toContain('ml-1.5 mr-2');
    const item = screen.getByLabelText('3 people');
    expect(item.className).toMatch(/h-\[26px\].*px-\[9px\].*leading-5/);
  });
  it('non-running platform shows a plain word, is named and announced', () => {
    render(<StatusBar platforms={[{ id: 'a', name: 'Books', health: 'bad' }, { id: 'b', name: 'Stock' }]} />);
    expect(screen.getByText('offline')).toBeTruthy();
    expect(screen.getByLabelText('Books offline')).toBeTruthy();
  });
  it('live region starts empty, stays silent on same-props rerender, announces a health change', () => {
    const ok = [{ id: 'a', name: 'Books' }, { id: 'b', name: 'Stock' }];
    const bad = [{ id: 'a', name: 'Books', health: 'bad' as const }, { id: 'b', name: 'Stock' }];
    const { rerender } = render(<StatusBar platforms={ok} />);
    expect(screen.getByRole('status').textContent).toBe('');
    rerender(<StatusBar platforms={[...ok]} />);
    expect(screen.getByRole('status').textContent).toBe('');
    act(() => { rerender(<StatusBar platforms={bad} />); });
    expect(screen.getByRole('status').textContent).toBe('Books offline');
    act(() => { rerender(<StatusBar platforms={ok} />); });
    expect(screen.getByRole('status').textContent).toBe('All platforms running');
  });
  it('already-offline platform on mount is not announced', () => {
    render(<StatusBar platforms={[{ id: 'a', name: 'Books', health: 'bad' }]} />);
    expect(screen.getByRole('status').textContent).toBe('');
  });
  it('4+ platforms: running are logo-only with a title; a non-running keeps name and word; All running summary', () => {
    const { rerender } = render(<StatusBar ledaFirst={false} platforms={p(4)} />);
    expect(screen.getByText('All running')).toBeTruthy();
    expect(screen.queryByText('Plat 0')).toBeNull();
    expect(screen.getByLabelText('Plat 0').getAttribute('title')).toBe('Plat 0: running');
    rerender(<StatusBar platforms={p(4).map((x, i) => (i === 1 ? { ...x, health: 'warn' as const } : x))} />);
    expect(screen.getByText('Plat 1')).toBeTruthy();
    expect(screen.getByText('slow')).toBeTruthy();
    expect(screen.queryByText('All running')).toBeNull();
  });
  it('3 or fewer platforms show names beside the logo', () => {
    render(<StatusBar platforms={p(3)} />);
    expect(screen.getByText('Plat 2')).toBeTruthy();
  });
  it('people and Leda show text, not colour alone', () => {
    render(<StatusBar people={{ count: 12 }} leda={{ used: 1742, max: 2000 }} />);
    expect(screen.getByText('12 people')).toBeTruthy();
    expect(screen.getByText('Leda')).toBeTruthy();
    expect(screen.getByText('1,742 / 2,000')).toBeTruthy();
  });
  it('invite word drops with the plan at 780', () => {
    render(<StatusBar invites={{ count: 2 }} />);
    expect(screen.getByText('invites pending').className).toContain('@max-[780px]/status:hidden');
  });
  it('items are plain text, links or buttons; selected buttons are pressed', () => {
    const onSelect = vi.fn();
    render(<StatusBar platforms={[{ id: 'a', name: 'A', onSelect, selected: true }, { id: 'b', name: 'B', href: '#b' }, { id: 'c', name: 'C' }]} />);
    const btn = screen.getByRole('button', { name: 'A' });
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'B' }).getAttribute('href')).toBe('#b');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
  it('caps platforms with +N', () => {
    render(<StatusBar platforms={p(11)} maxPlatforms={8} />);
    expect(screen.getByLabelText('+3 more platforms').textContent).toBe('+3');
  });
  it('Leda usage is a named progressbar, warn from 80%', () => {
    render(<StatusBar leda={{ used: 1700, max: 2000 }} />);
    const bar = screen.getByRole('progressbar', { name: 'Leda usage, 1,700 of 2,000' });
    expect(bar.getAttribute('aria-valuetext')).toContain('nearly full');
  });
  it('className cannot break layout', () => {
    const { container } = render(<StatusBar className="hidden w-4" />);
    expect((container.firstElementChild as HTMLElement).className).toContain('w-full');
  });
});

describe('StatusBar text (RDY-315)', () => {
  const four = (bad?: number) => p(4).map((x, i) => (i === bad ? { ...x, health: 'bad' as const } : x));
  it('every platform running shows one "all running" item; one offline keeps its name and word and the rest collapse', () => {
    const { rerender } = render(<StatusBar platforms={p(2)} />);
    expect(screen.getAllByText('· all running')).toHaveLength(1);
    rerender(<StatusBar platforms={p(3).map((x, i) => (i === 1 ? { ...x, health: 'bad' as const } : x))} />);
    expect(screen.queryByText('· all running')).toBeNull();
    expect(screen.getByText('Plat 1')).toBeTruthy();
    expect(screen.getByText('offline')).toBeTruthy();
    expect(screen.queryByText('Plat 0')).toBeNull();
    expect(screen.queryByText('Plat 2')).toBeNull();
    expect(screen.getByLabelText('Plat 0').getAttribute('title')).toBe('Plat 0: running');
    rerender(<StatusBar platforms={four(2)} />);
    expect(screen.getAllByText('offline')).toHaveLength(1);
  });
  it('plan detail text renders from props, bad tone is a class, plain plan unchanged', () => {
    const { rerender } = render(<StatusBar plan="Starter" planDetail="10 of 15 seats" />);
    expect(screen.getByText('Starter · 10 of 15 seats')).toBeTruthy();
    expect(screen.queryByText('Starter plan')).toBeNull();
    rerender(<StatusBar plan="Free" planDetail="4 of 3 seats" planTone="bad" />);
    expect(screen.getByText('Free · 4 of 3 seats').closest('span[class*="text-bad"]')).toBeTruthy();
    rerender(<StatusBar plan="Starter" />);
    expect(screen.getByText('Starter plan')).toBeTruthy();
  });
  it('invite text is singular or plural from the count', () => {
    const { rerender } = render(<StatusBar people={{ count: 9 }} invites={{ count: 1 }} />);
    expect(screen.getByText('· 1 invite pending')).toBeTruthy();
    rerender(<StatusBar people={{ count: 9 }} invites={{ count: 3 }} />);
    expect(screen.getByText('· 3 invites pending')).toBeTruthy();
    rerender(<StatusBar invites={{ count: 1 }} />);
    expect(screen.getByText('invite pending')).toBeTruthy();
  });
  it('hiding the people item leaves Leda, plan, platforms and Updated (and the invites folded into people)', () => {
    render(<StatusBar platforms={p(2)} people={{ count: 9 }} invites={{ count: 2 }} leda={{ used: 10, max: 100 }} plan="Starter" updatedAt="9:12 AM" hide={['people']} />);
    expect(screen.queryByLabelText(/people|person/)).toBeNull();
    expect(screen.queryByText(/invite/)).toBeNull();
    expect(screen.getByText('Leda')).toBeTruthy();
    expect(screen.getByText('Starter plan')).toBeTruthy();
    expect(screen.getByText('2 platforms')).toBeTruthy();
    expect(screen.getByText('Updated 9:12 AM')).toBeTruthy();
  });
});

describe('StatusBar forced colors (RDY-364)', () => {
  it('the Leda minibar keeps an outline and a Highlight fill when backgrounds are forced', () => {
    render(<StatusBar leda={{ used: 10, max: 100 }} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.className).toContain('forced-colors:outline-[CanvasText]');
    expect(bar.firstElementChild!.className).toContain('forced-colors:bg-[Highlight]');
  });
});

