import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortalFrame, DetailTopBar } from './PortalFrame';
import * as pkg from '../index';

afterEach(cleanup);

const frame = (props: Partial<React.ComponentProps<typeof PortalFrame>> = {}) =>
  render(<PortalFrame current="platforms" teamCount={2} onAddPlatform={() => {}} leda={<button type="button">Ask Leda</button>} {...props}><h1>Content</h1></PortalFrame>);

describe('PortalFrame', () => {
  it('rail has Home, Platforms, Reports, Team, Memory and the account; the current page is marked', () => {
    frame();
    const rail = within(screen.getAllByRole('navigation', { hidden: true })[0]!);
    expect(rail.getAllByRole('link', { hidden: true }).map((a) => a.getAttribute('aria-label')).slice(1)).toEqual(['Home', 'Platforms', 'Reports', 'Team, 2', 'Memory']);
    for (const n of ['Home', 'Platforms', 'Reports', 'Memory']) expect(rail.getByRole('link', { name: n, hidden: true })).toBeTruthy();
    expect(rail.getByRole('link', { name: 'Team, 2', hidden: true })).toBeTruthy();
    expect(rail.getByRole('link', { name: 'Platforms', hidden: true }).getAttribute('aria-current')).toBe('page');
    expect(rail.getByRole('button', { name: /Account menu/, hidden: true })).toBeTruthy();
  });

  it('phone nav: labelled tabs Home, Platforms, Reports, Team and More; one nav per frame region, children render once', () => {
    frame();
    const navs = screen.getAllByRole('navigation', { hidden: true });
    expect(navs).toHaveLength(2); // rail + phone nav; CSS shows exactly one per viewport
    const phone = within(navs[1]!);
    expect(phone.getAllByRole('link', { hidden: true }).map((a) => a.textContent)).toEqual(['Home', 'Platforms', 'Reports', 'Team']);
    expect(phone.getByText('More')).toBeTruthy();
    expect(phone.getByRole('link', { name: 'Platforms', hidden: true }).getAttribute('aria-current')).toBe('page');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('top bar carries the page name, the Leda slot and the account avatar; topBar replaces it', () => {
    const { unmount } = frame({ pageName: 'Platforms' });
    const header = within(screen.getByRole('banner', { hidden: true }));
    expect(header.getByRole('img', { name: 'Ready' })).toBeTruthy();
    expect(header.getByText('Platforms')).toBeTruthy();
    expect(header.getByRole('button', { name: 'Ask Leda', hidden: true })).toBeTruthy();
    expect(header.getByRole('button', { name: /Account menu/, hidden: true })).toBeTruthy();
    unmount();
    frame({ topBar: <button type="button">Back</button> });
    const h2 = within(screen.getByRole('banner', { hidden: true }));
    expect(h2.getByRole('button', { name: 'Back', hidden: true })).toBeTruthy();
    expect(h2.queryByRole('button', { name: /Account menu/, hidden: true })).toBeNull();
  });

  it('More opens a menu with Memory and Add a platform, focus moves into it and returns to More on Escape', async () => {
    const add = vi.fn();
    const user = userEvent.setup();
    frame({ onAddPlatform: add });
    const more = screen.getByRole('button', { name: 'More', hidden: true });
    more.focus();
    expect(document.activeElement).toBe(more);
    await user.keyboard('{Enter}');
    const menu = await screen.findByRole('menu');
    expect(menu.contains(document.activeElement)).toBe(true);
    expect(within(menu).getByRole('menuitem', { name: 'Memory' }).getAttribute('href')).toBe('#memory');
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(add).toHaveBeenCalled();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(more);
  });

  it('real focus moves across the tabs with Tab', async () => {
    const user = userEvent.setup();
    frame({ current: 'home' });
    const tabs = within(screen.getAllByRole('navigation', { hidden: true })[1]!);
    tabs.getByRole('link', { name: 'Home', hidden: true }).focus();
    await user.tab();
    expect(document.activeElement).toBe(tabs.getByRole('link', { name: 'Platforms', hidden: true }));
    await user.tab(); await user.tab(); await user.tab();
    expect(document.activeElement).toBe(tabs.getByRole('button', { name: 'More', hidden: true }));
  });

  it('Memory (under More) marks no phone tab as current, as in the workshop', () => {
    frame({ current: 'memory' });
    const tabs = within(screen.getAllByRole('navigation', { hidden: true })[1]!);
    expect(tabs.queryByRole('link', { current: 'page', hidden: true })).toBeNull();
    expect(tabs.getByRole('button', { name: 'More', hidden: true }).getAttribute('aria-current')).toBeNull();
  });

  it('onNavigate: rail, mark, phone tabs, More and account entries report their destination; modified clicks keep the href', async () => {
    const nav = vi.fn();
    const user = userEvent.setup();
    frame({ onNavigate: nav, current: 'home' });
    const [rail, phone] = screen.getAllByRole('navigation', { hidden: true });
    await user.click(within(rail!).getByRole('link', { name: 'Ready', hidden: true }));
    await user.click(within(rail!).getByRole('link', { name: 'Platforms', hidden: true }));
    await user.click(within(rail!).getByRole('link', { name: 'Reports', hidden: true }));
    await user.click(within(rail!).getByRole('link', { name: 'Memory', hidden: true }));
    await user.click(within(rail!).getByRole('link', { name: 'Team, 2', hidden: true }));
    await user.click(within(phone!).getByRole('link', { name: 'Platforms', hidden: true }));
    await user.click(within(phone!).getByText('More'));
    await user.click(await screen.findByRole('menuitem', { name: 'Memory' }));
    expect(nav.mock.calls.map((c) => c[0])).toEqual([
      { to: 'home' }, { to: 'platforms' }, { to: 'reports' }, { to: 'memory' }, { to: 'team' }, { to: 'platforms' }, { to: 'memory' },
    ]);
    nav.mockClear();
    await user.keyboard('{Control>}');
    await user.click(within(rail!).getByRole('link', { name: 'Platforms', hidden: true }));
    await user.keyboard('{/Control}');
    expect(nav).not.toHaveBeenCalled();
  });

  it('without onNavigate the links keep their hrefs and a click is not intercepted', async () => {
    frame();
    const [rail] = screen.getAllByRole('navigation', { hidden: true });
    const a = within(rail!).getByRole('link', { name: 'Platforms', hidden: true });
    expect(a.getAttribute('href')).toBe('#platforms');
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    a.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});

describe('PortalFrame workshop chrome (RDY-364)', () => {
  it('account initials follow the workshop rule: first letters of the first two words (Ramon Dela Cruz = RD)', () => {
    frame();
    const rail = within(screen.getAllByRole('navigation', { hidden: true })[0]!);
    expect(rail.getByRole('button', { name: /Account menu/, hidden: true }).textContent).toBe('RD');
  });
  it('phone nav has no count badge (the workshop pnav shows none); the count stays in the accessible name', () => {
    frame();
    const phone = within(screen.getAllByRole('navigation', { hidden: true })[1]!);
    expect(phone.getByRole('link', { name: 'Team, 2', hidden: true }).textContent).toBe('Team');
  });
});

describe('DetailTopBar and hideSheetBarOnPhone (RDY-316)', () => {
  const detail = (onAsk = () => {}) => render(
    <PortalFrame
      current="platforms"
      detail
      topBar={<DetailTopBar back={<a href="#platforms">Back</a>} title="Autoworks" onAskLeda={onAsk} account={{ name: 'Maria Santos', email: 'm@x.ph', role: 'Owner' }} />}
      sheetBar={<div>Sheet bar</div>}
      hideSheetBarOnPhone
    ><h1>Content</h1></PortalFrame>,
  );

  it('renders back, title, Ask Leda and the account avatar in the phone top bar', async () => {
    const ask = vi.fn();
    const user = userEvent.setup();
    detail(ask);
    const header = within(screen.getByRole('banner', { hidden: true }));
    expect(header.getByRole('link', { name: 'Back', hidden: true })).toBeTruthy();
    expect(header.getByText('Autoworks')).toBeTruthy();
    expect(header.getByRole('button', { name: /Ask Leda/, hidden: true })).toBeTruthy();
    expect(header.getAllByRole('button', { name: /Account menu/, hidden: true })).toHaveLength(1);
    expect(header.getByRole('button', { name: /Account menu/, hidden: true }).textContent).toBe('MS');
    await user.click(header.getByRole('button', { name: /Ask Leda/, hidden: true }));
    expect(ask).toHaveBeenCalledTimes(1);
  });

  it('hides the sheet bar on phone when the option is set, and keeps it otherwise', () => {
    const { unmount } = detail();
    expect(screen.getByText('Sheet bar').parentElement!.className).toContain('max-[640px]:hidden');
    unmount();
    render(<PortalFrame current="platforms" sheetBar={<div>Sheet bar</div>}><h1>Content</h1></PortalFrame>);
    expect(screen.getByText('Sheet bar').parentElement!.className).not.toContain('max-[640px]:hidden');
  });

  it('the detail frame has one main and one h1 and no phone nav', () => {
    detail();
    expect(screen.getAllByRole('main', { hidden: true })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 1, hidden: true })).toHaveLength(1);
    expect(screen.getAllByRole('navigation', { hidden: true })).toHaveLength(1);
  });

  it('is exported from the package', () => {
    expect(pkg.PortalFrame).toBe(PortalFrame);
    expect(pkg.DetailTopBar).toBe(DetailTopBar);
  });
});

describe('PortalFrame phone nav forced-colors (RDY-321)', () => {
  it('marks the current phone tab with a Highlight bar', () => {
    frame();
    const cur = screen.getAllByRole('link', { hidden: true }).filter((a) => a.getAttribute('aria-current') === 'page' && a.className.includes('border-t-4'));
    expect(cur.length).toBeGreaterThan(0);
    expect(cur[0]!.className).toContain('forced-colors:border-[Highlight]');
  });
});
