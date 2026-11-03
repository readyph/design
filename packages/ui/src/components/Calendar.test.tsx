import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { WeekCalendar, type WeekCalendarProps } from './WeekCalendar';
import { CalCard } from './CalCard';
import { CalendarToolbar } from './CalendarToolbar';
import { packDay } from './sms/scheduleModel';
import { calItems } from './sms/calendarSample';

afterEach(cleanup);
Element.prototype.scrollTo = () => {};
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const noop = () => {};
const base = { items: calItems, onOpen: noop, onBook: noop };

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
  for (const [name, props] of [['day', { days: ['2026-11-04'] }], ['week', { days: ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'] }], ['loading', { days: ['2026-11-04'], state: 'loading' }]] as [string, Pick<WeekCalendarProps, 'days'> & Partial<WeekCalendarProps>][]) {
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
    const { container, rerender } = render(<RadixTooltip.Provider><CalCard placed={mk(30)} selected={false} flash={false} dim={false} showMech onOpen={noop} /></RadixTooltip.Provider>);
    expect(container.querySelectorAll('span.line-clamp-1,span.line-clamp-2').length).toBe(0);
    rerender(<RadixTooltip.Provider><CalCard placed={mk(60)} selected dim={false} flash={false} showMech onOpen={noop} /></RadixTooltip.Provider>);
    expect(container.querySelectorAll('span.line-clamp-1,span.line-clamp-2').length).toBe(1);
    expect(container.querySelector('button')!.getAttribute('aria-pressed')).toBe('true');
  });
});

describe('CalendarToolbar', () => {
  const props = { days: ['2026-11-02', '2026-11-03', '2026-11-04'], span: '3day' as const, onSpan: noop, onPrev: noop, onNext: noop, onToday: noop, onJump: noop, q: '', onQ: noop, mechanic: 'any', onMechanic: noop };
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
