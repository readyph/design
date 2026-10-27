// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PlatformShell } from './PlatformShell';
import { StatusBar } from './StatusBar';

afterEach(cleanup);
const p = (n: number) => Array.from({ length: n }, (_, i) => ({ id: String(i), name: `Plat ${i}` }));

describe('StatusBar', () => {
  it('has no footer of its own; the shell footer is the only one', () => {
    render(<PlatformShell status={<StatusBar platforms={p(2)} />}>x</PlatformShell>);
    expect(screen.getAllByRole('contentinfo')).toHaveLength(1);
    expect(screen.getByRole('contentinfo', { name: 'Status' })).toBeTruthy();
  });
  it('shows plan, updated time, people and invite counts with full names', () => {
    render(<StatusBar platforms={p(2)} people={{ count: 12 }} invites={{ count: 2 }} plan="Starter" updatedAt="9:12 AM" />);
    expect(screen.getByText('Starter plan')).toBeTruthy();
    expect(screen.getByText('Updated 9:12 AM')).toBeTruthy();
    expect(screen.getByLabelText('12 people')).toBeTruthy();
    expect(screen.getByLabelText('2 invites waiting')).toBeTruthy();
  });
  it('hides invites at 0 and drops plan and updated at 1180px like the prototype', () => {
    const { container } = render(<StatusBar invites={{ count: 0 }} plan="Pro" updatedAt="1:00 PM" />);
    expect(screen.queryByLabelText(/invite/)).toBeNull();
    expect(screen.getByText('Updated 1:00 PM').closest('li')!.className).toContain('max-[1180px]:hidden');
    expect(screen.getByText('Pro plan').closest('li')!.className).toContain('max-[1180px]:hidden');
    expect(container.querySelectorAll('footer')).toHaveLength(0);
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
    const { rerender } = render(<StatusBar platforms={p(4)} />);
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
    expect(screen.getByText('invites waiting').className).toContain('@max-[780px]/status:hidden');
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
    expect(screen.getByLabelText('3 more platforms').textContent).toBe('+3');
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
