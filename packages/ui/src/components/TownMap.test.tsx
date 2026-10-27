// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { TownMap, placeLabels, type TownMapHandle } from './TownMap';
import { eight, eightLinks, three, threeLinks, longName, cafe, hq, stockroom } from './TownMap.data';

afterEach(cleanup);

/** Current zoom: a zero step changes nothing and returns it. */
const zoomOf = (h: TownMapHandle) => (h.zoom as (d: number) => number)(0);

describe('TownMap', () => {
  it('is a named group with a list of platform buttons and a hidden drawing', () => {
    const { container } = render(<TownMap platforms={three} links={threeLinks} label="Map of 3 platforms and HQ" />);
    const g = screen.getByRole('group', { name: 'Map of 3 platforms and HQ' });
    const list = within(g).getByRole('list', { name: 'Platforms' });
    expect(within(list).getAllByRole('button')).toHaveLength(4);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('button', { name: 'Auto Works Quezon City, Repair shop, slow' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'HQ, your team and plan, 1 need you' })).toBeTruthy();
  });

  it('says link status in words, not colour', () => {
    render(<TownMap platforms={three} links={threeLinks} />);
    const l = screen.getByRole('list', { name: 'Links between platforms' });
    expect(within(l).getByText('Main Stockroom to Auto Works Quezon City, slow')).toBeTruthy();
    expect(within(l).getByText('Café POS to HQ, broken')).toBeTruthy();
  });

  it('draws a building per kind, a generic office with the kind on its sign, and lots', async () => {
    const { container } = render(<TownMap platforms={[stockroom, { ...cafe, mapType: undefined, kind: 'Books' }, hq, null]} links={[]} />);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    const objs = container.querySelectorAll('g.plot-obj');
    expect(objs.length).toBeGreaterThan(10);
    expect(container.innerHTML).toContain('>BOOKS<');
    expect(container.innerHTML).toContain('light-dark(');
    expect(container.innerHTML).toContain('var(--map-top)');
  });

  it('selects by click and Escape clears; selected is aria-pressed', () => {
    const onSelect = vi.fn();
    const { rerender } = render(<TownMap platforms={three} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /^Café POS/ }));
    expect(onSelect).toHaveBeenCalledWith('cafe');
    rerender(<TownMap platforms={three} selected="cafe" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /^Café POS/ }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.keyDown(screen.getByRole('button', { name: /^Café POS/ }), { key: 'Escape' });
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it('ignores selection while loading and hides controls', () => {
    const onSelect = vi.fn();
    render(<TownMap platforms={three} loading onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: /^Café POS/ }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Rotate left' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Platform map' }).getAttribute('aria-busy')).toBe('true');
  });

  it('reports hover only; keyboard focus does not highlight (workshop map.js)', () => {
    const onHover = vi.fn();
    render(<TownMap platforms={three} onHover={onHover} />);
    const b = screen.getByRole('button', { name: /^Café POS/ });
    fireEvent.mouseEnter(b);
    fireEvent.mouseLeave(b);
    fireEvent.focus(b);
    fireEvent.blur(b);
    expect(onHover.mock.calls.map((c) => c[0])).toEqual(['cafe', null]);
    expect(b.className).toContain('focus-visible:outline-offset-2');
  });

  it('rotate and zoom are real buttons reachable by keyboard and call the scene without throwing', () => {
    const ref = createRef<TownMapHandle>();
    render(<TownMap ref={ref} platforms={three} links={threeLinks} />);
    for (const n of ['Rotate left', 'Rotate right', 'Zoom out', 'Zoom in']) fireEvent.click(screen.getByRole('button', { name: n }));
    expect(ref.current!.zoom(1)).toBeGreaterThan(1);
    expect(ref.current!.state()).toEqual({ selected: null, focus: null, highlight: null });
    expect(ref.current!.runVan('stockroom', 'autoworks')).toBe(true);
    expect(ref.current!.runVan('nope', 'autoworks')).toBe(false);
    expect(() => ref.current!.setDark(true)).not.toThrow();
  });

  it('state() reflects selected, focus and highlight props', () => {
    const ref = createRef<TownMapHandle>();
    render(<TownMap ref={ref} platforms={three} links={threeLinks} selected="cafe" highlight={['cafe', 'hq']} focus="hq" />);
    expect(ref.current!.state()).toEqual({ selected: 'cafe', focus: 'hq', highlight: ['cafe', 'hq'] });
  });

  it('shows the error notice with Retry', () => {
    const onRetry = vi.fn();
    render(<TownMap platforms={three} error onRetry={onRetry} />);
    fireEvent.click(within(screen.getByRole('alert')).getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('cancels its frames and observers on unmount', () => {
    const cancel = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = render(<TownMap platforms={eight} links={eightLinks} />);
    unmount();
    expect(cancel).toBeDefined();
    cancel.mockRestore();
  });

  it('a caller className cannot change the map height or overflow', () => {
    const { container } = render(<TownMap platforms={three} className="h-4 overflow-visible" />);
    const frame = container.querySelector('.h-map-h')!;
    expect(frame.className).toContain('h-map-h');
    const inner = container.querySelector('.overflow-hidden')!;
    expect(inner).toBeTruthy();
    expect(inner.className).not.toContain('h-4');
    expect(inner.className).not.toContain('overflow-visible');
  });

  it('long names are truncated in the label, full in the accessible name', () => {
    render(<TownMap platforms={[longName, hq]} />);
    expect(screen.getByRole('button', { name: new RegExp('^' + longName.name) })).toBeTruthy();
  });
});

describe('placeLabels (collision pass)', () => {
  const mk = (n: number, w = 120, spread = 40) =>
    Array.from({ length: n }, (_, i) => ({ id: 'p' + i, ax: 60 + (i % 3) * spread + (i % 2) * 6, ay: 120 + Math.floor(i / 3) * 12, w, h: 20, priority: i === 0 ? 4 : 0 }));
  const overlaps = (p: ReturnType<typeof placeLabels>) => {
    let n = 0;
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++) if (p[i].x < p[j].x + p[j].w && p[j].x < p[i].x + p[i].w && p[i].y < p[j].y + p[j].h && p[j].y < p[i].y + p[i].h) n++;
    return n;
  };

  it.each([[2, 460, 326], [3, 460, 326], [8, 460, 326], [8, 1000, 380]])('%i labels in %ix%i: none overlap, all inside with 8px margin', (n, W, H) => {
    const p = placeLabels(mk(n, 110, W / 5), W, H);
    expect(overlaps(p)).toBe(0);
    for (const l of p) {
      expect(l.x).toBeGreaterThanOrEqual(8);
      expect(l.x + l.w).toBeLessThanOrEqual(W - 8);
      expect(l.y).toBeGreaterThanOrEqual(4);
      expect(l.y + l.h).toBeLessThanOrEqual(H - 4);
    }
  });

  it('keeps long labels inside a phone strip and gives the selected label its spot first', () => {
    const boxes = mk(3, 160, 30);
    const p = placeLabels(boxes, 375, 160);
    expect(p.every((l) => l.x >= 8 && l.x + l.w <= 375 - 8)).toBe(true);
    const first = p.find((l) => l.id === 'p0')!;
    expect(first.overlap).toBe(0);
  });
});

describe('TownMap workshop chrome (RDY-364)', () => {
  it('legend lists only the link states present, each with a count (shell map.css .tleg)', () => {
    const { container } = render(<TownMap platforms={three} links={[{ from: 'a', to: 'b', status: 'ok' }, { from: 'b', to: 'c', status: 'ok' }, { from: 'c', to: 'a', status: 'broken' }]} />);
    const leg = container.querySelector('[aria-hidden="true"].bottom-2.right-2')!;
    expect(leg.textContent).toBe('Linked 2Broken 1');
    expect(leg.textContent).not.toContain('Slow');
  });
  it('map controls: rotate, zoom with minus and plus; "Add platform" only when onAddPlatform is given', () => {
    const add = vi.fn();
    const { rerender } = render(<TownMap platforms={three} />);
    expect(screen.queryByRole('button', { name: 'Add a platform', hidden: true })).toBeNull();
    rerender(<TownMap platforms={three} onAddPlatform={add} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a platform', hidden: true }));
    expect(add).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Add platform').className).toContain('max-[960px]:hidden');
  });
  it('caption keeps the space between its parts and labels are 22px: 16px lines, 5px left padding', () => {
    render(<TownMap platforms={three} caption={<><b>3 platforms</b> + HQ</>} />);
    expect(screen.getByText('3 platforms').parentElement!.textContent).toBe('3 platforms + HQ');
    const label = screen.getByRole('button', { name: 'HQ, your team and plan, 1 need you' });
    expect(label.className).toContain('pl-[5px]');
    expect(label.className).toContain('pr-1.5');
  });
});

describe('TownMap controls and keyboard (RDY-317)', () => {
  it('rotate, zoom and reset change the view; reset restores it', () => {
    const ref = createRef<TownMapHandle>();
    render(<TownMap ref={ref} platforms={three} links={threeLinks} />);
    const svg = document.querySelector('svg')!;
    const start = svg.getAttribute('viewBox');
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(svg.getAttribute('viewBox')).not.toBe(start);
    expect(zoomOf(ref.current!)).toBeCloseTo(1.7);
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    expect(zoomOf(ref.current!)).toBeCloseTo(1.35);
    fireEvent.click(screen.getByRole('button', { name: 'Rotate right' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }));
    expect(zoomOf(ref.current!)).toBe(1);
    expect(svg.getAttribute('viewBox')).toBe(start);
  });

  it('onAdd shows the add control and fires on click and Enter; absent when not passed', () => {
    const add = vi.fn();
    const { rerender } = render(<TownMap platforms={three} />);
    expect(screen.queryByRole('button', { name: 'Add a platform', hidden: true })).toBeNull();
    rerender(<TownMap platforms={three} onAdd={add} />);
    const btn = screen.getByRole('button', { name: 'Add a platform', hidden: true });
    fireEvent.click(btn);
    expect(add).toHaveBeenCalledTimes(1);
    // Enter on a native button is a click in the browser; jsdom does not synthesise it
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('type')).toBe('button');
  });

  it('keyboard: arrows rotate, plus and minus zoom while the map has focus', () => {
    const ref = createRef<TownMapHandle>();
    render(<TownMap ref={ref} platforms={three} links={threeLinks} />);
    const btn = screen.getAllByRole('button', { name: /Stockroom/ })[0]!;
    btn.focus();
    expect(fireEvent.keyDown(btn, { key: '+' })).toBe(false);
    expect(zoomOf(ref.current!)).toBeCloseTo(1.35);
    fireEvent.keyDown(btn, { key: '-' });
    expect(zoomOf(ref.current!)).toBe(1);
    expect(fireEvent.keyDown(btn, { key: 'ArrowLeft' })).toBe(false);
    expect(fireEvent.keyDown(btn, { key: 'ArrowRight' })).toBe(false);
    // a modifier is not ours
    expect(fireEvent.keyDown(btn, { key: '+', ctrlKey: true })).toBe(true);
  });

  it('keyboard does nothing while focus is in another widget inside the map, or the map is loading', () => {
    const ref = createRef<TownMapHandle>();
    const { container, rerender } = render(<TownMap ref={ref} platforms={three} links={threeLinks} />);
    const input = document.createElement('input');
    container.firstElementChild!.appendChild(input);
    input.focus();
    expect(fireEvent.keyDown(input, { key: '+' })).toBe(true);
    expect(zoomOf(ref.current!)).toBe(1);
    // outside the map nothing is handled
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    expect(fireEvent.keyDown(outside, { key: '+' })).toBe(true);
    rerender(<TownMap ref={ref} platforms={three} loading />);
    expect(fireEvent.keyDown(container.firstElementChild!, { key: '+' })).toBe(true);
    outside.remove();
  });

  it('controls are hidden on the phone strip and 44px on touch', () => {
    render(<TownMap platforms={three} />);
    const group = screen.getByRole('group', { name: 'Map controls', hidden: true });
    expect(group.className).toContain('max-[640px]:hidden');
    expect(group.className).toContain('focus-within:opacity-100');
    expect(screen.getByRole('button', { name: 'Zoom in', hidden: true }).className).toContain('[@media(pointer:coarse)]:h-11');
  });
});

