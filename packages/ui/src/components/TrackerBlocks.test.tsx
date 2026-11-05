import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ItemsBlock, PaymentBlock, QuoteCard, StatusBlock, TrackerFrame, UpdatesBlock, WhoBlock } from './TrackerBlocks';
import { getMech } from './sms/mechModel';
import { SCENARIO_JOB, liveJob, maskPlate, seedTracker, type TrackerScenario } from './sms/trackerModel';
import { trackerViewOf } from './sms/trackerAdapter';
import type { TrackerQuoteView } from './trackerView';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const SCENARIOS: TrackerScenario[] = ['received', 'in progress', 'waiting for parts', 'quote waiting', 'ready for pick-up', 'done', 'long text', 'many updates', 'empty feed'];

function page(scenario: TrackerScenario, onAnswer: (id: string, a: 'approved' | 'declined') => void = () => {}) {
  seedTracker(scenario, 'none');
  const s = getMech();
  const v = trackerViewOf(s, liveJob(s, SCENARIO_JOB[scenario])!);
  return (
    <TrackerFrame business="Dela Cruz Auto Works" branchName="Kapitolyo">
      <WhoBlock who={v.who} /><StatusBlock status={v.status} />
      {v.quotes.map((q) => <QuoteCard key={q.id} q={q} onAnswer={onAnswer} />)}
      <ItemsBlock items={v.items} /><PaymentBlock payment={v.payment} /><UpdatesBlock posts={v.updates} />
    </TrackerFrame>
  );
}

describe('TrackerBlocks', () => {
  it('masks the plate: first three and last two stay', () => { expect(maskPlate('NBC 4521')).toBe('NBC••21'); });
  it('shows no internal note', () => { render(page('in progress')); expect(screen.queryByText(/slow to pay/)).toBeNull(); });
  it('asks twice before answering a quote', () => {
    render(page('quote waiting'));
    act(() => { screen.getByRole('button', { name: 'Approve' }).click(); });
    expect(screen.getByRole('button', { name: 'Yes, approve' })).toBeTruthy();
  });
  it('calls onAnswer with the quote id after the second tap', () => {
    const onAnswer = vi.fn();
    render(page('quote waiting', onAnswer));
    act(() => { screen.getByRole('button', { name: 'Decline' }).click(); });
    act(() => { screen.getByRole('button', { name: 'Yes, decline' }).click(); });
    expect(onAnswer).toHaveBeenCalledWith('pp-t1', 'declined');
  });
  it('renders every block from plain props, with no store seeded', () => {
    const q: TrackerQuoteView = { id: 'q9', text: 'Cracked hose', photos: 0, amount: 1800, note: 'Labour included', customer: 'waiting' };
    const onAnswer = vi.fn();
    render(
      <TrackerFrame business="Shop" branchName="Branch">
        <WhoBlock who={{ firstName: 'Ana', car: 'Honda City 2020', plate: 'ABC••21', service: 'Brake job', number: 'JO-1' }} />
        <StatusBlock status={{ stage: 'working', word: 'Working on it', sentence: 'Busy.', step: 1, promise: 'Promised: today, 3:00 pm' }} />
        <QuoteCard q={q} onAnswer={onAnswer} />
        <ItemsBlock items={[{ name: 'Pads', done: true }, { name: 'Fluid', done: false }]} />
        <PaymentBlock payment={{ balance: 500, paid: 0, readyForPickup: true }} />
        <UpdatesBlock posts={[{ id: 'u1', kind: 'note', title: 'Update', text: 'Pads fitted.', photos: 1, when: '5 min ago', by: 'Jun', person: null }]} />
      </TrackerFrame>,
    );
    expect(screen.getByText(/Hi Ana/)).toBeTruthy();
    expect(screen.getByText('1 of 2 done')).toBeTruthy();
    expect(screen.getByText('Pay at the shop when you pick up your vehicle.')).toBeTruthy();
    expect(screen.getByText('Pads fitted.')).toBeTruthy();
  });
  it('disables the confirm buttons and shows the error while an answer is pending', () => {
    const q: TrackerQuoteView = { id: 'q9', text: 'x', photos: 0, amount: 100, note: 'n', customer: 'waiting' };
    const { rerender } = render(<QuoteCard q={q} onAnswer={() => {}} />);
    act(() => { screen.getByRole('button', { name: 'Approve' }).click(); });
    rerender(<QuoteCard q={q} onAnswer={() => {}} pending error="Could not send. Try again." />);
    expect((screen.getByRole('button', { name: 'Yes, approve' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('alert').textContent).toContain('Try again');
  });
  it('folds older updates', () => { render(page('many updates')); expect(screen.getByRole('button', { name: /Show older updates/ })).toBeTruthy(); });
  for (const sc of SCENARIOS) {
    it(`has no axe violations: ${sc}`, async () => {
      const { container } = render(page(sc));
      expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    });
  }
});
