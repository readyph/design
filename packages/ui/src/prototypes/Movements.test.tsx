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

describe('axe', () => {
  const cases: [string, MovementsPageProps][] = [
    ['ledger', {}], ['filters', { io: 'out', reason: 'sold' }], ['custom dates', { range: 'custom', from: 20, to: 22 }], ['job note', { jo: 'JO-0413' }], ['loading', { state: 'loading' }],
    ['error', { state: 'error' }], ['none', { mv: 'none' }], ['no results', { qs: 'zzzz' }], ['quiet', { state: 'quiet' }], ['clerk', { as: 'clerk' }], ['tenant b', { tenant: 'b' }],
  ];
  it.each(cases)('%s has no axe violations', async (_n, props) => {
    const { container } = render(<MovementsPage {...props} />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, 'heading-order': { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 120)}`)).toEqual([]);
  });
});
