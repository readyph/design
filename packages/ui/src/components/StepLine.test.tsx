import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StepLine } from './StepLine';

afterEach(cleanup);
const base = { points: [{ t: 0, v: 10 }, { t: 50, v: 4 }], now: 25, open: 0, close: 100 };

describe('StepLine', () => {
  it('renders the stepped path, now marker, zero line and end label', () => {
    const { container } = render(<StepLine {...base} end={4} aria-label="Steps" />);
    expect(container.querySelector('path')?.getAttribute('d')).toMatch(/^M0 [\d.]+ H110 V[\d.]+ H220$/);
    expect(container.querySelectorAll('line')).toHaveLength(2);
    expect(container.querySelector('line[x1="55"]')).toBeTruthy();
    expect(container.querySelector('text')?.textContent).toBe('4');
  });
  it('negative end shows the minus sign in the bad colour', () => {
    const { container } = render(<StepLine {...base} end={-3} />);
    const t = container.querySelector('text')!;
    expect(t.textContent).toBe('−3');
    expect(t.getAttribute('class')).toContain('fill-bad');
  });
  it('aria-label lists the steps, with a default from the points', () => {
    const { rerender } = render(<StepLine {...base} end={4} aria-label="Flour: 8:00 10, 9:00 4." />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Flour: 8:00 10, 9:00 4.');
    rerender(<StepLine {...base} end={4} />);
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Stock steps: 0 10, 50 4.');
  });
});
