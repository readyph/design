import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { QuotationDoc, QuotationModal } from './QuotationDoc';
import { CustomerPanel } from './CustomerPanel';
import { customers, jobs } from './sms/data';
import { everyService } from './sms/servicesData';
import { docFromJob } from './sms/wizardModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const doc = docFromJob(jobs.find((j) => j.status === 'QUOTATION')!);

describe('QuotationDoc', () => {
  it('shows a QT- number and a valid-until line', () => {
    render(<QuotationDoc doc={doc} />);
    expect(doc.number.startsWith('QT-')).toBe(true);
    expect(screen.getAllByText(/Valid until/).length).toBeGreaterThan(0);
  });
  it('parked quote has Edit and Book actions; used quote only Close', () => {
    render(<QuotationModal doc={doc} actions={{ onBook: () => {}, onEdit: () => {} }} onClose={() => {}} />);
    expect(screen.getByText('Customer agreed - Book it')).toBeTruthy();
    cleanup();
    render(<QuotationModal doc={doc} onClose={() => {}} />);
    expect(screen.queryByText('Edit quote')).toBeNull();
  });
  it('has no axe violations', async () => {
    const { container } = render(<QuotationDoc doc={doc} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('CustomerPanel', () => {
  const props = { customer: customers[0], pool: everyService, onOpenService: () => {}, onNewService: () => {} };
  it('has the new-service action', () => {
    render(<CustomerPanel {...props} />);
    expect(screen.getByText(/New service for/)).toBeTruthy();
  });
  it.each([false, true])('has no axe violations (asPage %s)', async (asPage) => {
    const { container } = render(<CustomerPanel {...props} onBack={() => {}} asPage={asPage} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
