import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MovementsPage, type MovementsPageProps } from './Movements.page';

afterEach(cleanup);

describe('MovementsPage (RDY-436)', () => {
  it('shows the title, the Leda line and the ledger columns', () => {
    render(<MovementsPage />);
    expect(screen.getByRole('heading', { name: 'Movements' })).toBeTruthy();
    expect(screen.getByText(/movements since yesterday/)).toBeTruthy();
    expect(screen.getByText('What happened')).toBeTruthy();
  });
  it('has the Ledger and Transfers tabs', () => {
    render(<MovementsPage />);
    expect(screen.getByRole('tab', { name: 'Ledger' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: /Transfers/ }));
    expect(screen.getByRole('tab', { name: /Transfers/ }).getAttribute('aria-selected')).toBe('true');
  });
  it('no results offers Clear filters', () => {
    render(<MovementsPage qs="zzzz" />);
    expect(screen.getByText('No movement matches')).toBeTruthy();
  });
  it('loading shows the loading stamp', () => {
    render(<MovementsPage state="loading" />);
    expect(screen.getAllByText(/Loading… last loaded/).length).toBeTruthy();
  });
});

describe('Record movement (RDY-437)', () => {
  it('opens from the button and shows the page, form and side note', () => {
    render(<MovementsPage />);
    fireEvent.click(screen.getAllByRole('button', { name: /Record movement/ })[0]);
    expect(screen.getByRole('heading', { name: 'Record movement' })).toBeTruthy();
    expect(screen.getByText('How stock moves')).toBeTruthy();
  });
  it('a product shows its latest movements', () => {
    render(<MovementsPage record p="p01" />);
    expect(screen.getByText(/Latest for SHX7/)).toBeTruthy();
  });
  it('recording lands on the ledger with an Undo note', () => {
    render(<MovementsPage landed />);
    expect(screen.getAllByText(/Stock out recorded/).length).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'Undo' }).length).toBeGreaterThan(1);
  });
  it('Undo on a row asks first', () => {
    render(<MovementsPage landed undoOpen />);
    expect(screen.getByText('Undo this movement?')).toBeTruthy();
  });
});

describe('axe', () => {
  const cases: [string, MovementsPageProps][] = [
    ['ledger', {}], ['filters', { io: 'out', reason: 'sold' }], ['custom dates', { range: 'custom', from: 20, to: 22 }], ['job note', { jo: 'JO-0413' }], ['loading', { state: 'loading' }],
    ['error', { state: 'error' }], ['none', { mv: 'none' }], ['no results', { qs: 'zzzz' }], ['quiet', { state: 'quiet' }], ['clerk', { as: 'clerk' }], ['tenant b', { tenant: 'b' }],
    ['record', { record: true }], ['record product', { record: true, p: 'p01' }], ['record clerk', { record: true, p: 'p01', as: 'clerk' }], ['landed', { landed: true }], ['undo asks', { landed: true, undoOpen: true }],
  ];
  it.each(cases)('%s has no axe violations', async (_n, props) => {
    const { container } = render(<MovementsPage {...props} />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, 'heading-order': { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([]);
  });
});
