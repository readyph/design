import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import axe from 'axe-core';
import { StockRunway } from './StockRunway';

afterEach(cleanup);
const h = (hh: number, mm = 0) => hh * 60 + mm;
const base = {
  name: 'Oil filter', hours: { open: h(8), close: h(18) }, now: h(9, 12),
  points: [
    { t: h(8), v: 14, kind: 'start' as const },
    { t: h(14, 30), v: -3, kind: 'job' as const, ref: 'JO-0417', short: true },
  ],
};

describe('StockRunway', () => {
  it('is one image with a spoken level and shortfall', () => {
    const { getByRole } = render(<StockRunway {...base} />);
    expect(getByRole('img').getAttribute('aria-label')).toBe('Oil filter: 8:00 14, 14:30 -3. Short for JO-0417.');
  });
  it('uses tokens only, with the Now flag, zero line and short band', () => {
    const { container } = render(<StockRunway {...base} />);
    expect(container.innerHTML).not.toMatch(/style=|#[0-9a-f]{3,6}/i);
    expect(container.querySelector('line.stroke-control')).toBeTruthy();
    expect(container.querySelector('rect.fill-bad-bg')).toBeTruthy();
    expect(container.textContent).toContain('Now 9:12');
    expect(container.textContent).toContain('pc');
  });
  it('shows the draft PO label, and moves it under the chart on a phone', () => {
    const alt = { no: 'PO-0224', left: 60, at: h(14) };
    const wide = render(<StockRunway {...base} alt={alt} />);
    expect(wide.container.textContent).toContain('with PO-0224: 60 left');
    cleanup();
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 390 });
    const small = render(<StockRunway {...base} alt={alt} />);
    expect(small.container.querySelector('p')!.textContent).toBe('With PO-0224: 60 left when it arrives.');
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 0 });
  });
  it('draws a rate part to "out about"', () => {
    const { container } = render(<StockRunway {...base} points={[base.points[0]]} rate={{ vNow: 8, tz: h(14, 48), end: 0 }} />);
    expect(container.textContent).toContain('out about 14:48');
  });
  it('has loading and empty states', () => {
    expect(render(<StockRunway {...base} state="empty" />).container.textContent).toBe('Nothing goes out until there is stock.');
    cleanup();
    expect(render(<StockRunway {...base} state="loading" />).container.querySelector('.bg-skeleton')).toBeTruthy();
  });
  it.each(['ready', 'loading', 'empty'] as const)('has no axe violations (%s)', async (state) => {
    const { container } = render(<StockRunway {...base} state={state} alt={{ no: 'PO-0224', left: 60, at: h(14) }} />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
  describe('lane variant', () => {
    const lane = { ...base, variant: 'lane' as const, caption: 'Projected from booked jobs, as of 9:12 AM' };
    it('is 128px tall and draws only what the workshop lane draws, with tokens only', () => {
      const { container, getByRole } = render(<StockRunway {...lane} />);
      expect(getByRole('img').getAttribute('height')).toBe('128');
      expect((container.firstChild as HTMLElement).className).toContain('h-[128px]');
      expect(container.innerHTML).not.toMatch(/style=|#[0-9a-f]{3,6}/i);
      expect(container.querySelector('rect.fill-bad-bg')).toBeTruthy();
      expect(container.querySelector('line.stroke-control')).toBeTruthy();
      expect(container.textContent).not.toContain('Now 9:12');
      expect(container.textContent).toContain('3 short by close');
    });
    it('swaps the end text for the fix chip when given', () => {
      const { container, getByText } = render(<StockRunway {...lane} endAction={<button type="button">Fix</button>} />);
      expect(getByText('Fix')).toBeTruthy();
      expect(container.textContent).not.toContain('short by close');
    });
    it('has no axe violations', async () => {
      const { container } = render(<StockRunway {...lane} />);
      expect((await axe.run(container)).violations).toEqual([]);
    });
  });
});
