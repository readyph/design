import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ItemsBlock, PaymentBlock, QuoteCard, StatusBlock, TrackerFrame, UpdatesBlock, WhoBlock } from './TrackerBlocks';
import { getMech } from './sms/mechModel';
import { SCENARIO_JOB, feedForCustomer, liveJob, maskPlate, quotesFor, seedTracker, type TrackerScenario } from './sms/trackerModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const SCENARIOS: TrackerScenario[] = ['received', 'in progress', 'waiting for parts', 'quote waiting', 'ready for pick-up', 'done', 'long text', 'many updates', 'empty feed'];

function page(scenario: TrackerScenario) {
  seedTracker(scenario, 'none');
  const s = getMech();
  const job = liveJob(s, SCENARIO_JOB[scenario])!;
  return (
    <TrackerFrame>
      <WhoBlock job={job} /><StatusBlock job={job} />
      {quotesFor(s, job).map((q) => <QuoteCard key={q.id} q={q} />)}
      <ItemsBlock job={job} /><PaymentBlock job={job} /><UpdatesBlock job={job} posts={feedForCustomer(s, job)} />
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
  it('folds older updates', () => { render(page('many updates')); expect(screen.getByRole('button', { name: /Show older updates/ })).toBeTruthy(); });
  for (const sc of SCENARIOS) {
    it(`has no axe violations: ${sc}`, async () => {
      const { container } = render(page(sc));
      expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    });
  }
});
