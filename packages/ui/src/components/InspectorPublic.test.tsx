import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { Inspector } from './Inspector';
import { useLedaPanel } from './LedaPanel';
import { Toaster } from './toast/Toaster';
import type { InspectorJob, LedaProposalData, TodayEnv, TodayProduct } from './today/types';

afterEach(cleanup);

/** Criterion: the public components carry no data and no prototype dependency. */
describe('public Inspector, LedaPanel, TrackingLink are data-agnostic', () => {
  it.each(['Inspector.tsx', 'LedaPanel.tsx', 'TrackingLink.tsx'])('%s imports no prototypes, data or *Model module', (file) => {
    const src = readFileSync(join(process.cwd(), 'src/components', file), 'utf8');
    const imports = [...src.matchAll(/from '([^']+)'/g)].map((m) => m[1]!);
    expect(imports.filter((i) => /prototypes|\/data$|Model$|trackerLinks/.test(i))).toEqual([]);
  });
});

const product: TodayProduct = { id: 'p1', sku: 'S-1', name: 'Bendix front pads', unit: 'set', price: 1500, reorder: 2, locations: [{ name: 'Kapitolyo', qty: 2, thisBranch: true }] };
const env: TodayEnv = {
  now: '2026-11-02T10:20:00+08:00', today: '2026-11-02', stockState: () => 'in', elsewhere: () => [], shortParts: () => [], balance: () => 500, peso: (n) => `P${n}`,
};
const job: InspectorJob = {
  id: 'j1', number: 'JO-0001', status: 'IN_PROGRESS', assigneeId: 'm1', statusSince: '2026-11-02T08:00:00+08:00', promisedAt: '2026-11-02T15:00:00+08:00',
  complaint: 'Squeaks when braking', services: [{ name: 'Brake service', price: 2000, qty: 1 }], parts: [{ productId: 'p1', qty: 1 }],
};
const proposal: LedaProposalData = { id: 'lpx', platform: 'SMS', jobIds: ['j1'], title: 'Remind the customer', why: 'Quote is 2 days old', writes: ['Send a reminder'], confirmLabel: 'Send reminder' };
const props = {
  job, env, view: { vehicle: 'Toyota Vios', plate: 'ABC 123', customer: 'Maria Santos' }, customerPhone: '0917 555 0142',
  mechanics: [{ id: 'm1', name: 'Jun Bautista', short: 'Jun', initials: 'JB', bay: 'Bay 1' }], products: [product], inventoryName: 'Parts Stockroom',
  totals: { total: 2000, paid: 1500 }, proposals: [proposal], proposalState: {}, onConfirmProposal: () => {}, onDiscardProposal: () => {}, onAction: () => {}, onAssign: () => {}, onResolve: () => {},
};

describe('Inspector with plain props', () => {
  it('renders the customer, parts and totals it is given', () => {
    render(<Inspector {...props} />);
    expect(screen.getByText(/Toyota Vios/)).toBeTruthy();
    expect(screen.getByText(/Maria Santos/)).toBeTruthy();
    expect(screen.getAllByText('P2000').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /0917 555 0142/ })).toBeTruthy();
  });
  it('renders proposals from LedaProposalData and reports confirm and discard', () => {
    const onConfirmProposal = vi.fn(); const onDiscardProposal = vi.fn();
    render(<Inspector {...props} onConfirmProposal={onConfirmProposal} onDiscardProposal={onDiscardProposal} />);
    expect(screen.getByText('Remind the customer')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Send reminder' }));
    expect(onConfirmProposal).toHaveBeenCalledWith(proposal);
    fireEvent.click(screen.getByRole('button', { name: /Discard/ }));
    expect(onDiscardProposal).toHaveBeenCalledWith(proposal);
  });
  it('shows the quotation it is given and the tracking link slot', () => {
    render(<Inspector {...props} job={{ ...job, status: 'FOR_APPROVAL' }} quotation={{ number: 'QT-0007', open: true, validUntil: 'Fri 6 Nov' }} onViewQuote={() => {}} />);
    expect(screen.getByText('QT-0007')).toBeTruthy();
    expect(screen.getByText(/Valid until Fri 6 Nov/)).toBeTruthy();
  });
  it('has no axe violations', async () => {
    const { container } = render(<Inspector {...props} />);
    expect((await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).violations).toEqual([]);
  });
});

function Panel({ onConfirmed }: { onConfirmed: (id: string) => void }) {
  const leda = useLedaPanel({
    person: { short: 'Ana', initials: 'AN' }, proposals: [proposal], onConfirmed, startOpen: true, scope: 'Today', chips: ['Anything stuck?'], clock: () => '9:00 AM',
    palette: [{ id: 'ask', label: 'Ask Leda', items: [{ id: 'ask:Anything stuck?', label: 'Anything stuck?' }] }],
    answer: (q, ctx) => (q.includes('remind') ? ctx.proposal('lpx') : null),
  });
  return <div>{leda.node}<Toaster /></div>;
}

describe('useLedaPanel', () => {
  it('renders a proposal from LedaProposalData in the conversation and reports its id on confirm', async () => {
    const onConfirmed = vi.fn();
    render(<Panel onConfirmed={onConfirmed} />);
    await userEvent.type(screen.getByLabelText('Message Leda'), 'remind them{Enter}');
    const confirm = await screen.findByRole('button', { name: 'Send reminder' }, { timeout: 3000 });
    await userEvent.click(confirm);
    await vi.waitFor(() => expect(onConfirmed).toHaveBeenCalledWith('lpx'), { timeout: 3000 });
  });
});
