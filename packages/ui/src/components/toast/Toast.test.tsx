// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Toaster } from './Toaster';
import { clearToasts, toast, useToasts } from './toastStore';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); clearToasts(); vi.useRealTimers(); });

const show = (fn: () => void) => act(() => { fn(); });
const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const region = () => screen.getByRole('status');

describe('Toast', () => {
  it('is one permanent polite status region, empty until a toast shows', () => {
    render(<Toaster />);
    expect(region().getAttribute('aria-live')).toBe('polite');
    expect(region().textContent).toBe('');
    show(() => toast.success('Platform added.'));
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(region().textContent).toBe('Platform added.');
  });

  it('is portalled to body, outside the app tree', () => {
    const { container } = render(<Toaster />);
    show(() => toast.success('Saved.'));
    expect(container.querySelector('[role=status]')).toBeNull();
    expect(region().parentElement).toBe(document.body);
  });

  it('auto-dismisses at 5000ms, not before', () => {
    render(<Toaster />);
    show(() => toast.success('Saved.'));
    tick(4999);
    expect(region().textContent).toBe('Saved.');
    tick(1);
    expect(region().textContent).toBe('');
  });

  it('duration 0 stays until dismissed', () => {
    render(<Toaster />);
    show(() => toast.undo('Kept.', () => {}, { duration: 0 }));
    tick(60000);
    expect(region().textContent).toContain('Kept.');
  });

  it('pauses while hovered and resumes with at least 2s left', () => {
    render(<Toaster />);
    show(() => toast.undo('Saved.', () => {}));
    const item = screen.getByRole('button', { name: 'Undo' }).parentElement!;
    tick(4500);
    fireEvent.pointerEnter(item);
    tick(30000);
    expect(region().textContent).toContain('Saved.');
    fireEvent.pointerLeave(item);
    tick(1999);
    expect(region().textContent).toContain('Saved.');
    tick(1);
    expect(region().textContent).toBe('');
  });

  it('pauses while focus is inside and resumes on blur', () => {
    render(<Toaster />);
    show(() => toast.undo('Saved.', () => {}));
    const btn = screen.getByRole('button', { name: 'Undo' });
    act(() => btn.focus());
    tick(20000);
    expect(region().textContent).toContain('Saved.');
    act(() => btn.blur());
    tick(5000);
    expect(region().textContent).toBe('');
  });

  it('hover leaving while focus is still inside keeps it open', () => {
    render(<Toaster />);
    show(() => toast.undo('Saved.', () => {}));
    const btn = screen.getByRole('button', { name: 'Undo' });
    const item = btn.parentElement!;
    act(() => btn.focus());
    fireEvent.pointerEnter(item);
    fireEvent.pointerLeave(item);
    tick(20000);
    expect(region().textContent).toContain('Saved.');
  });

  it('one at a time: a new toast replaces the one showing and restarts the clock', () => {
    render(<Toaster />);
    show(() => toast.success('First.'));
    tick(3000);
    show(() => toast.success('Second.'));
    expect(region().textContent).toBe('Second.');
    tick(4999);
    expect(region().textContent).toBe('Second.');
    tick(1);
    expect(region().textContent).toBe('');
  });

  it('Undo fires once, closes the toast, and a second click does nothing', () => {
    const undo = vi.fn();
    render(<Toaster />);
    show(() => toast.undo('Saved.', undo));
    const btn = screen.getByRole('button', { name: 'Undo' });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(undo).toHaveBeenCalledTimes(1);
    expect(region().textContent).toBe('');
    tick(10000);
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it('a toast that times out never calls Undo', () => {
    const undo = vi.fn();
    render(<Toaster />);
    show(() => toast.undo('Saved.', undo));
    tick(5000);
    expect(undo).not.toHaveBeenCalled();
  });

  it('Esc dismisses when nothing else is open', () => {
    render(<Toaster />);
    show(() => toast.success('Saved.'));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(region().textContent).toBe('');
  });

  it('Esc with focus on Undo dismisses without running it', () => {
    const undo = vi.fn();
    render(<Toaster />);
    show(() => toast.undo('Saved.', undo));
    const btn = screen.getByRole('button', { name: 'Undo' });
    act(() => btn.focus());
    fireEvent.keyDown(btn, { key: 'Escape' });
    expect(region().textContent).toBe('');
    expect(undo).not.toHaveBeenCalled();
  });

  it('Esc leaves the toast when a dialog or menu is open (they take Esc first)', () => {
    render(<><Toaster /><div role="dialog" aria-label="Confirm" /></>);
    show(() => toast.success('Saved.'));
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(region().textContent).toBe('Saved.');
  });

  it('shows the Leda tile only when asked', () => {
    render(<Toaster />);
    show(() => toast.success('Plain.'));
    expect(screen.queryByRole('img', { name: 'Leda' })).toBeNull();
    show(() => toast.undo('Saved to memory.', () => {}, { leda: true }));
    expect(screen.getByRole('img', { name: 'Leda' })).toBeTruthy();
  });

  it('keeps the legacy shape: string, title + description, custom action label', () => {
    const onClick = vi.fn();
    render(<Toaster />);
    show(() => toast('Plain string'));
    expect(region().textContent).toBe('Plain string');
    show(() => toast({ title: 'Export ready.', description: 'Download it.', action: { label: 'Download', onClick } }));
    expect(region().textContent).toContain('Export ready. Download it.');
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('puts the full text in the tooltip (the line is truncated) and the live region', () => {
    const long = 'Data source connected. '.repeat(10).trim();
    render(<Toaster />);
    show(() => toast.success(long));
    expect(region().textContent).toBe(long);
    expect(document.querySelector(`[title="${long}"]`)).toBeTruthy();
  });

  it('ink surface that inverts, 13px, 5px radius, float shadow, no inline style on the toast', () => {
    render(<Toaster />);
    show(() => toast.undo('Saved.', () => {}));
    const item = screen.getByRole('button', { name: 'Undo' }).parentElement!;
    for (const c of ['bg-text', 'text-surface', 'text-ui', 'rounded-control', 'shadow-float']) expect(item.className).toContain(c);
    expect(item.getAttribute('style')).toBeNull();
  });

  it('phone: 44px bar and 44px Undo target; reduced motion removes the transition', () => {
    render(<Toaster />);
    show(() => toast.undo('Saved.', () => {}));
    const btn = screen.getByRole('button', { name: 'Undo' });
    expect(btn.className).toContain('max-[640px]:min-h-[44px]');
    expect(btn.className).toContain('max-[640px]:min-w-[44px]');
    const item = btn.parentElement!;
    expect(item.className).toContain('max-[640px]:min-h-[44px]');
    expect(item.className).toContain('motion-reduce:transition-none');
  });

  it("caller className cannot move the toast: component positioning classes win", () => {
    render(<Toaster className="left-0 bottom-0 static w-10 mt-4" />);
    const cls = region().className;
    expect(cls).toContain('fixed');
    expect(cls).toContain('left-[var(--toast-x,16px)]');
    expect(cls).not.toMatch(/(^| )left-0( |$)/);
    expect(cls).not.toMatch(/(^| )static( |$)/);
    expect(cls).toContain('mt-4');
  });

  it('anchors to the sheet: left = sheet left + 24, bottom = sheet bottom + 16', () => {
    document.body.insertAdjacentHTML('beforeend', '<main id="sheet"></main>');
    const main = document.getElementById('sheet')!;
    main.getBoundingClientRect = () => ({ left: 512, right: 1200, top: 8, bottom: 700, width: 688, height: 692, x: 512, y: 8, toJSON() {} });
    Object.defineProperty(window, 'innerHeight', { value: 734, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
    render(<Toaster />);
    show(() => toast.success('Saved.'));
    expect(region().style.getPropertyValue('--toast-x')).toBe('536px');
    expect(region().style.getPropertyValue('--toast-b')).toBe('50px');
    main.remove();
  });

  it('clears its timer on unmount and ignores a late timeout', () => {
    const { unmount } = render(<Toaster />);
    show(() => toast.success('Saved.'));
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(() => tick(10000)).not.toThrow();
  });

  it('useToasts never holds more than one', () => {
    let n = 0;
    function Probe() { n = useToasts().length; return null; }
    render(<Probe />);
    show(() => { toast.success('a'); toast.success('b'); toast.success('c'); });
    expect(n).toBe(1);
  });
});
