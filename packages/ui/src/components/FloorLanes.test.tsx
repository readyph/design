import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { FloorLanes } from './FloorLanes';
import { JobRow } from './JobRow';
import { PartChip } from './PartChip';
import { jobs, products, productOf } from './sms/data';
import { lanesFor } from './sms/floorModel';
import { getMech, dayOf } from './sms/mechModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
Element.prototype.scrollTo = Element.prototype.scrollTo ?? (() => {});
window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);

describe('FloorLanes', () => {
  it('shows the Now line, the No time well and a Move to menu per chip', () => {
    const onSelect = vi.fn();
    render(<FloorLanes lanes={lanesFor(jobs)} onSelect={onSelect} onMove={() => {}} />);
    expect(screen.getByText('Now 10:20')).toBeTruthy();
    expect(screen.getByText('No time')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Move JO-.* to\.\.\.$/ }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole('button', { pressed: false })[0]);
    expect(onSelect).toHaveBeenCalledOnce();
  });
  it('is busy while loading', () => {
    const { container } = render(<FloorLanes lanes={[]} state="loading" onSelect={() => {}} onMove={() => {}} />);
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
  it('has no axe violations', async () => {
    const { container } = render(<FloorLanes lanes={lanesFor(jobs)} onSelect={() => {}} onMove={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('JobRow', () => {
  it('has no axe violations in every density', async () => {
    const { container } = render(<div>{(['row', 'compact', 'two-line'] as const).map((d) => <JobRow key={d} density={d} job={jobs[0]} onOpen={() => {}} onAction={() => {}} />)}</div>);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('PartChip', () => {
  it('has no axe violations', async () => {
    const { container } = render(<div>{products.slice(0, 4).map((p) => <PartChip key={p.id} product={p} />)}<PartChip product={productOf(products[0].id)} readOnly /></div>);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('mechModel', () => {
  it('shapes a mechanic day from the seeded session', () => {
    const d = dayOf(getMech(), { id: 'm-jun' } as never, 'normal', false);
    expect(d.next).toBeInstanceOf(Array);
  });
});
