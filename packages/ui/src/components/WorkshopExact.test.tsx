// RDY-358: the additive props the Memory page uses to match the workshop prototype exactly.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PlatformShell } from './PlatformShell';
import { StatusBar } from './StatusBar';
import { Switch } from './Switch';
import { Tabs } from './Tabs';
import { Select } from './Select';
import { TownMap } from './TownMap';
import { TryIt } from './TryIt';
import { sampleAbouts, sampleAsk, sampleQuestions } from './TryIt.sample';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('StatusBar', () => {
  it('shows "0 platforms · all running" when there are none (workshop shell)', () => {
    render(<StatusBar platforms={[]} people={{ count: 9 }} leda={{ used: 1, max: 2 }} plan="Starter" />);
    expect(screen.getByText('0 platforms')).toBeTruthy();
    expect(screen.getByText('· all running')).toBeTruthy();
  });
  it('makes the plan a button or a link', () => {
    const onPlanSelect = vi.fn();
    const { rerender } = render(<StatusBar plan="Starter" onPlanSelect={onPlanSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Starter plan' }));
    expect(onPlanSelect).toHaveBeenCalledTimes(1);
    rerender(<StatusBar plan="Starter" planHref="#plan" />);
    expect(screen.getByRole('link', { name: 'Starter plan' }).getAttribute('href')).toBe('#plan');
  });
});

describe('Switch look="workshop"', () => {
  it('uses the control grey track with a white thumb when off, and the same accent track when on', () => {
    render(<><Switch look="workshop" aria-label="Off one" /><Switch look="workshop" checked aria-label="On one" /></>);
    const off = screen.getByRole('switch', { name: 'Off one' });
    expect(off.className).toContain('bg-control');
    expect(off.className).not.toContain('bg-raised');
    expect(off.firstElementChild!.className).toContain('bg-surface');
    expect(screen.getByRole('switch', { name: 'On one' }).className).toContain('data-[state=checked]:bg-accent');
  });
  it('keeps the design-system look by default', () => {
    render(<Switch aria-label="Default" />);
    expect(screen.getByRole('switch').className).toContain('bg-raised');
  });
});

describe('Tabs keepInView', () => {
  it('scrolls the chosen tab into view by default and not when keepInView is false', () => {
    const spy = vi.fn();
    (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = spy;
    const items = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }];
    const { unmount } = render(<Tabs aria-label="t" items={items} value="b" onValueChange={() => {}} />);
    expect(spy).toHaveBeenCalled();
    unmount();
    spy.mockClear();
    render(<Tabs aria-label="t" items={items} value="b" onValueChange={() => {}} keepInView={false} />);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('TownMap hqLabel', () => {
  it('names the HQ button with the page\'s own words', () => {
    render(<TownMap platforms={[{ id: 'hq', name: 'Company', kind: 'HQ', status: 'ACTIVE', hq: true }]} hqLabel={() => 'Company, 6 of 7 topics on'} />);
    expect(screen.getByRole('button', { name: 'Company, 6 of 7 topics on' })).toBeTruthy();
  });
  it('keeps the default HQ name', () => {
    render(<TownMap platforms={[{ id: 'hq', name: 'Company', kind: 'HQ', status: 'ACTIVE', hq: true }]} />);
    expect(screen.getByRole('button', { name: /^HQ, your team and plan/ })).toBeTruthy();
  });
});

describe('TownMap loading, hqSub and fadeOthers (RDY-358)', () => {
  const plats = [
    { id: 'hq', name: 'Company', kind: 'HQ', status: 'ACTIVE' as const, hq: true },
    { id: 'a', name: 'Auto Works', kind: 'Workshop', status: 'ACTIVE' as const },
  ];
  it('hides the building labels while loading (the map shows its lots, not names it has not loaded)', () => {
    const { container } = render(<TownMap platforms={plats} loading />);
    expect(container.querySelector('ul[aria-label="Platforms"]')!.className).toContain('invisible');
  });
  it('keeps the labels when not loading', () => {
    const { container } = render(<TownMap platforms={plats} />);
    expect(container.querySelector('ul[aria-label="Platforms"]')!.className).not.toContain('invisible');
  });
  it('adds a second HQ line only with hqSub', () => {
    const { rerender } = render(<TownMap platforms={plats} />);
    expect(screen.queryByText('HQ · 6 of 7 on')).toBeNull();
    rerender(<TownMap platforms={plats} hqSub={() => 'HQ · 6 of 7 on'} />);
    expect(screen.getByText('HQ · 6 of 7 on')).toBeTruthy();
  });
  it('fades the other labels (not the text) when a building is selected with fadeOthers', () => {
    render(<TownMap platforms={plats} selected="hq" fadeOthers />);
    const other = document.querySelector('[data-pid="a"]')!;
    expect(other.className).toContain('data-[placed]:opacity-55');
    expect(document.querySelector('[data-pid="hq"]')!.className).not.toContain('data-[placed]:opacity-55');
  });
  it('dims the map to 35% when the data did not load', () => {
    const { container } = render(<TownMap platforms={plats} error errorNotice={false} />);
    expect(container.querySelector('.opacity-\\[\\.35\\]')).toBeTruthy();
  });
});

describe('Select trigger (workshop .dd-btn)', () => {
  it('shows the accent border and a 1px offset ring when it takes keyboard focus', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<Select aria-label="Business" options={[{ value: 'a', label: 'All' }, { value: 'b', label: 'Two' }]} value="a" onValueChange={() => {}} />);
    await user.tab();
    const trigger = screen.getByRole('combobox', { name: 'Business' });
    expect(document.activeElement).toBe(trigger);
    expect(trigger.className).toContain('focus-visible:border-accent');
    expect(trigger.className).toContain('focus-visible:outline-offset-1');
  });
});

describe('TryIt variant="workshop"', () => {
  it('lays out About and Question one under the other, with the footnote and the shield note', async () => {
    vi.useFakeTimers();
    render(
      <TryIt open onOpenChange={() => {}} abouts={sampleAbouts} questions={sampleQuestions} ask={(a, q) => sampleAsk(a, q)} variant="workshop"
        description="Ask as a customer and see what Leda says, and why." footnote="As customers see it." note="Never shared." />,
    );
    await act(async () => { await vi.advanceTimersByTimeAsync(900); });
    expect(screen.getByRole('heading', { name: 'A customer asks' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'About' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Question' })).toBeTruthy();
    expect(screen.getByText('Ask as a customer and see what Leda says, and why.')).toBeTruthy();
    expect(screen.getByText('As customers see it.')).toBeTruthy();
    expect(screen.getByText('Never shared.')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});

describe('PlatformShell sanity', () => {
  it('still renders', () => {
    render(<PlatformShell status={<StatusBar platforms={[]} />}>x</PlatformShell>);
    expect(screen.getByRole('contentinfo', { name: 'Status' })).toBeTruthy();
  });
});
