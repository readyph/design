import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { StockStatus } from './StockStatus';

afterEach(cleanup);

describe('StockStatus', () => {
  it('shows the binding words', () => {
    render(
      <>
        <StockStatus status="low" />
        <StockStatus status="out" />
        <StockStatus status="ok" />
      </>,
    );
    expect(screen.getByText('Low stock')).toBeTruthy();
    expect(screen.getByText('In stock')).toBeTruthy();
  });
  it('is red only when out of stock and the dot is hidden from assistive tech', () => {
    render(
      <>
        <StockStatus status="low" />
        <StockStatus status="out" />
      </>,
    );
    expect(screen.getByText('Out of stock').className).toContain('text-bad');
    expect(screen.getByText('Low stock').className).not.toContain('text-bad');
    expect(screen.getByText('Low stock').firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
  it('has no axe violations', async () => {
    const { container } = render(<StockStatus status="out" />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
