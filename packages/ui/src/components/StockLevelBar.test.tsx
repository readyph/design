import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { StockLevelBar } from './StockLevelBar';

afterEach(cleanup);

describe('StockLevelBar', () => {
  it('names the level for assistive tech and sizes fill against max(2 x reorder, on hand, 1)', () => {
    render(<StockLevelBar onHand={6} reorder={10} />);
    const bar = screen.getByRole('img', { name: '6 on hand, reorder at 10' });
    expect((bar.querySelector('i') as HTMLElement).style.width).toBe('30%');
    expect((bar.querySelector('u') as HTMLElement).style.left).toBe('50%');
  });
  it('caps the fill at 100% when on hand exceeds twice the reorder level', () => {
    render(<StockLevelBar onHand={30} reorder={10} />);
    const bar = screen.getByRole('img');
    expect((bar.querySelector('i') as HTMLElement).style.width).toBe('100%');
    expect((bar.querySelector('u') as HTMLElement).style.left).toBe('33.33333333333333%');
  });
  it('stocker variant is hidden, has no tick and keeps a 6% minimum', () => {
    const { container } = render(<StockLevelBar variant="stocker" onHand={1} reorder={100} />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.getAttribute('aria-hidden')).toBe('true');
    expect(bar.querySelector('u')).toBeNull();
    expect((bar.querySelector('i') as HTMLElement).style.width).toBe('6%');
  });
  it('has no axe violations', async () => {
    const { container } = render(<StockLevelBar onHand={4} reorder={10} variant="wide" />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
