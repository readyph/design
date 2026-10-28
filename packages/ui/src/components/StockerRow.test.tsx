import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { StockLevelBar } from './StockLevelBar';
import { StockerFacts, StockerRow, StockerStatus } from './StockerRow';

afterEach(cleanup);

describe('StockerRow', () => {
  it('renders a link with name, second line, figure and action', () => {
    render(<StockerRow href="/x" what="Brake pad set" where="Aisle 3" qty={{ value: 4, unit: 'pc' }} go="Receive" />);
    const a = screen.getByRole('link');
    expect(a.textContent).toBe('Brake pad setAisle 34pcReceive');
  });
  it('renders a button when onClick is given and a div otherwise', () => {
    const { rerender, container } = render(<StockerRow onClick={() => {}} what="A" />);
    expect(screen.getByRole('button')).toBeTruthy();
    rerender(<StockerRow what="A" />);
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });
  it('status words', () => {
    render(<><StockerStatus state="low" /><StockerStatus state="out" /></>);
    expect(screen.getByText('Low stock').className).toContain('text-warn');
    expect(screen.getByText('Out of stock').className).toContain('text-bad');
  });
  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <StockerRow href="#" what="Brake pad set" where={<>Aisle 3 · <StockerStatus state="low" /></>} qty={{ value: 4, unit: 'pc' }} go />
        <StockerFacts items={[{ label: 'On hand', value: <><b>4</b> pc <StockLevelBar variant="stocker" onHand={4} reorder={5} /> <StockerStatus state="low" /></> }, { label: 'Where', value: 'Aisle 3' }]} />
      </div>,
    );
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
