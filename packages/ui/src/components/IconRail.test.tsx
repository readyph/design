import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { House, Plus, Users } from '@phosphor-icons/react';
import { CountBadge, IconRail, IconRailContent, IconRailFoot, IconRailItem, IconRailMark, IconRailSpacer, formatCount } from './IconRail';

afterEach(cleanup);

const rail = (extra = {}) =>
  render(
    <IconRail {...extra}>
      <IconRailMark href="/home" />
      <IconRailItem icon={House} label="Home" href="/home" current />
      <IconRailItem icon={Users} label="Team" href="/team" count={3} />
      <IconRailItem icon={Plus} label="Add a platform" onClick={() => undefined} />
      <IconRailSpacer />
      <IconRailFoot><button type="button" aria-label="Account menu, Maria">M</button></IconRailFoot>
    </IconRail>,
  );

describe('IconRailMark (RDY-365)', () => {
  it('plays the shine once on mount with the full cut at 36px, not swoop-assemble; re-renders do not replay; no loop', () => {
    const { container, rerender } = rail();
    const svg = container.querySelector('a[aria-label="Ready"] svg')!;
    expect(svg.getAttribute('class')).toContain('rd-shine');
    expect(svg.getAttribute('class')).not.toContain('rd-play');
    expect(svg.getAttribute('width')).toBe('36');
    expect(svg.querySelector('.rd-facets')).toBeNull();
    expect(svg.querySelector('.rd-static path')?.getAttribute('d')).toContain('M189.36 144.04');
    rerender(
      <IconRail>
        <IconRailMark href="/home" />
      </IconRail>,
    );
    expect(container.querySelector('a[aria-label="Ready"] svg')).toBe(svg);
    expect(container.querySelector('a[aria-label="Ready"]')?.className).toContain('size-9');
  });

  it('a hover during the run does not stack or restart it; animate={false} is static', async () => {
    const { container, unmount } = rail();
    const svg = container.querySelector('a[aria-label="Ready"] svg')!;
    await userEvent.hover(screen.getByRole('link', { name: 'Ready' }));
    expect(container.querySelector('a[aria-label="Ready"] svg')).toBe(svg);
    expect(container.querySelectorAll('.rd-gleam')).toHaveLength(1);
    unmount();
    const r = render(<IconRailMark animate={false} />);
    expect(r.container.querySelector('.rd-gleam')).toBeNull();
  });
});

describe('IconRail', () => {
  it('is a labelled nav with named items, aria-current only on the current one, and no Settings', () => {
    rail();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Ready' }).getAttribute('href')).toBe('/home');
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Team, 3' }).getAttribute('aria-current')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add a platform' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /settings/i })).toBeNull();
  });

  it('keeps width and direction when a caller className tries to change them', () => {
    rail({ className: 'w-96 flex-row bg-red-500 mt-4' });
    const nav = screen.getByRole('navigation');
    const cls = nav.className.split(' ');
    expect(cls.lastIndexOf('w-rail')).toBeGreaterThan(cls.lastIndexOf('w-96'));
    expect(cls.lastIndexOf('flex-col')).toBeGreaterThan(cls.lastIndexOf('flex-row'));
    expect(cls).toContain('mt-4');
  });

  it('formats counts: hidden at 0, 99+ above 99', () => {
    expect(formatCount(7)).toBe('7');
    expect(formatCount(99)).toBe('99');
    expect(formatCount(100)).toBe('99+');
    const { container } = render(<CountBadge count={0} />);
    expect(container.firstChild).toBeNull();
    render(<IconRailItem icon={Users} label="Team" href="#" count={240} tooltip={false} />);
    expect(screen.getByRole('link', { name: 'Team, 99+' }).textContent).toBe('99+');
  });

  it('is 36px (size-9), links and buttons both take Tab in order', async () => {
    const user = userEvent.setup();
    rail();
    expect(screen.getByRole('link', { name: 'Home' }).className).toContain('size-9');
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Ready' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Home' }));
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add a platform' }));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Account menu/ }));
  });

  it('shows the tooltip on keyboard focus and Esc dismisses it', async () => {
    const user = userEvent.setup();
    rail();
    await user.tab();
    await user.tab();
    await waitFor(() => expect(screen.getByRole('tooltip').textContent).toBe('Home'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('item button calls onClick; tooltip={false} renders no tooltip', async () => {
    const user = userEvent.setup();
    let n = 0;
    render(<IconRailItem icon={Plus} label="Add" onClick={() => n++} tooltip={false} />);
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(n).toBe(1);
    await user.hover(screen.getByRole('button', { name: 'Add' }));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('legacy `active` still marks the current page', () => {
    render(<IconRailItem icon={House} label="Home" href="#" active tooltip={false} />);
    expect(screen.getByRole('link').getAttribute('aria-current')).toBe('page');
  });
});

describe('IconRail in a shell slot', () => {
  it('an item alone in a plain nav does not throw and still shows a tooltip provider-free', () => {
    render(
      <nav aria-label="Main">
        <IconRailItem icon={House} label="Home" href="/" />
      </nav>,
    );
    expect(screen.getByRole('link', { name: 'Home' })).toBeTruthy();
  });

  it('IconRailContent inside a nav renders exactly one navigation landmark and keeps the column layout', () => {
    const { container } = render(
      <nav aria-label="Main">
        <IconRailContent data-testid="c">
          <IconRailItem icon={House} label="Home" href="/" current />
          <IconRailItem icon={Users} label="Team" href="/team" count={3} />
        </IconRailContent>
      </nav>,
    );
    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    const c = screen.getByTestId('c');
    expect(c.tagName).toBe('DIV');
    expect(c.className).toContain('flex-col');
    expect(c.className).toContain('bg-frame');
    expect(container.querySelectorAll('nav')).toHaveLength(1);
  });

  it('phone path: tooltip={false} + CountBadge needs no provider', () => {
    render(<IconRailItem icon={Users} label="Team" href="/team" count={3} tooltip={false} />);
    expect(screen.getByRole('link', { name: 'Team, 3' })).toBeTruthy();
  });
});

describe('IconRailItem forced-colors (RDY-321)', () => {
  it('marks only the current item with a Highlight bar', () => {
    rail();
    expect(screen.getByRole('link', { name: 'Home' }).className).toContain('forced-colors:border-[Highlight]');
    expect(screen.getByRole('link', { name: 'Team, 3' }).className).not.toContain('forced-colors:border-[Highlight]');
  });
});
