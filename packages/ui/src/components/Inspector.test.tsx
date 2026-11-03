import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { Inspector } from './Inspector';
import { InquiryDetail } from './sms/InquiryDetail';
import { inquiries, jobs } from './sms/data';
import { money } from './sms/floorModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const base = { proposalState: {}, onConfirmProposal: () => {}, onDiscardProposal: () => {}, onAction: () => {}, onAssign: () => {}, onResolve: () => {} };
const find = (f: (j: (typeof jobs)[number]) => boolean) => jobs.find(f)!;

describe('Inspector', () => {
  it('offers Collect payment for a ready unpaid car and no second Payment button', () => {
    const j = find((x) => x.status === 'FOR_PICKUP' && money.balance(x) > 0);
    render(<Inspector {...base} job={j} />);
    expect(screen.getByRole('button', { name: 'Collect payment' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Payment' })).toBeNull();
  });
  it('offers Release car once paid, with Payment as the secondary button', () => {
    const j = find((x) => x.status === 'FOR_PICKUP' && money.balance(x) <= 0);
    const onAction = vi.fn();
    render(<Inspector {...base} onAction={onAction} job={j} />);
    fireEvent.click(screen.getByRole('button', { name: 'Release car' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Payment' })).toBeTruthy();
  });
  it('shows the Book it action for a quotation', () => {
    render(<Inspector {...base} onBookQuote={() => {}} onEditQuote={() => {}} job={find((x) => x.status === 'QUOTATION')} />);
    expect(screen.getByRole('button', { name: 'Customer agreed - Book it' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit quote' })).toBeTruthy();
  });
  it('is a pushed page on phone: back link, no close button', () => {
    render(<Inspector {...base} asPage onBack={() => {}} onClose={() => {}} job={jobs[0]} />);
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Close service' })).toBeNull();
  });
  it('has no axe violations', async () => {
    const { container } = render(<div>{[jobs[0], find((x) => x.status === 'QUOTATION'), find((x) => x.status === 'FOR_PICKUP')].map((j) => <Inspector key={j.id} {...base} job={j} onClose={() => {}} onBookQuote={() => {}} onEditQuote={() => {}} />)}<Inspector {...base} job={null} /><Inspector {...base} job={jobs[0]} inventoryDown /></div>);
    expect((await axe.run(container, { rules: { ...axeOpts.rules, 'landmark-unique': { enabled: false }, 'duplicate-id': { enabled: false }, 'duplicate-id-aria': { enabled: false } } })).violations).toEqual([]);
  });
});

describe('InquiryDetail', () => {
  it('shows Reply and New service for an unanswered inquiry with no service', () => {
    render(<InquiryDetail inquiry={inquiries[1]} onReply={() => {}} onNewService={() => {}} onOpenJob={() => {}} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: 'Reply' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New service' })).toBeTruthy();
  });
  it('shows the replied time and no actions once replied', () => {
    render(<InquiryDetail inquiry={inquiries[2]} onReply={() => {}} onNewService={() => {}} onOpenJob={() => {}} onClose={() => {}} />);
    expect(screen.getByText(/^Replied at /)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reply' })).toBeNull();
  });
  it('has no axe violations', async () => {
    const { container } = render(<InquiryDetail inquiry={inquiries[0]} job={jobs.find((j) => j.id === inquiries[0].jobId)} onReply={() => {}} onNewService={() => {}} onOpenJob={() => {}} onClose={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
