import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { PanelToggle } from '../PanelToggle';
import { FloorFeed } from './FloorFeed';
import { SidePanelLayout } from './SidePanel';
import { useSmsLeda } from './LedaPanel';
import { jobs } from './data';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const noop = () => {};
const floorRead = 'Ricky is free from 12:30 and Jun carries 5 active services. JO-0417 could move to Ricky and still make 16:00.';
const clean = async (el: HTMLElement) => expect((await axe.run(el, axeOpts)).violations).toEqual([]);

function Leda({ startOpen }: { startOpen?: boolean }) { const l = useSmsLeda({ startOpen }); return <div><button type="button" onClick={l.openPalette}>Ask</button>{l.node}</div>; }

describe('Right panel', () => {
  it.each(['hide', 'show'] as const)('PanelToggle %s: labelled button, axe clean', async (mode) => {
    const { container } = render(<PanelToggle mode={mode} onClick={noop} hint="3 need you" />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe(`${mode === 'hide' ? 'Hide' : 'Show'} the side panel, 3 need you`);
    await clean(container);
  });

  it.each(['needs', 'inquiries', 'parts'] as const)('FloorFeed %s tab: axe clean', async (tab) => {
    const { container } = render(<FloorFeed jobs={jobs} replied={{}} tab={tab} floorRead={floorRead} onOpenJob={noop} onOpenInquiry={noop} />);
    await clean(container);
  });

  it('FloorFeed with nothing stuck and with the inventory down', async () => {
    const a = render(<FloorFeed jobs={[]} replied={{}} tab="needs" onOpenJob={noop} onOpenInquiry={noop} />);
    expect(screen.getByText('Nothing is stuck. Every service is on time.')).toBeTruthy();
    await clean(a.container);
    a.unmount();
    const b = render(<FloorFeed jobs={jobs} replied={{}} tab="parts" inventoryDown onOpenJob={noop} onOpenInquiry={noop} />);
    expect(screen.getByText(/Can't reach/)).toBeTruthy();
    await clean(b.container);
  });

  it.each([{ open: true }, { open: false }, { open: true, loading: true }, { open: true, limited: true }, { open: true, detailOpen: true }])('SidePanelLayout %j: axe clean', async (p) => {
    const { container } = render(<SidePanelLayout {...p} jobs={jobs} replied={{}} tab="needs" onOpenChange={noop} onTabChange={noop} onOpenJob={noop} onOpenInquiry={noop}><p>Page</p></SidePanelLayout>);
    await clean(container);
  });

  it('the collapsed rail opens the panel on the chosen tab', () => {
    let open = false; let tab = 'needs';
    render(<SidePanelLayout open={false} onOpenChange={(o) => { open = o; }} jobs={jobs} replied={{}} tab="needs" onTabChange={(t) => { tab = t; }} onOpenJob={noop} onOpenInquiry={noop}><p>Page</p></SidePanelLayout>);
    fireEvent.click(screen.getByLabelText(/Inquiries, show the list/));
    expect(open).toBe(true); expect(tab).toBe('inquiries');
  });

  it('Leda panel: conversation open, axe clean', async () => {
    const { container } = render(<Leda startOpen />);
    await clean(container);
  });
});
