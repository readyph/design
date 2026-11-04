import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MECH_HOUR_H, MechHome, MechSchedule } from './MechHome';
import type { Step } from './mechCardView';
import type { CalendarEnv } from './calendar/model';
import type { TodayJob } from './today/types';
import { mechanics } from './sms/data';
import { dayOf, getMech, poolFor, type MechScenario } from './sms/mechModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const me = mechanics[0];
const s = getMech();
const props = (scenario: MechScenario, stress = false) => ({ me, s, scenario, pool: poolFor(s, me, stress, scenario), day: dayOf(s, me, scenario, stress), onOpen: () => {} });

describe('MechHome', () => {
  it.each(['normal', 'no services', 'day off', 'loading', 'all blocked'] as MechScenario[])('has no axe violations: %s', async (sc) => {
    const { container } = render(<MechHome {...props(sc)} />);
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
  it('has no axe violations under stress', async () => {
    const { container } = render(<MechHome {...props('normal', true)} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('draws the now line and opens a card', () => {
    const open = vi.fn();
    const { container } = render(<MechHome {...props('normal')} onOpen={open} />);
    expect(container.querySelector('[data-now-line]')).toBeTruthy();
    const first = container.querySelector('[data-step] button, [data-step] [role="button"]') as HTMLElement | null;
    if (first) { fireEvent.click(first); expect(open).toHaveBeenCalled(); }
  });
  it('shows the empty and day-off states', () => {
    render(<MechHome {...props('day off')} />);
    expect(screen.getByText('You are off today')).toBeTruthy();
  });
});

describe('MechSchedule (live data, not the sample jobs)', () => {
  type LiveJob = TodayJob & { plate: string };
  const env: CalendarEnv = {
    now: '2030-05-06T14:30:00', today: '2030-05-06', hours: { open: 8 * 60, close: 17 * 60 }, closed: {},
    stockState: () => 'in', elsewhere: () => [], shortParts: () => [], balance: () => 0, peso: (n) => `P${n}`,
  };
  const job = (id: string, status: TodayJob['status']): LiveJob => ({ id, number: `JO-${id}`, status, assigneeId: 'u1', statusSince: '2030-05-06T09:00:00', promisedAt: null, services: [{ name: 'Oil change' }], plate: `P${id}` });
  const item = (id: string, step: Step, start: number | null) => ({ job: job(id, step === 'now' ? 'IN_PROGRESS' : 'TODO'), step, staff: { current: step === 'now', stats: [], unread: null, last: null }, start, dur: 60 });
  const jobView = (j: LiveJob) => ({ vehicle: 'Toyota Vios', plate: j.plate, customer: 'Ana Reyes' });

  it('puts the now line at env.now and the cards by their time', () => {
    const open = vi.fn();
    const { container } = render(<MechSchedule items={[item('1', 'now', 9 * 60), item('2', 'next', 15 * 60)]} env={env} jobView={jobView} onOpen={open} />);
    const line = container.querySelector('[data-now-line]') as HTMLElement;
    expect(line.style.top).toBe(`${((14 * 60 + 30 - 8 * 60) / 60) * MECH_HOUR_H - 1}px`);
    expect(screen.getByText('14:30')).toBeTruthy();
    const tops = [...container.querySelectorAll('[data-step]')].map((e) => Number(e.getAttribute('data-top')));
    expect(tops[1]).toBeGreaterThan(tops[0]);
    expect(container.querySelector('[data-day-header]')?.textContent).toContain('6');
    fireEvent.click(container.querySelector('[data-step="next"] button, [data-step="next"] [role="button"]') as HTMLElement);
    expect(open).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }));
  });
  it('has no axe violations', async () => {
    const { container } = render(<MechSchedule items={[item('1', 'now', null), item('2', 'waiting', null)]} env={env} jobView={jobView} onOpen={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('shows the loading and day off states', () => {
    const { rerender } = render(<MechSchedule items={[]} env={env} jobView={jobView} onOpen={() => {}} scenario="loading" />);
    expect(screen.getByLabelText('Loading your services')).toBeTruthy();
    rerender(<MechSchedule items={[]} env={env} jobView={jobView} onOpen={() => {}} scenario="day off" nextShift="8:00-17:00" />);
    expect(screen.getByText('You are off today')).toBeTruthy();
    expect(screen.getByText('Your next shift is tomorrow, 8:00-17:00.')).toBeTruthy();
  });
  it('shows the empty state with no services and the blocked line when all wait', () => {
    const { rerender } = render(<MechSchedule items={[]} env={env} jobView={jobView} onOpen={() => {}} />);
    expect(screen.getByText('No cars for you yet')).toBeTruthy();
    rerender(<MechSchedule items={[item('1', 'waiting', null)]} env={env} jobView={jobView} onOpen={() => {}} />);
    expect(screen.getByText('All your cars are waiting for parts.')).toBeTruthy();
  });
});
