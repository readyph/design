import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Marketplace, marketplaceIoLine, type MarketplaceProps } from './Marketplace';
import { sampleCatalog } from './Marketplace.sample';

afterEach(cleanup);

function Demo(props: Partial<MarketplaceProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open market</button>
      <Marketplace items={sampleCatalog} {...props} open={open} onOpenChange={setOpen} />
    </>
  );
}
async function openIt(props: Partial<MarketplaceProps> = {}) {
  render(<Demo {...props} />);
  await userEvent.click(screen.getByText('Open market'));
  return screen.getByRole('dialog');
}
const tile = (name: string) => screen.getByRole('radio', { name });
const install = () => screen.getByRole('button', { name: /^Install/ }) as HTMLButtonElement;
const filter = (name: string) => screen.getByRole('button', { name });

describe('Marketplace', () => {
  it('is the fixed 904x744 marketplace dialog named by its title', async () => {
    const d = await openIt();
    expect(d.getAttribute('data-size')).toBe('marketplace');
    expect(d.className).toContain('min(904px,calc(100vw-48px))');
    expect(d.className).toContain('min(744px,calc(100vh-48px))');
    expect(screen.getByRole('dialog', { name: 'Add a platform' })).toBeTruthy();
  });

  it('keeps the dialog and body classes identical in every filter, including an empty one', async () => {
    const d = await openIt({ items: sampleCatalog.filter((i) => i.category !== 'finance') });
    const body = () => d.querySelector('[tabindex="0"]') as HTMLElement;
    const snap = () => `${d.className}|${body().className}|${d.getAttribute('data-size')}`;
    const first = snap();
    for (const name of ['Operations', 'Sales', 'Finance', 'Marketing', 'All']) {
      await userEvent.click(filter(name));
      expect(snap()).toBe(first);
    }
    await userEvent.click(filter('Finance'));
    expect(screen.getByText('Nothing in this group yet')).toBeTruthy();
    expect(snap()).toBe(first);
  });

  it('filters tiles by category', async () => {
    await openIt();
    expect(screen.getAllByRole('radio')).toHaveLength(8);
    await userEvent.click(filter('Sales'));
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('aria-labelledby') && r.textContent)).toHaveLength(3);
    expect(screen.queryByRole('radio', { name: 'Inventory' })).toBeNull();
    expect(filter('Sales').getAttribute('aria-pressed')).toBe('true');
  });

  it('Install is disabled until a tile is picked, then names the kind', async () => {
    const onInstall = vi.fn();
    await openIt({ onInstall });
    expect(install().disabled).toBe(true);
    expect(install().textContent).toBe('Install');
    await userEvent.click(tile('POS'));
    expect(tile('POS').getAttribute('aria-checked')).toBe('true');
    expect(install().disabled).toBe(false);
    expect(install().textContent).toBe('Install POS');
    expect(screen.getByRole('status', { name: '' }).textContent).toContain('no app yet');
    await userEvent.click(install());
    expect(onInstall).toHaveBeenCalledWith(expect.objectContaining({ key: 'pos' }));
  });

  it('shows the prefilled pick and the Leda note slot', async () => {
    await openIt({ defaultPicked: 'pos', ledaNote: <p>Nothing is added until you press Install.</p> });
    expect(tile('POS').getAttribute('aria-checked')).toBe('true');
    expect(install().textContent).toBe('Install POS');
    expect(screen.getByText(/Nothing is added until/)).toBeTruthy();
  });

  it('focus starts on the picked tile, else the first tile, and on every reopen', async () => {
    await openIt({ defaultPicked: 'storefront' });
    expect(document.activeElement).toBe(tile('Storefront'));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByText('Open market'));
    expect(document.activeElement).toBe(tile('Storefront'));
    cleanup();
    await openIt();
    expect(document.activeElement).toBe(tile('Inventory'));
  });

  it('Coming soon is dashed, disabled, not pickable and out of the tab order', async () => {
    await openIt();
    const soon = tile('Loyalty');
    expect(soon.getAttribute('aria-disabled')).toBe('true');
    expect(soon.getAttribute('aria-checked')).toBe('false');
    expect(soon.tabIndex).toBe(-1);
    expect(soon.className).toContain('border-dashed');
    expect(soon.textContent).toContain('Coming soon');
    await userEvent.click(soon);
    expect(install().disabled).toBe(true);
  });

  it('is a radiogroup with one tab stop; arrows move and pick, skipping Coming soon', async () => {
    await openIt();
    const group = screen.getByRole('radiogroup');
    const stops = () => within(group).getAllByRole('radio').filter((r) => r.tabIndex === 0);
    expect(stops().map((r) => r.textContent?.includes('Inventory'))).toEqual([true]);
    tile('Inventory').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tile('Repair shop'));
    expect(tile('Repair shop').getAttribute('aria-checked')).toBe('true');
    expect(stops()).toHaveLength(1);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(tile('Delivery'));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tile('Inventory'));
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(tile('Delivery'));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(tile('Inventory'));
  });

  it('Space and Enter pick the focused tile', async () => {
    await openIt();
    tile('Storefront').focus();
    await userEvent.keyboard(' ');
    expect(tile('Storefront').getAttribute('aria-checked')).toBe('true');
    tile('Accounting').focus();
    await userEvent.keyboard('{Enter}');
    expect(tile('Accounting').getAttribute('aria-checked')).toBe('true');
    expect(tile('Storefront').getAttribute('aria-checked')).toBe('false');
  });

  it('a double click installs; a selected tile shows more than colour (check icon)', async () => {
    const onInstall = vi.fn();
    await openIt({ onInstall });
    await userEvent.click(tile('Delivery'));
    expect(tile('Delivery').querySelector('svg[fill="currentColor"]')).toBeTruthy();
    await userEvent.dblClick(tile('Delivery'));
    expect(onInstall).toHaveBeenCalledWith(expect.objectContaining({ key: 'delivery' }));
  });

  it('describes each tile and shows "You have N"', async () => {
    await openIt();
    expect(tile('Inventory').textContent).toContain('You have 1');
    expect(tile('Repair shop').textContent).toContain('You have 2');
    expect(tile('POS').textContent).not.toContain('You have');
    expect(tile('POS').textContent).toContain('Shares sales · Reads stock');
    expect(marketplaceIoLine({ shares: ['a', 'b', 'c'] })).toBe('Shares a, b and c');
    expect(marketplaceIoLine({})).toBe('Works on its own');
  });

  it('closes on Escape and returns focus to the opener; the filter row survives reopening reset', async () => {
    await openIt();
    await userEvent.click(filter('Sales'));
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(screen.getByText('Open market'));
    await userEvent.click(screen.getByText('Open market'));
    expect(filter('All').getAttribute('aria-pressed')).toBe('true');
  });

  it('Cancel closes', async () => {
    await openIt();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('loading shows skeleton tiles with Install disabled; error shows Try again', async () => {
    const onRetry = vi.fn();
    const { unmount } = render(<Marketplace open items={sampleCatalog} status="loading" />);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.getByRole('status', { name: 'Loading the catalog' })).toBeTruthy();
    expect(install().disabled).toBe(true);
    unmount();
    render(<Marketplace open items={sampleCatalog} status="error" onRetry={onRetry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('caller className lands on the tile grid and cannot override its layout', async () => {
    await openIt({ className: 'grid-cols-5 gap-0 hidden' });
    const grid = screen.getByRole('radiogroup');
    expect(grid.className).toContain('grid-cols-3');
    expect(grid.className).toContain('gap-3');
    expect(grid.className).not.toContain('hidden');
    expect(grid.className).not.toContain('grid-cols-5');
  });

  it('footer cannot grow with content: summary and Install label truncate, Install is capped, Cancel never shrinks', async () => {
    const name = 'Inventory, Warehouse, Consignment and Multi-branch Distribution Management for Large Cross-border Trading Groups';
    const dlg = await openIt({ defaultPicked: 'inventory', items: [{ ...sampleCatalog[0], key: 'inventory', name }, ...sampleCatalog.slice(1)] });
    const status = within(dlg).getAllByRole('status').find((e) => e.textContent?.includes(name))!;
    expect(status.className).toMatch(/\bmin-w-0\b/);
    expect(status.className).toMatch(/sm:flex-1/);
    expect(status.querySelector('span.truncate')).not.toBeNull();
    const btn = install();
    expect(btn.className).toMatch(/sm:max-w-\[320px\]/);
    expect(btn.className).toMatch(/\bmin-w-0\b/);
    expect(btn.querySelector('span.truncate')?.textContent).toBe(`Install ${name}`);
    expect(screen.getByRole('button', { name: 'Cancel' }).className).toMatch(/\bshrink-0\b/);
  });

  it('Tab to a filter segment scrolls it into view (inline nearest)', async () => {
    await openIt();
    const spy = vi.fn();
    const btn = filter('Marketing');
    btn.scrollIntoView = spy;
    btn.focus();
    expect(spy).toHaveBeenCalledWith({ inline: 'nearest', block: 'nearest' });
  });
});
