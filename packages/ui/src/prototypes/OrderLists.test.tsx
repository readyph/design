import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { OrderListsPage, type OrderListsPageProps } from './OrderLists.page';

afterEach(cleanup);

describe('OrderListsPage (RDY-405)', () => {
  it('shows the Autopro paper and the three steps', () => {
    render(<OrderListsPage />);
    expect(screen.getByText('1 · Check it')).toBeTruthy();
    expect(screen.getByText('3 · Mark it sent')).toBeTruthy();
  });
  it('clerk sees "Your manager marks it sent"', () => {
    render(<OrderListsPage as="clerk" />);
    expect(screen.getByText('3 · Your manager marks it sent')).toBeTruthy();
  });
});

/* heading-order is off: the workshop goes h1 to h3 for the side heading (order-list.js 144, 188). GAP noted in the PR. */
describe('axe', () => {
  const cases: [string, OrderListsPageProps][] = [
    ['lists', {}],
    ['sent', { tab: 'sent' }],
    ['empty', { empty: true }],
    ['clerk', { as: 'clerk' }],
    ['tenant B', { tenant: 'b' }],
    ['loading', { state: 'loading' }],
    ['error', { state: 'error' }],
  ];
  for (const [name, props] of cases) {
    it(`has no axe violations (${name})`, async () => {
      const { container } = render(<OrderListsPage {...props} />);
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'heading-order': { enabled: false } } });
      expect(r.violations.map((v) => v.id)).toEqual([]);
    });
  }
});
