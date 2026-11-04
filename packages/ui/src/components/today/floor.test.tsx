import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { FloorLanes } from '../FloorLanes';
import { FloorFeed } from '../FloorFeed';
import { InquiryDetail } from '../InquiryDetail';
import type { FloorLane, FloorMoveTarget, TodayEnv, TodayInquiry, TodayJob, TodayJobView, TodayPartMovement, TodayProduct } from './types';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
Element.prototype.scrollTo = Element.prototype.scrollTo ?? (() => {});
window.matchMedia = window.matchMedia ?? ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList);

const product: TodayProduct = { id: 'p1', sku: 'SKU-1', name: 'Brake pad, front', unit: 'set', price: 1200, reorder: 2, locations: [] };
const env: TodayEnv = { now: '2026-11-02T10:20:00+08:00', today: '2026-11-02', stockState: () => 'in', elsewhere: () => [], shortParts: () => [], balance: () => 0, peso: (n) => `P${n}` };
const job = (id: string, over: Partial<TodayJob> = {}): TodayJob => ({ id, number: `JO-${id}`, status: 'IN_PROGRESS', assigneeId: 'm1', statusSince: '2026-11-02T08:00:00+08:00', promisedAt: '2026-11-02T09:00:00+08:00', services: [{ name: 'Brake service' }], ...over });
const view = (): TodayJobView => ({ vehicle: 'Toyota Vios 2018', plate: 'ABC 123', customer: 'Ana Cruz' });
const jobs = [job('0001'), job('0002', { promisedAt: null }), job('0003', { status: 'FOR_APPROVAL', assigneeId: null })];
const lanes: FloorLane[] = [{ id: 'm1', name: 'Jun', sub: 'Bay 1', initials: 'JN', jobs: jobs.slice(0, 2) }, { id: 'counter', name: 'Counter', sub: 'Mon', jobs: [jobs[2]], manager: true }];
const targets: FloorMoveTarget[] = [{ id: 'm1', label: 'Jun', meta: 'Bay 1' }, { id: 'counter', label: 'Counter', separatorBefore: true }];
const lanesProps = { env, view, moveTargets: targets, open: 8 * 60, close: 18 * 60, now: 10 * 60 + 20, onSelect: () => {}, onMove: () => {} };
const inquiry: TodayInquiry = { id: 'q1', at: '2026-11-02T09:30:00+08:00', channel: 'Text', name: 'Ben Reyes', text: 'Is my car ready?' };
const moves: TodayPartMovement[] = [{ id: 'mv1', at: '2026-11-02T09:00:00+08:00', productId: 'p1', qty: 2, dir: 'in', ref: 'PO-1', by: 'Rica' }];
const feedProps = { jobs, env, view, inquiries: [inquiry], replied: {}, partMovements: moves, productOf: () => product, inventoryName: 'Inventory', branchName: 'Main', onOpenJob: () => {}, onOpenInquiry: () => {} };
const clean = async (el: HTMLElement) => expect((await axe.run(el, axeOpts)).violations).toEqual([]);

describe('FloorLanes (props only)', () => {
  it('shows the Now line, the No time well and the free-from hint from the props', () => {
    const { container } = render(<FloorLanes {...lanesProps} lanes={lanes} />);
    expect(screen.getByText('Now 10:20')).toBeTruthy();
    expect(screen.getByText('No time')).toBeTruthy();
    expect(container.textContent).toContain('Brake service');
    expect(screen.getAllByRole('button', { name: /^Move JO-.* to\.\.\.$/ })).toHaveLength(3);
  });
  it('selects a chip and drops a chip on another lane', () => {
    const onSelect = vi.fn(); const onMove = vi.fn();
    render(<FloorLanes {...lanesProps} lanes={lanes} onSelect={onSelect} onMove={onMove} />);
    fireEvent.click(screen.getAllByRole('button', { name: /0001/ })[0]!);
    expect(onSelect).toHaveBeenCalledWith(jobs[0]);
    const target = screen.getByText('Counter').closest('div[class*="border-b"]')!;
    fireEvent.drop(target, { dataTransfer: { getData: () => '0001' } });
    expect(onMove).toHaveBeenCalledWith(jobs[0], 'counter');
  });
  it('covers loading, empty and axe', async () => {
    const a = render(<FloorLanes {...lanesProps} lanes={[]} state="loading" />);
    expect(a.container.querySelector('[aria-busy="true"]')).toBeTruthy();
    a.unmount();
    const b = render(<FloorLanes {...lanesProps} lanes={[{ id: 'm1', name: 'Jun', sub: 'Bay 1', initials: 'JN', jobs: [] }]} />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
    await clean(b.container);
    b.unmount();
    const c = render(<FloorLanes {...lanesProps} lanes={lanes} />);
    await clean(c.container);
  });
});

describe('FloorFeed (props only)', () => {
  it.each(['needs', 'inquiries', 'parts'] as const)('%s tab: axe clean', async (tab) => {
    const { container } = render(<FloorFeed {...feedProps} tab={tab} mechItems={[{ id: 'rq1', title: 'Oil', time: '09:10', detail: '1 for shop use', tag: 'Part requested' }]} floorRead="Jun is busy." floorReadAt="10:20" />);
    await clean(container);
  });
  it('shows what the props carry and the empty and loading states', () => {
    const a = render(<FloorFeed {...feedProps} tab="inquiries" />);
    expect(screen.getByText('Ben Reyes')).toBeTruthy();
    a.unmount();
    const b = render(<FloorFeed {...feedProps} tab="parts" />);
    expect(screen.getByText('Brake pad')).toBeTruthy();
    expect(screen.getByText('Open in Inventory')).toBeTruthy();
    b.unmount();
    const c = render(<FloorFeed {...feedProps} jobs={[]} inquiries={[]} partMovements={[]} tab="needs" />);
    expect(screen.getByText('Nothing is stuck. Every service is on time.')).toBeTruthy();
    c.unmount();
    const d = render(<FloorFeed {...feedProps} state="loading" />);
    expect(screen.getByRole('status')).toBeTruthy();
    d.unmount();
  });
});

describe('InquiryDetail (props only)', () => {
  it('replies, opens the linked service and covers loading', async () => {
    const onReply = vi.fn(); const onOpenJob = vi.fn();
    const a = render(<InquiryDetail inquiry={{ ...inquiry, jobId: '0001' }} job={jobs[0]} jobView={view()} onReply={onReply} onNewService={() => {}} onOpenJob={onOpenJob} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reply' }));
    fireEvent.click(screen.getByRole('button', { name: /Open service/ }));
    expect(onReply).toHaveBeenCalledOnce(); expect(onOpenJob).toHaveBeenCalledWith(jobs[0]);
    await clean(a.container);
    a.unmount();
    const b = render(<InquiryDetail inquiry={inquiry} state="loading" onReply={() => {}} onNewService={() => {}} onOpenJob={() => {}} onClose={() => {}} />);
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Reply' })).toBeNull();
    await clean(b.container);
  });
});
