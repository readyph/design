// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { AskLedaBar, ASK_LEDA_TIMING as T } from './AskLedaBar';

const halo = (c: HTMLElement) => c.querySelectorAll('[data-halo]').length;
const setVisibility = (s: 'hidden' | 'visible') => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s });
  document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(() => { vi.useFakeTimers(); setVisibility('visible'); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('AskLedaBar semantics', () => {
  it('is a button named for what it does, with decorative extras hidden', () => {
    render(<AskLedaBar />);
    expect(screen.getByRole('button', { name: 'Ask Leda or tell it what to do' })).toBeTruthy();
    expect(document.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
  it('uses the scope in name and placeholder', () => {
    render(<AskLedaBar scope="Stockroom" />);
    expect(screen.getByRole('button', { name: 'Ask Leda about Stockroom' })).toBeTruthy();
  });
  it('click, Cmd/Ctrl+K and / call onOpen; / is ignored while typing', () => {
    const onOpen = vi.fn();
    render(<><AskLedaBar onOpen={onOpen} /><input aria-label="x" /></>);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    fireEvent.keyDown(document.body, { key: 'K', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: '/' });
    fireEvent.keyDown(screen.getByLabelText('x'), { key: '/' });
    expect(onOpen.mock.calls.map((c) => c[0])).toEqual(['click', 'shortcut', 'shortcut', 'slash']);
  });
  it('removes its key listener on unmount and honours shortcuts={false}', () => {
    const onOpen = vi.fn();
    const { unmount } = render(<AskLedaBar onOpen={onOpen} />);
    unmount();
    fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    render(<AskLedaBar onOpen={onOpen} shortcuts={false} />);
    fireEvent.keyDown(document.body, { key: 'k', metaKey: true });
    expect(onOpen).not.toHaveBeenCalled();
  });
  it('caller className cannot override the geometry', () => {
    const { container } = render(<AskLedaBar className="w-10 h-2 ml-4" />);
    const outer = container.firstElementChild as HTMLElement;
    const wrap = outer.firstElementChild as HTMLElement;
    expect(outer.className).toContain('ml-4');
    expect(wrap.className).toContain('w-leda-w');
    expect(wrap.className).not.toContain('w-leda-w-overview');
    expect(wrap.className).not.toMatch(/(^| )w-10( |$)/);
    expect(screen.getByRole('button').className).toContain('h-[var(--ctl-leda-bar)]');
  });
  it('phone: 44px target, label and kbd hidden by class', () => {
    const { container } = render(<AskLedaBar />);
    expect((container.querySelector('[data-ask-leda]') as HTMLElement).className).toContain('max-[640px]:w-[var(--ctl-touch)]');
    expect(screen.getByRole('button').className).toContain('max-[640px]:h-[var(--ctl-touch)]');
  });
});

describe('AskLedaBar overview shrinks in any parent', () => {
  it('has no fixed width: full width capped at the token, outer box full width', () => {
    const { container } = render(<AskLedaBar variant="overview" className="w-10" />);
    const outer = container.firstElementChild as HTMLElement;
    const wrap = container.querySelector('[data-ask-leda]') as HTMLElement;
    expect(wrap.className).toContain('w-full');
    expect(wrap.className).toContain('max-w-leda-w-overview');
    expect(wrap.className).not.toMatch(/(^| )w-leda-w-overview( |$)/);
    expect(outer.className).toContain('w-full');
    expect(outer.className).not.toContain('shrink-0');
  });
  it('bar variant keeps its fixed width', () => {
    const { container } = render(<AskLedaBar />);
    expect((container.firstElementChild as HTMLElement).className).toContain('shrink-0');
    expect((container.querySelector('[data-ask-leda]') as HTMLElement).className).not.toContain('w-full');
  });
  it('hides the kbd at 640px and below on both variants', () => {
    for (const variant of ['bar', 'overview'] as const) {
      const { container, unmount } = render(<AskLedaBar variant={variant} />);
      expect(container.querySelector('kbd')!.className).toContain('max-[640px]:hidden');
      unmount();
    }
  });
});

describe('AskLedaBar shimmer schedule', () => {
  it('first pass at 1.2s, lasts 2.8s, repeats every 17s', () => {
    const { container } = render(<AskLedaBar />);
    expect(halo(container)).toBe(0);
    act(() => { vi.advanceTimersByTime(T.first - 1); });
    expect(halo(container)).toBe(0);
    act(() => { vi.advanceTimersByTime(1); });
    expect(halo(container)).toBe(2);
    act(() => { vi.advanceTimersByTime(T.pass - 1); });
    expect(halo(container)).toBe(2);
    act(() => { vi.advanceTimersByTime(1); });
    expect(halo(container)).toBe(0);
    act(() => { vi.advanceTimersByTime(T.every - T.pass - 1); });
    expect(halo(container)).toBe(0);
    act(() => { vi.advanceTimersByTime(1); });
    expect(halo(container)).toBe(2);
  });
  it('plays once after 10s idle, and activity re-arms the idle timer', () => {
    const { container } = render(<AskLedaBar />);
    act(() => { vi.advanceTimersByTime(T.first + T.pass); });
    fireEvent.pointerMove(window);
    act(() => { vi.advanceTimersByTime(T.idle - 1); });
    expect(halo(container)).toBe(0);
    act(() => { vi.advanceTimersByTime(1); });
    expect(halo(container)).toBe(2);
  });
  it('is skipped while hidden and restarts at 1.2s when visible again', () => {
    const { container } = render(<AskLedaBar />);
    act(() => { setVisibility('hidden'); });
    act(() => { vi.advanceTimersByTime(60000); });
    expect(halo(container)).toBe(0);
    act(() => { setVisibility('visible'); });
    act(() => { vi.advanceTimersByTime(T.first); });
    expect(halo(container)).toBe(2);
  });
  it('is skipped while paused (palette open) and restarts after', () => {
    const { container, rerender } = render(<AskLedaBar paused />);
    act(() => { vi.advanceTimersByTime(60000); });
    expect(halo(container)).toBe(0);
    rerender(<AskLedaBar paused={false} />);
    act(() => { vi.advanceTimersByTime(T.first); });
    expect(halo(container)).toBe(2);
    rerender(<AskLedaBar paused />);
    expect(halo(container)).toBe(0);
  });
  it('shine="hold" never plays', () => {
    const { container } = render(<AskLedaBar shine="hold" />);
    act(() => { vi.advanceTimersByTime(60000); });
    expect(halo(container)).toBe(0);
  });
  it('clears timers and listeners on unmount', () => {
    const { unmount } = render(<AskLedaBar />);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('AskLedaBar utilities exist in the preset', () => {
  it('animations, halo background and overview width are generated', () => {
    const preset = readFileSync(`${process.cwd()}/preset.cjs`, 'utf8');
    for (const k of ['"halo-spin"', '"halo-fade"', '"halo-fade-reduced"', '"halo"', '"leda-w-overview"']) expect(preset).toContain(k);
    expect(preset).toMatch(/maxWidth[\s\S]*"leda-w-overview"/);
  });
});
