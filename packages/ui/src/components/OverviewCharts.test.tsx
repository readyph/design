import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { OverviewCharts } from './OverviewCharts';
import { WeekChart, chartNumberFormat, niceTicks } from './WeekChart';
import { autoWorks, cafe, days, failed, hardware, noHistory, stockroom } from './OverviewCharts.data';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const setWidth = (w: number) => Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => w });

describe('niceTicks', () => {
  it('includes zero and tops out above the largest value', () => {
    const t = niceTicks(0, 31200, 4);
    expect(t[0]).toBe(0);
    expect(t[t.length - 1]).toBeGreaterThan(31200);
  });
  it('copes with all zero, all equal, negatives and huge values', () => {
    expect(niceTicks(0, 0)).toEqual([0, 1]);
    expect(niceTicks(0, 40, 4).at(-1)).toBeGreaterThan(40);
    expect(niceTicks(-40, 120, 4)[0]).toBeLessThanOrEqual(-40);
    expect(niceTicks(0, 9.9e9, 3).at(-1)).toBeGreaterThan(9.9e9);
  });
});

describe('chartNumberFormat', () => {
  it('takes currency and locale from props', () => {
    expect(chartNumberFormat({ locale: 'en-PH', currency: 'PHP' })(3200)).toContain('3,200');
    expect(chartNumberFormat({ locale: 'en-US', currency: 'USD' })(3200)).toBe('$3,200');
    expect(chartNumberFormat({ locale: 'en-US', compact: true })(12400)).toBe('12.4K');
  });
});

describe('WeekChart', () => {
  const base = { title: 'Revenue', labels: days, values: [10, 20, null, 15, 18, 30, 12], format: (v: number) => `${v} pts` };
  it('is one image with a summary, plus a table of the values', () => {
    const { getByRole, container } = render(<WeekChart {...base} />);
    expect(getByRole('img').getAttribute('aria-label')).toContain('Sun 18 Closed');
    expect(getByRole('img').getAttribute('aria-label')).toContain('Wed 21 30 pts');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(7);
    expect(container.querySelector('caption')!.textContent).toBe('Revenue');
  });
  it('highlights the last day in chart-1 and the others in chart-muted, from tokens only', () => {
    const { container } = render(<WeekChart {...base} />);
    expect(container.querySelectorAll('rect.fill-chart-1')).toHaveLength(1);
    expect(container.querySelectorAll('rect.fill-chart-muted')).toHaveLength(5);
    expect(container.innerHTML).not.toMatch(/style=|#[0-9a-f]{3,6}\b/i);
  });
  it('writes the value on the highlighted bar and gives forced-colors fallbacks', () => {
    const { container } = render(<WeekChart {...base} />);
    expect(container.innerHTML).toContain('forced-colors:fill-[Highlight]');
    expect(container.innerHTML).toContain('forced-colors:stroke-[CanvasText]');
    expect([...container.querySelectorAll('svg text')].some((t) => t.textContent === '12 pts')).toBe(true);
  });
  it('reads each day by keyboard and clears on Escape', () => {
    const { getByRole, container } = render(<WeekChart {...base} />);
    const g = getByRole('group');
    expect(g.tabIndex).toBe(0);
    fireEvent.keyDown(g, { key: 'ArrowRight' });
    expect(container.textContent).toContain('Fri 16: 10 pts');
    fireEvent.keyDown(g, { key: 'End' });
    expect(container.querySelector('[aria-live]')!.textContent).toBe('Thu 22: 12 pts');
    expect(container.querySelectorAll('svg g[pointer-events=none]')).toHaveLength(1);
    fireEvent.keyDown(g, { key: 'Escape' });
    expect(container.querySelectorAll('svg g[pointer-events=none]')).toHaveLength(0);
  });
  it('handles empty, zero and negative data without NaN', () => {
    for (const values of [[], [0, 0, 0], [5, -3, 2]]) {
      const { container } = render(<WeekChart title="x" labels={values.map((_, i) => `d${i}`)} values={values} />);
      expect(container.innerHTML).not.toContain('NaN');
      cleanup();
    }
  });
  it('diverging draws In above and Out below and lists both in the table', () => {
    const { container, getByText } = render(<WeekChart title="Stock" kind="diverging" labels={['a', 'b']} up={[5, 3]} down={[2, 4]} />);
    expect(container.querySelectorAll('rect.fill-chart-1')).toHaveLength(4);
    getByText(/In above the line/);
    expect(container.querySelectorAll('thead th')).toHaveLength(3);
  });
  it('thins x labels to fit a narrow width but keeps the last day', () => {
    setWidth(200);
    const { container } = render(<WeekChart {...base} />);
    const xs = [...container.querySelectorAll('svg text')].map((t) => t.textContent);
    expect(xs).toContain('Thu 22');
    expect(xs).not.toContain('Wed 21');
  });
  it('disconnects its ResizeObserver', () => {
    const disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnect; });
    render(<WeekChart {...base} />).unmount();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
  it('merges className on the wrapper only', () => {
    const { container } = render(<WeekChart {...base} className="mt-4" />);
    expect((container.firstChild as HTMLElement).className).toContain('mt-4');
  });
});

describe('missing and non-finite data', () => {
  const bad = [NaN, 5, null, Infinity, -Infinity, undefined, 3] as unknown as (number | null)[];
  it('bars: writes No data / Closed as text and never prints NaN or Infinity', () => {
    const { container } = render(<WeekChart title="x" labels={['a', 'b', 'c', 'd', 'e', 'f', 'g']} values={bad} />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    const cells = [...container.querySelectorAll('tbody td')].map((t) => t.textContent);
    expect(cells).toEqual(['No data', '5', 'Closed', 'No data', 'No data', 'No data', '3']);
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain('a No data');
  });
  it('bars: Infinity does not stretch the scale', () => {
    const { container } = render(<WeekChart title="x" labels={['a', 'b']} values={[Infinity, 5]} />);
    const ticks = [...container.querySelectorAll('svg text')].map((t) => t.textContent);
    expect(ticks).not.toContain('Infinity');
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
  });
  it('diverging: non-finite magnitudes are missing, not zero-drawn, and read No data', () => {
    const { container, getByRole } = render(<WeekChart title="x" kind="diverging" labels={['a', 'b']} up={[NaN, 4]} down={[Infinity, undefined as unknown as number]} />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(container.querySelectorAll('rect.fill-chart-1')).toHaveLength(1);
    fireEvent.keyDown(getByRole('group'), { key: 'Home' });
    expect(container.textContent).toContain('In No data, Out No data');
  });
  it('share bar: non-finite parts get no segment and a dash in the legend; the total ignores them', () => {
    setWidth(1000);
    const { container } = render(<OverviewCharts platforms={[{ ...autoWorks, shares: [{ title: 'Jobs', total: NaN, parts: [{ label: 'A', value: NaN }, { label: 'B', value: 2 }, { label: 'C', value: Infinity }] }] }]} />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    const li = [...container.querySelectorAll('ul li')].map((l) => l.textContent);
    expect(li).toEqual(['A —', 'B 2', 'C —']);
    expect(container.querySelectorAll('svg[aria-hidden=true] rect')).toHaveLength(1);
  });
});

describe('announcements', () => {
  it('speaks only keyboard moves, never mouse hover, and is not the described-by target', () => {
    const { getByRole, container } = render(<WeekChart title="x" labels={['a', 'b']} values={[1, 2]} />);
    const svg = container.querySelector('svg')!;
    fireEvent.pointerMove(svg, { clientX: 100, clientY: 5 });
    expect(container.querySelector('[aria-live]')!.textContent).toBe('');
    expect(getByRole('group').getAttribute('aria-describedby')).toBeNull();
    fireEvent.keyDown(getByRole('group'), { key: 'ArrowRight' });
    expect(container.querySelector('[aria-live]')!.textContent).toBe('a: 1');
  });
});

describe('OverviewCharts', () => {
  it('shows the chart note under the figure in rows and stacked, and in the header in columns', () => {
    setWidth(1000);
    const { container, rerender } = render(<OverviewCharts platforms={[autoWorks, stockroom, cafe]} />);
    expect(screen.getAllByText('Closed Sundays')).toHaveLength(1);
    expect(container.querySelector('h4 + span')!.textContent).toBe('Closed Sundays');
    rerender(<OverviewCharts platforms={[autoWorks, stockroom, cafe, hardware]} />);
    expect(container.querySelector('h4 + span')).toBeNull();
    expect(screen.getAllByText('Closed Sundays')).toHaveLength(1);
  });
  it('sends focus to the heading after Retry only when focus was lost', () => {
    setWidth(1000);
    const p = { ...cafe, name: 'Lia', state: 'error' as const, onRetry: () => {} };
    const { rerender } = render(<OverviewCharts platforms={[p]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    (document.activeElement as HTMLElement).blur?.();
    rerender(<OverviewCharts platforms={[{ ...p, state: 'ready' }]} />);
    expect(document.activeElement?.tagName).toBe('H3');
  });
  it('leaves focus alone when the user moved elsewhere during the retry', () => {
    setWidth(1000);
    const p = { ...cafe, name: 'Lia', state: 'error' as const, onRetry: () => {} };
    const { rerender } = render(<><input aria-label="elsewhere" /><OverviewCharts platforms={[p]} /></>);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    screen.getByLabelText('elsewhere').focus();
    rerender(<><input aria-label="elsewhere" /><OverviewCharts platforms={[{ ...p, state: 'ready' }]} /></>);
    expect(document.activeElement).toBe(screen.getByLabelText('elsewhere'));
  });

  it('gives up to three platforms a column each and four or more a row each', () => {
    setWidth(1000);
    const { container, rerender } = render(<OverviewCharts platforms={[autoWorks, stockroom, cafe]} />);
    expect(container.querySelector('.grid-cols-3')).toBeTruthy();
    rerender(<OverviewCharts platforms={[autoWorks, stockroom, cafe, hardware]} />);
    expect(container.querySelector('.grid-cols-3')).toBeNull();
    expect(container.querySelectorAll('section.grid-cols-\\[minmax\\(0\\,15rem\\)_minmax\\(0\\,11rem\\)_minmax\\(0\\,1fr\\)\\]')).toHaveLength(4);
  });
  it('stacks below 760px of its own width, rows fold the chart under', () => {
    setWidth(700);
    const { container, rerender } = render(<OverviewCharts platforms={[autoWorks, stockroom]} />);
    expect(container.querySelector('.grid-cols-1')).toBeTruthy();
    expect(container.querySelector('.grid-cols-2')).toBeNull();
    rerender(<OverviewCharts platforms={[autoWorks, stockroom, cafe, hardware]} />);
    expect(container.querySelectorAll('section.grid-cols-1')).toHaveLength(4);
  });
  it('keeps the status visible when rows stack', () => {
    setWidth(500);
    render(<OverviewCharts platforms={[autoWorks, stockroom, cafe, hardware]} />);
    expect(screen.getAllByText('Running').length).toBe(3);
    expect(screen.getByText('Slow')).toBeTruthy();
  });
  it('shows Retry for a failed platform, keeps the others, and calls onRetry', () => {
    setWidth(1000);
    const onRetry = vi.fn();
    render(<OverviewCharts platforms={[autoWorks, { ...failed, name: 'Lia', onRetry }]} />);
    expect(screen.getByRole('alert').textContent).toContain('Couldn’t load your Lia numbers.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
  });
  it('says when there is no history, and shows skeletons while loading', () => {
    setWidth(1000);
    const { container } = render(<OverviewCharts platforms={[noHistory, { ...cafe, state: 'loading' }]} />);
    expect(screen.getByText('No 7-day history yet')).toBeTruthy();
    expect(container.querySelector('[aria-busy=true]')).toBeTruthy();
  });
  it('share bars write every label and value, and the bar is hidden from assistive tech', () => {
    setWidth(1000);
    const { container } = render(<OverviewCharts platforms={[autoWorks]} />);
    const li = [...container.querySelectorAll('ul li')].map((l) => l.textContent);
    expect(li).toContain('In progress 4');
    expect(container.querySelector('svg[aria-hidden=true] rect')).toBeTruthy();
  });
});
