import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { DayBar } from './DayBar';

afterEach(cleanup);
const h = (hh: number, mm = 0) => hh * 60 + mm;
const hours = { open: h(8), close: h(18) };
const fmt = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const base = { hours, now: h(9, 12), formatTime: fmt, marks: [{ kind: 'due' as const, at: h(10, 15), label: 'Leave by 10:15', tone: 'bad' as const }, { kind: 'deadline' as const, at: h(11), label: 'Promised 11:00' }] };

const setWidth = (w: number) => Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => w });

describe('DayBar', () => {
  it('is one image whose label lists the hours and every mark', () => {
    const { getByRole } = render(<DayBar {...base} />);
    expect(getByRole('img').getAttribute('aria-label')).toBe('Business hours 8:00 to 18:00. Now 9:12. Leave by 10:15, urgent. Promised 11:00.');
  });
  it('draws the strip at 18px with a 4px radius on the raised ground, from tokens only', () => {
    const { container } = render(<DayBar {...base} />);
    const r = container.querySelector('rect.fill-raised')!;
    expect(r.getAttribute('height')).toBe('18');
    expect(r.getAttribute('rx')).toBe('4');
    expect(container.innerHTML).not.toMatch(/style=|#[0-9a-f]{3,6}/i);
  });
  it('gives each mark its own shape, not only a colour', () => {
    const { container } = render(<DayBar {...base} />);
    expect(container.querySelector('[data-mark=now] circle')).toBeTruthy();
    expect(container.querySelector('[data-mark=due] rect')).toBeTruthy();
    expect(container.querySelector('[data-mark=deadline] path')).toBeTruthy();
    expect(container.querySelector('[data-mark=due] line')!.getAttribute('class')).toContain('stroke-bad');
  });
  it('pins out-of-hours marks to the edge with an arrow and says so', () => {
    const { container, getByRole } = render(<DayBar {...base} now={h(16)} marks={[{ kind: 'due', at: h(19, 30), label: 'Leave by 19:30' }, { kind: 'deadline', at: h(7), label: 'Promised 7:00' }]} />);
    expect(getByRole('img').getAttribute('aria-label')).toContain('Leave by 19:30, after closing');
    expect(getByRole('img').getAttribute('aria-label')).toContain('Promised 7:00, before opening');
    expect(container.querySelectorAll('[data-mark] path[fill=none]')).toHaveLength(2);
  });
  it('treats close <= open as overnight', () => {
    const { getByRole } = render(<DayBar hours={{ open: h(22), close: h(6) }} now={h(23)} formatTime={fmt} marks={[{ kind: 'due', at: h(2), label: 'Leave by 2:00' }]} />);
    const l = getByRole('img').getAttribute('aria-label')!;
    expect(l).toContain('22:00 to 6:00');
    expect(l).not.toContain('before opening');
  });
  it('closed day is a plain strip with no marks', () => {
    const { getByRole, container } = render(<DayBar {...base} closed />);
    expect(getByRole('img').getAttribute('aria-label')).toBe('Closed today.');
    expect(container.querySelectorAll('[data-mark]')).toHaveLength(0);
  });
  it('never overlaps labels when marks are close or equal; due == now uses another row', () => {
    const { container } = render(<DayBar {...base} now={h(10)} marks={[{ kind: 'due', at: h(10), label: 'Order by 10:00', tone: 'bad' }, { kind: 'deadline', at: h(10, 5), label: 'Promised 10:05' }]} />);
    const ys = [...container.querySelectorAll('[data-mark] text')].map((t) => `${t.getAttribute('x')}|${t.getAttribute('y')}`);
    expect(new Set(ys).size).toBe(3);
    const rows = new Set([...container.querySelectorAll('[data-mark] text')].map((t) => t.getAttribute('y')));
    expect(rows.size).toBeGreaterThan(1);
  });
  it('shortens labels below 520px of its own width', () => {
    setWidth(360);
    const { container } = render(<DayBar {...base} />);
    const texts = [...container.querySelectorAll('[data-mark] text')].map((t) => t.textContent);
    expect(texts).toEqual(['Now', '10:15', '11:00']);
    setWidth(0);
  });
  it('uses the full label when there is room', () => {
    setWidth(800);
    const { container } = render(<DayBar {...base} />);
    expect([...container.querySelectorAll('[data-mark] text')].map((t) => t.textContent)).toEqual(['Now 9:12', 'Leave by 10:15', 'Promised 11:00']);
    setWidth(0);
  });
  it('keeps every label inside the strip', () => {
    setWidth(800);
    const { container } = render(<DayBar {...base} now={h(8, 2)} marks={[{ kind: 'due', at: h(17, 58), label: 'Leave by a very long time 17:58' }]} />);
    container.querySelectorAll('[data-mark] text').forEach((t) => {
      const x = Number(t.getAttribute('x')), len = (t.textContent ?? '').length * 6.7;
      const end = t.getAttribute('text-anchor') === 'end' ? x : x + len;
      const start = t.getAttribute('text-anchor') === 'end' ? x - len : x;
      expect(start).toBeGreaterThanOrEqual(0);
      expect(end).toBeLessThanOrEqual(800);
    });
    setWidth(0);
  });
  it('the Now pulse is motion-safe only; className is merged on the wrapper', () => {
    const { container } = render(<DayBar {...base} className="mt-4" />);
    expect(container.querySelector('circle')!.getAttribute('class')).toContain('motion-safe:animate-pulse');
    expect((container.firstChild as HTMLElement).className).toContain('mt-4');
    expect((container.firstChild as HTMLElement).className).toContain('w-full');
  });
  it('does not repeat the time when the label already has it (default formatter drops :00)', () => {
    const { getByRole } = render(<DayBar hours={hours} now={h(9, 12)} locale="en-US" marks={[{ kind: 'due', at: h(10, 15), label: 'Leave by 10:15 AM', tone: 'bad' }, { kind: 'deadline', at: h(11), label: 'Promised 11:00 AM' }]} />);
    expect(getByRole('img').getAttribute('aria-label')).toBe('Business hours 8 AM to 6 PM. Now 9:12 AM. Leave by 10:15 AM, urgent. Promised 11:00 AM.');
  });
  it('adds the time when the label has none', () => {
    const { getByRole } = render(<DayBar hours={hours} locale="en-US" marks={[{ kind: 'due', at: h(11), label: 'Order cut-off' }]} />);
    expect(getByRole('img').getAttribute('aria-label')).toContain('Order cut-off at 11 AM');
  });
  it('maps colours to system colours in forced colors', () => {
    const { container } = render(<DayBar {...base} />);
    expect(container.querySelector('rect')!.getAttribute('class')).toContain('forced-colors:fill-[Canvas]');
    expect(container.querySelector('[data-mark=due] line')!.getAttribute('class')).toContain('forced-colors:stroke-[Highlight]');
  });
  it('formats with the locale by default and takes no clock from the browser', () => {
    const { getByRole } = render(<DayBar hours={hours} now={h(9, 12)} locale="en-US" />);
    expect(getByRole('img').getAttribute('aria-label')).toBe('Business hours 8 AM to 6 PM. Now 9:12 AM.');
  });
});
