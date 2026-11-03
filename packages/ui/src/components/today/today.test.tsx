import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { JobRow } from '../JobRow';
import { PartChip } from '../PartChip';
import { SidePanelLayout } from '../SidePanelLayout';
import { dayWord, flagOf, hm, minOf, nextAction, reasonOf, serviceTitle, shortName } from './model';
import type { TodayEnv, TodayJob, TodayProduct } from './types';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

// Plain data: nothing here comes from the studio mock data, which is the point.
const pump: TodayProduct = { id: 'p1', sku: 'WP-1', name: 'Bendix Water pump, Vios', unit: 'pc', price: 1200, reorder: 2, locations: [{ name: 'Shop, Kapitolyo', qty: 0, thisBranch: true }, { name: 'Shop, Cubao', qty: 3, thisBranch: false }] };
const env: TodayEnv = {
  now: '2030-01-10T10:00:00+08:00', today: '2030-01-10',
  stockState: (p) => (p.locations.some((l) => l.thisBranch && l.qty > 0) ? 'in' : 'out'),
  elsewhere: (p) => p.locations.filter((l) => !l.thisBranch && l.qty > 0),
  shortParts: (j) => (j.pendingReason === 'WAITING_FOR_PARTS' ? [pump] : []),
  balance: (j) => (j.status === 'FOR_PICKUP' ? 500 : 0),
  peso: (n) => `P${n}`,
};
const job = (over: Partial<TodayJob> = {}): TodayJob => ({ id: 'a', number: 'JO-1', status: 'IN_PROGRESS', assigneeId: 'm1', statusSince: '2030-01-10T08:00:00+08:00', promisedAt: '2030-01-10T15:00:00+08:00', services: [{ name: 'Oil change' }, { name: 'Brakes' }], ...over });
const mechanics = [{ id: 'm1', name: 'Jun Reyes', short: 'Jun', initials: 'JR' }];
const view = { vehicle: 'Toyota Vios 2018', plate: 'ABC 123', customer: 'Ana Cruz' };

describe('Today helpers take the clock as arguments', () => {
  it('formats times against the given day', () => {
    expect(hm('2030-01-10T15:05:00+08:00')).toBe('15:05');
    expect(minOf('2030-01-10T15:05:00+08:00')).toBe(905);
    expect(dayWord('2030-01-10T15:05:00+08:00', '2030-01-10')).toBe('15:05');
    expect(dayWord('2030-01-11T15:05:00+08:00', '2030-01-10')).toMatch(/15:05$/);
    expect(dayWord('2030-01-11T15:05:00+08:00', '2030-01-10')).not.toBe('15:05');
  });
  it('names a service and a part', () => {
    expect(serviceTitle(job())).toBe('Oil change + Brakes');
    expect(shortName(pump)).toBe('Water pump');
  });
  it('flags a late job, parts, and an unpaid pick-up from env', () => {
    expect(reasonOf(env, job())).toBeNull();
    expect(flagOf(env, job({ promisedAt: '2030-01-10T09:00:00+08:00' }))).toEqual({ tone: 'bad', word: 'late 1h' });
    expect(flagOf(env, job({ status: 'PENDING', pendingReason: 'WAITING_FOR_PARTS' }))).toEqual({ tone: 'bad', word: 'Water pump out' });
    expect(flagOf(env, job({ status: 'FOR_PICKUP' }))).toEqual({ tone: 'warn', word: 'P500 unpaid' });
    expect(reasonOf(env, job({ status: 'COMPLETED', promisedAt: '2020-01-01T00:00:00+08:00' }))).toBeNull();
  });
  it('offers the next action', () => {
    expect(nextAction(env, job({ status: 'TODO' }))?.to).toEqual({ status: 'IN_PROGRESS' });
    expect(nextAction(env, job({ status: 'FOR_PICKUP' }))?.pay).toBe(true);
    expect(nextAction(env, job({ status: 'PENDING', pendingReason: 'WAITING_FOR_PARTS' }))).toBeNull();
  });
});

describe('JobRow on plain data', () => {
  it.each(['row', 'compact', 'two-line'] as const)('%s: shows the job, opens, acts, axe clean', async (density) => {
    const onOpen = vi.fn(); const onAction = vi.fn();
    const { container } = render(<JobRow job={job({ status: 'TODO' })} env={env} view={view} mechanics={mechanics} density={density} onOpen={onOpen} onAction={onAction} />);
    expect(screen.getAllByText(/JO-1/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /JO-1, Toyota Vios 2018, Ana Cruz/ }));
    expect(onOpen).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: 'Start work' }));
    expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), expect.objectContaining({ label: 'Start work' }));
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('PartChip on plain data', () => {
  it('reads stock and the other branch from env, and is axe clean', async () => {
    const { container } = render(<PartChip product={pump} env={env} inventoryName="Dela Cruz Parts" readOnly />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Bendix Water pump, Vios, out of stock. Resolve');
    expect(screen.getByText(/3 at Cubao/)).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('SidePanelLayout on plain data', () => {
  const stats = [{ id: 'needs', count: 2, label: 'Needs you', accent: true }, { id: 'other', count: 0, label: 'Other' }];
  it('renders the feed with the hide toggle, and the rail opens it', () => {
    const onOpenChange = vi.fn(); const onStatSelect = vi.fn();
    const { rerender } = render(
      <SidePanelLayout open onOpenChange={onOpenChange} stats={stats} onStatSelect={onStatSelect} hint="2 need you" feed={(h) => <div>Feed body {h}</div>}>Page</SidePanelLayout>,
    );
    expect(screen.getByText(/Feed body/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hide the side panel' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    rerender(<SidePanelLayout open={false} onOpenChange={onOpenChange} stats={stats} onStatSelect={onStatSelect} hint="2 need you" feed={() => null}>Page</SidePanelLayout>);
    fireEvent.click(screen.getByRole('button', { name: '2 Needs you, show the list' }));
    expect(onStatSelect).toHaveBeenCalledWith('needs');
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });
});
