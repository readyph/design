import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import axe from 'axe-core';
import { ChipId, DayTimeline, DayTimelinePhone } from './DayTimeline';

afterEach(cleanup);
const h = (hh: number, mm = 0) => hh * 60 + mm;
const base = {
  hours: { open: h(8), close: h(18) }, now: h(9, 12), nowLabel: 'Now 9:12',
  lanes: [{ id: 'a', icon: null, title: 'To do by', sub: 'deadlines', marks: [
    { id: 'm', x: 30, chip: { onSelect: vi.fn(), 'aria-label': 'Order by 10:00', children: <ChipId>PO-1</ChipId> } },
    { id: 'n', x: 60, info: <b>3 jobs</b> },
  ] }],
};

describe('DayTimeline', () => {
  it('renders a chip as a real button and info as plain text', () => {
    const { getAllByRole, container } = render(<DayTimeline {...base} />);
    expect(getAllByRole('button')).toHaveLength(1);
    expect(getAllByRole('button')[0].getAttribute('aria-label')).toBe('Order by 10:00');
    expect(container.textContent).toContain('Now 9:12');
    expect(container.textContent).toContain('3 jobs');
  });
  it('uses tokens only and shows the loading lanes', () => {
    const { container } = render(<DayTimeline {...base} state="loading" />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(container.textContent).toContain('Stock left');
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
  it('has no axe violations', async () => {
    const { container } = render(<DayTimeline {...base} />);
    const r = await axe.run(container);
    expect(r.violations).toEqual([]);
  });
});

describe('DayTimelinePhone', () => {
  const rows = Array.from({ length: 6 }, (_, i) => ({ id: `r${i}`, time: `1${i}:00`, icon: null, title: `T${i}`, onSelect: vi.fn() }));
  it('shows the next 4 then a Show more control, with the Now divider', () => {
    const toggle = vi.fn();
    const { getByText, container } = render(<DayTimelinePhone nowLabel="Now 9:12" rows={rows} onToggleExpanded={toggle} />);
    expect(container.querySelectorAll('ol li')).toHaveLength(4);
    fireEvent.click(getByText('Show 2 more today'));
    expect(toggle).toHaveBeenCalled();
    expect(getByText('Now 9:12')).toBeTruthy();
  });
  it('folds Earlier today and has no axe violations', async () => {
    const { getByText, container } = render(<DayTimelinePhone nowLabel="Now 9:12" rows={rows} earlier={{ count: 4, rows: [], open: false, onToggle: vi.fn() }} />);
    expect(getByText(/Earlier today/).closest('button')!.getAttribute('aria-expanded')).toBe('false');
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
