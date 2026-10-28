import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MovementLedger, MovementTabs, movementDaySummary, type MovementRow } from './MovementLedger';

afterEach(cleanup);

const row = (o: Partial<MovementRow>): MovementRow => ({
  id: 'x', time: '9:00 AM', product: { name: 'Oil', sku: 'O1' }, what: 'Sold', by: 'Berto', qty: -1, unit: 'bottle', left: 3, ...o,
});

describe('MovementLedger', () => {
  it('summarises a day: unit totals only for one unit, "none in" for zero', () => {
    expect(movementDaySummary([row({ qty: -2 }), row({ qty: -1 })])).toBe('none in, 3 bottles out');
    expect(movementDaySummary([row({ qty: 5 }), row({ qty: -1, unit: 'pc' })])).toBe('1 in, 1 out');
  });
  it('signs the quantity with its unit and shows balance', () => {
    render(<MovementLedger days={[{ id: 'd', heading: 'Today', shortHeading: 'Today', rows: [row({ qty: -2, left: 3 })] }]} />);
    expect(screen.getByText('−2')).toBeTruthy();
    expect(screen.getByText('bottles')).toBeTruthy();
  });
  it('offers Undo and Show more', () => {
    const undo = vi.fn(); const more = vi.fn();
    render(<MovementLedger days={[{ id: 'd', heading: 'Today', shortHeading: 'Today', rows: [row({ undoable: true })] }]} onUndo={undo} more={50} onShowMore={more} />);
    fireEvent.click(screen.getByText('Undo'));
    fireEvent.click(screen.getByText('Show 40 more'));
    expect(undo).toHaveBeenCalled(); expect(more).toHaveBeenCalled();
  });
  it('tabs use roving tabindex and arrow / Home / End keys', () => {
    const change = vi.fn();
    render(<MovementTabs value="ledger" onValueChange={change} transfersCount={4} transfersOpen={2} />);
    const [ledger, transfers] = screen.getAllByRole('tab');
    expect(ledger.getAttribute('tabindex')).toBe('0');
    expect(transfers.getAttribute('tabindex')).toBe('-1');
    fireEvent.keyDown(ledger, { key: 'ArrowRight' });
    expect(change).toHaveBeenLastCalledWith('transfers');
    fireEvent.keyDown(ledger, { key: 'End' });
    expect(change).toHaveBeenLastCalledWith('transfers');
    fireEvent.keyDown(transfers, { key: 'Home' });
    expect(change).toHaveBeenLastCalledWith('ledger');
  });
  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <MovementTabs value="ledger" transfersCount={4} transfersOpen={2} />
        <MovementLedger days={[{ id: 'd', heading: 'Today', shortHeading: 'Today', rows: [row({})] }]} />
      </div>,
    );
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
