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

describe('Transfers (RDY-438)', () => {
  it('lists the transfers with their actions', () => {
    render(<MovementsPage view="transfers" />);
    expect(screen.getByRole('button', { name: /TR-0032 to Kapitolyo branch/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Send TR-0032, to Kapitolyo branch/ })).toBeTruthy();
  });
  it('the send question removes the top Mark as sent and Not yet brings it back', () => {
    render(<MovementsPage tr="TR-0032" sendOpen />);
    expect(screen.getByRole('group', { name: 'Confirm marking as sent' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Mark as sent/ }).length).toBe(1);
    fireEvent.click(screen.getByRole('button', { name: 'Not yet' }));
    expect(screen.queryByRole('group', { name: 'Confirm marking as sent' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /Mark as sent/ }).length).toBeGreaterThan(0);
  });
  it('a clerk sees Waiting for a manager and can print', () => {
    render(<MovementsPage tr="TR-0032" as="clerk" />);
    expect(screen.getByText(/Waiting for/)).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Print/ }).length).toBeGreaterThan(0);
  });
  it('cancel asks first', () => {
    render(<MovementsPage tr="TR-0032" cancelOpen />);
    expect(screen.getByText('Cancel this draft?')).toBeTruthy();
  });
  it('a part another draft needs warns under the line', () => {
    render(<MovementsPage newTr newP="p16" />);
    expect(screen.getByText(/also needs 1 of this part/)).toBeTruthy();
  });
});

describe('axe', () => {
  const cases: [string, MovementsPageProps][] = [
    ['transfers', { view: 'transfers' }], ['transfers draft', { view: 'transfers', tf: 'draft' }], ['transfer draft', { tr: 'TR-0032' }], ['transfer transit', { tr: 'TR-0030' }], ['transfer received', { tr: 'TR-0031' }],
    ['transfer sent out', { tr: 'TR-0032', sent: true }], ['send question', { tr: 'TR-0032', sendOpen: true }], ['transfer clerk', { tr: 'TR-0032', as: 'clerk' }], ['cancel asks', { tr: 'TR-0032', cancelOpen: true }],
    ['new transfer', { newTr: true }], ['change draft', { tr: 'TR-0032', edit: true }], ['new transfer warning', { newTr: true, newP: 'p16' }],
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

describe('Receive transfer (RDY-440)', () => {
  it('starts at what was sent and labels the confirm button', () => {
    render(<MovementsPage tr="TR-0030" rcv />);
    expect(screen.getByRole('heading', { name: /Receive TR-0030/ })).toBeTruthy();
    expect(screen.getAllByText('All in').length).toBe(2);
    expect(screen.getAllByRole('button', { name: /Confirm: add to stock/ }).length).toBeTruthy();
  });
  it('a short count says how many are short', () => {
    render(<MovementsPage tenant="b" tr="TR-0013" rcv rcvStart={{ b11: 9 }} />);
    expect(screen.getByText('3 short')).toBeTruthy();
    expect(screen.getAllByRole('status').map((e) => e.textContent).join(' ')).toMatch(/9 of 12 in, 3 short/);
  });
  it('nothing arrived asks for a count', () => {
    render(<MovementsPage tenant="b" tr="TR-0013" rcv rcvStart={{ b11: 0 }} />);
    expect(screen.getByText('Not arrived')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Confirm receipt' })[0]);
    expect(screen.getByRole('alert').textContent).toMatch(/Nothing is counted yet/);
  });
  it('has no axe violations', async () => {
    const { container } = render(<MovementsPage tr="TR-0030" rcv />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
});
