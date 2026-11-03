import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { RequestList } from './RequestList';
import { RequestStepper } from './RequestStepper';
import { getMech } from './sms/mechModel';
import { itemsOf, seedRequests } from './sms/requestsModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('RequestList', () => {
  seedRequests({ scenario: 'default', customer: 'waiting' });
  const items = itemsOf(getMech());
  it('opens a row on click and Enter', () => {
    const onOpen = vi.fn();
    render(<RequestList items={items} selectedId={null} onOpen={onOpen} />);
    const rows = screen.getAllByRole('option');
    fireEvent.click(rows[0]);
    fireEvent.keyDown(rows[0], { key: 'Enter' });
    expect(onOpen).toHaveBeenCalledTimes(2);
  });
  it('renders the empty slot', () => {
    render(<RequestList items={[]} selectedId={null} onOpen={() => {}} empty={<p>Nothing here.</p>} />);
    expect(screen.getByText('Nothing here.')).toBeTruthy();
  });
  it('has no axe violations', async () => {
    const { container } = render(<RequestList items={items} selectedId={items[0]?.id ?? null} onOpen={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('RequestStepper', () => {
  it('has no axe violations in every status', async () => {
    const { container } = render(<div>{(['Requested', 'Approved', 'Ready at stockroom', 'Collected', 'Declined'] as const).map((s) => <RequestStepper key={s} status={s} />)}</div>);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
