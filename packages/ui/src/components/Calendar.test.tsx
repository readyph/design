import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { WeekCalendar, type WeekCalendarProps } from './WeekCalendar';
import { CalCard } from './CalCard';
import { CalendarToolbar } from './CalendarToolbar';
import { calMechanicOptions, calendarEnv, packDay } from './sms/scheduleModel';
import { mechanicOptionsOf } from './calendar/model';
import { mechanics, mechanicOf, type Job } from './sms/data';
import { viewOf } from './sms/floorModel';
import { calItems } from './sms/calendarSample';

afterEach(cleanup);
Element.prototype.scrollTo = () => {};
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const noop = () => {};
const base = { env: calendarEnv, view: viewOf, mechanics, items: calItems, onOpen: noop, onBook: noop };

describe('WeekCalendar', () => {
  it('splits a full day into side-by-side lanes and opens a card', () => {
    const open = vi.fn();
    render(<WeekCalendar {...base} days={['2026-11-04']} onOpen={open} />);
    const cards = document.querySelectorAll('[data-day="2026-11-04"] button[aria-pressed]');
    expect(cards.length).toBeGreaterThan(8);
    fireEvent.click(cards[0]!);
    expect(open).toHaveBeenCalledOnce();
  });
  it('names the empty day and the closed day', () => {
    render(<WeekCalendar {...base} items={[]} days={['2026-11-05']} />);
    expect(screen.getByText(/Nothing is booked here yet/)).toBeTruthy();
    cleanup();
    render(<WeekCalendar {...base} days={['2026-11-08']} />);
    expect(screen.getAllByText('Closed Sunday').length).toBeGreaterThan(0);
  });
  for (const [name, props] of [['day', { days: ['2026-11-04'] }], ['week', { days: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'] }], ['loading', { days: ['2026-11-04'], state: 'loading' }]] as [string, Pick<WeekCalendarProps, 'days'> & Partial<WeekCalendarProps<Job>>][]) {
    it(`has no axe violations: ${name}`, async () => {
      const { container } = render(<WeekCalendar {...base} {...props} />);
      expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    });
  }
});

describe('CalCard', () => {
  it('shows identity at 30 minutes and adds the title at 60', () => {
    const it0 = calItems.find((i) => i.job.id === 'f06')!;
    const mk = (dur: number) => packDay([{ ...it0, end: it0.start + dur }]).placed[0]!;
    const { container, rerender } = render(<RadixTooltip.Provider><CalCard env={calendarEnv} jobView={viewOf} mechanic={mechanicOf(it0.job)} placed={mk(30)} selected={false} flash={false} dim={false} showMech onOpen={noop} /></RadixTooltip.Provider>);
    expect(container.querySelectorAll('span.line-clamp-1,span.line-clamp-2').length).toBe(0);
    rerender(<RadixTooltip.Provider><CalCard env={calendarEnv} jobView={viewOf} mechanic={mechanicOf(it0.job)} placed={mk(60)} selected dim={false} flash={false} showMech onOpen={noop} /></RadixTooltip.Provider>);
    expect(container.querySelectorAll('span.line-clamp-1,span.line-clamp-2').length).toBe(1);
    expect(container.querySelector('button')!.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('CalendarToolbar', () => {
  const props = { days: ['2026-11-02', '2026-11-03', '2026-11-04'], span: '3day' as const, onSpan: noop, onPrev: noop, onNext: noop, onToday: noop, onJump: noop, q: '', onQ: noop, mechanic: 'any', mechanicOptions: calMechanicOptions(), onMechanic: noop };
  it('moves the range and toggles Needs you', () => {
    const next = vi.fn(); const needs = vi.fn();
    render(<CalendarToolbar {...props} onNext={next} onNeedsOnly={needs} needsCount={4} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next 3 days' }));
    fireEvent.click(screen.getByRole('button', { name: /Needs you/ }));
    expect(next).toHaveBeenCalledOnce(); expect(needs).toHaveBeenCalledWith(true);
  });
  it('has no axe violations', async () => {
    const { container } = render(<CalendarToolbar {...props} onNeedsOnly={noop} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('data-agnostic calendar (an API job the studio fixtures do not know)', () => {
  const apiJob = { id: 'api-1', number: 'SV-9001', status: 'TODO' as const, assigneeId: 'u-77', statusSince: '2031-03-10T08:00:00+08:00', promisedAt: '2031-03-10T11:00:00+08:00', services: [{ name: 'Oil change' }, { name: 'Brake check' }] };
  const apiEnv = { ...calendarEnv, now: '2031-03-10T13:30:00+08:00', today: '2031-03-10', hours: { open: 9 * 60, close: 18 * 60 }, closed: { '2031-03-11': 'Holiday' } };
  const apiMechs = [{ id: 'u-77', name: 'Nilo Cruz', short: 'Nilo', initials: 'NC', bay: 'Bay 9', shift: '10:00-16:00' }];
  const props = { env: apiEnv, mechanics: apiMechs, view: () => ({ vehicle: 'Ford Ranger 2020', plate: 'ZZZ 999', customer: 'Walk-in Lopez' }), onOpen: noop, onBook: noop };
  const item = { job: apiJob, date: '2031-03-10', start: 10 * 60, end: 11 * 60 };

  it('renders a job unknown to the fixtures, with its own clock, hours, closed day and shift', () => {
    render(<WeekCalendar {...props} days={['2031-03-10', '2031-03-11']} items={[item]} mechanicId="u-77" />);
    const card = screen.getByRole('button', { name: /SV-9001/ });
    expect(card.textContent).toContain('SV-9001');
    expect(card.textContent).toContain('Nilo Cruz');
    expect(screen.getAllByText('Holiday').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Off shift').length).toBe(2);
    expect(screen.getByText('13:30')).toBeTruthy();
    expect(screen.getByText('9:00')).toBeTruthy();
  });
  it('shows an unassigned card when the mechanic is not in the list', () => {
    render(<WeekCalendar {...props} mechanics={[]} days={['2031-03-10']} items={[item]} />);
    expect(screen.getByRole('button', { name: /not assigned/ })).toBeTruthy();
  });
  it('builds the mechanic filter from the given mechanics', () => {
    const opts = mechanicOptionsOf(apiMechs);
    expect(opts.map((o) => o.label)).toEqual(['All mechanics', 'Not assigned', 'Nilo · Bay 9']);
    render(<CalendarToolbar days={['2031-03-10']} span="day" onSpan={noop} onPrev={noop} onNext={noop} onToday={noop} onJump={noop} q="" onQ={noop} mechanic="u-77" mechanicOptions={opts} onMechanic={noop} />);
    expect(screen.getByText('Nilo · Bay 9')).toBeTruthy();
  });
});
