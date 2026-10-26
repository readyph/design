// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SubpageLane, SubpageTransition, type SubpageDirection } from './SubpageTransition';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function Page({ k, dir = 'in', onExited }: { k: string; dir?: SubpageDirection; onExited?: () => void }) {
  return (
    <SubpageTransition paneKey={k} direction={dir} onExited={onExited}>
      <SubpageLane from="left" focus={false} data-testid="col" className="bg-frame overflow-visible">
        <p>col-{k}</p>
      </SubpageLane>
      <SubpageLane data-testid="sheet">
        <button>open-{k}</button>
        <h1>title-{k}</h1>
      </SubpageLane>
    </SubpageTransition>
  );
}
const panes = (id: string) => screen.getByTestId(id).querySelectorAll('[data-subpage-pane]');
function reduce(on: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('reduce'), addEventListener() {}, removeEventListener() {} }));
}

describe('SubpageTransition', () => {
  it('idle: one pane per lane, no animation, nothing inert', () => {
    render(<Page k="list" />);
    expect(panes('sheet')).toHaveLength(1);
    expect(panes('sheet')[0].className).not.toContain('animate-');
    expect(document.querySelector('[inert]')).toBeNull();
  });

  it('in: both panes mount, old is inert + aria-hidden, lanes slide from their own side, then the old pane goes', () => {
    const onExited = vi.fn();
    const { rerender } = render(<Page k="list" onExited={onExited} />);
    rerender(<Page k="a" dir="in" onExited={onExited} />);
    const sheet = panes('sheet');
    expect(sheet).toHaveLength(2);
    expect(sheet[0].getAttribute('inert')).toBe('');
    expect(sheet[0].getAttribute('aria-hidden')).toBe('true');
    expect(sheet[0].className).toContain('animate-sub-drift-l');
    expect(sheet[1].className).toContain('animate-sub-in-r');
    expect(panes('col')[1].className).toContain('animate-sub-in-l');
    expect(panes('col')[0].className).toContain('animate-sub-drift-r');
    expect(screen.getByTestId('sheet').getAttribute('data-state')).toBe('running');
    act(() => void vi.advanceTimersByTime(239));
    expect(panes('sheet')).toHaveLength(2);
    act(() => void vi.advanceTimersByTime(200));
    expect(panes('sheet')).toHaveLength(1);
    expect(screen.queryByText('open-list')).toBeNull();
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it('out: the detail leaves to its side and the list settles back', () => {
    const { rerender } = render(<Page k="a" />);
    rerender(<Page k="list" dir="out" />);
    const sheet = panes('sheet');
    expect(sheet[0].className).toContain('animate-sub-out-r');
    expect(sheet[1].className).toContain('animate-sub-back-l');
  });

  it('caller className cannot unclip or move the lane', () => {
    const { rerender } = render(<Page k="list" />);
    rerender(<Page k="a" />);
    const col = screen.getByTestId('col');
    expect(col.className).toContain('data-[state=running]:overflow-hidden');
    expect(col.className).toContain('grid');
  });

  it('moves focus to the new heading, and back to the opener on out', () => {
    const { rerender } = render(<Page k="list" />);
    screen.getByText('open-list').focus();
    rerender(<Page k="a" />);
    expect(document.activeElement).toBe(screen.getByText('title-a'));
    act(() => void vi.advanceTimersByTime(500));
    rerender(<Page k="list" dir="out" />);
    expect(document.activeElement?.textContent).toBe('open-list');
  });

  it('interrupted: rapid navigation leaves one current pane and at most one leaving pane', () => {
    const onExited = vi.fn();
    const { rerender } = render(<Page k="list" onExited={onExited} />);
    rerender(<Page k="a" onExited={onExited} />);
    act(() => void vi.advanceTimersByTime(100));
    rerender(<Page k="b" onExited={onExited} />);
    rerender(<Page k="list" dir="out" onExited={onExited} />);
    expect(panes('sheet').length).toBeLessThanOrEqual(2);
    expect(screen.getAllByText(/^open-/)).toHaveLength(2);
    act(() => void vi.advanceTimersByTime(1000));
    expect(panes('sheet')).toHaveLength(1);
    expect(screen.queryByText('title-a')).toBeNull();
    expect(screen.queryByText('title-b')).toBeNull();
    expect(onExited).toHaveBeenCalledTimes(1);
  });

  it('a pane that leaves and returns quickly is no longer inert', () => {
    const { rerender } = render(<Page k="list" />);
    rerender(<Page k="a" />);
    rerender(<Page k="list" dir="out" />);
    act(() => void vi.advanceTimersByTime(500));
    expect(document.querySelector('[inert]')).toBeNull();
    expect(screen.getByText('open-list').closest('[data-subpage-pane]')!.hasAttribute('aria-hidden')).toBe(false);
  });

  it('animationend finishes early, only when every lane has ended', () => {
    const { rerender, container } = render(<Page k="list" />);
    rerender(<Page k="a" />);
    const cur = (id: string) => screen.getByTestId(id).querySelector('[data-subpage-pane="current"]')!;
    act(() => {
      cur('col').dispatchEvent(new Event('animationend', { bubbles: true }));
    });
    expect(container.querySelectorAll('[data-subpage-pane="leaving"]').length).toBe(2);
    act(() => {
      cur('sheet').dispatchEvent(new Event('animationend', { bubbles: true }));
    });
    expect(container.querySelectorAll('[data-subpage-pane="leaving"]').length).toBe(0);
  });

  it('reduced motion: no old pane, 140ms fade, onExited after the fade', () => {
    reduce(true);
    const onExited = vi.fn();
    const { rerender } = render(<Page k="list" onExited={onExited} />);
    rerender(<Page k="a" onExited={onExited} />);
    expect(panes('sheet')).toHaveLength(1);
    expect(panes('sheet')[0].className).toContain('animate-sub-fade');
    expect(panes('sheet')[0].className).not.toContain('animate-sub-in');
    act(() => void vi.advanceTimersByTime(300));
    expect(onExited).toHaveBeenCalledTimes(1);
    expect(panes('sheet')[0].className).not.toContain('animate-');
  });

  it('restores scroll when a pane comes back', () => {
    const { rerender } = render(<Page k="list" />);
    const list = panes('sheet')[0] as HTMLElement;
    list.scrollTop = 120;
    fireEvent.scroll(list);
    rerender(<Page k="a" />);
    act(() => void vi.advanceTimersByTime(500));
    rerender(<Page k="list" dir="out" />);
    const back = screen.getByTestId('sheet').querySelector('[data-subpage-pane="current"]') as HTMLElement;
    expect(back).not.toBe(list);
    expect(back.scrollTop).toBe(120);
  });

  it('clears timers on unmount', () => {
    const onExited = vi.fn();
    const { rerender, unmount } = render(<Page k="list" onExited={onExited} />);
    rerender(<Page k="a" onExited={onExited} />);
    unmount();
    act(() => void vi.advanceTimersByTime(1000));
    expect(onExited).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a lane outside the transition throws a clear error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<SubpageLane>x</SubpageLane>)).toThrow(/inside SubpageTransition/);
    spy.mockRestore();
  });
});
