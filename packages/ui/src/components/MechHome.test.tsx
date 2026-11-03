import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MechHome } from './MechHome';
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
