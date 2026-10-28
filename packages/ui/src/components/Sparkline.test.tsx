// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Sparkline } from './Sparkline';
import { RevenueChart } from './RevenueChart';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Sparkline', () => {
  it('skips non-finite values without NaN or console errors', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<Sparkline points={[1, NaN, 3, Infinity, 5, 6]} area />);
    expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    expect(container.querySelectorAll('polyline').length).toBe(1);
    expect(container.querySelectorAll('circle').length).toBe(1);
    expect(err).not.toHaveBeenCalled();
  });
  it('renders the empty state when fewer than 2 finite points', () => {
    for (const pts of [[NaN, Infinity, NaN], [4], []]) {
      const { container } = render(<Sparkline points={pts} />);
      expect(container.querySelector('svg[data-empty]')).not.toBeNull();
      expect(container.querySelector('polyline')).toBeNull();
      expect(container.innerHTML).not.toContain('NaN');
      cleanup();
    }
  });
  it('draws a normal series as one polyline', () => {
    const { container } = render(<Sparkline points={[1, 2, 3]} />);
    expect(container.querySelectorAll('polyline').length).toBe(1);
  });
});

describe('RevenueChart forced colours', () => {
  it('gives bars and swatches forced-colors fills that differ between two series', () => {
    const { container } = render(<RevenueChart title="Rev" total="1" series={[{ label: 'A', value: '1', amount: 2 }, { label: 'B', value: '2', amount: 1 }]} />);
    const marks = [...container.querySelectorAll('[class*="forced-color-adjust:none"]')];
    expect(marks.length).toBe(4);
    expect(marks[0]!.className).toContain('forced-colors:!bg-[Highlight]');
    expect(marks[1]!.className).toContain('forced-colors:!bg-[Canvas]');
    expect(marks.every((m) => m.className.includes('forced-colors:border-[CanvasText]'))).toBe(true);
  });
});
