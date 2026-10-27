// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PlatformShell } from './PlatformShell';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const phone = (on: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q.includes('max-width'), addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));

const slots = {
  rail: <a href="#">Home</a>,
  place: <p>Map</p>,
  placeLabel: 'Platforms',
  sheetBar: <p>Bar</p>,
  status: <p>All running</p>,
  topBar: <p>Top</p>,
  phoneNav: <a href="#">Team</a>,
};

describe('PlatformShell', () => {
  it('renders the landmarks: 2 labelled navs, labelled section, one main, labelled footer', () => {
    render(<PlatformShell {...slots}>Body</PlatformShell>);
    expect(screen.getAllByRole('navigation', { name: 'Main', hidden: true })).toHaveLength(2);
    expect(screen.getByRole('region', { name: 'Platforms' }).tagName).toBe('SECTION');
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getByRole('contentinfo', { name: 'Status' }).tagName).toBe('FOOTER');
    expect(screen.getByRole('banner', { hidden: true }).tagName).toBe('HEADER');
  });
  it('sheet is a named container with border, radius and inset', () => {
    render(<PlatformShell {...slots}>Body</PlatformShell>);
    const main = screen.getByRole('main');
    for (const c of ['@container/sheet', 'border', 'rounded-sheet', 'bg-surface', 'mt-inset', 'mr-inset']) expect(main.className).toContain(c);
  });
  it('DOM order is focus order: top bar, rail, place, sheet, status, phone nav', () => {
    const { container } = render(<PlatformShell {...slots}>Body</PlatformShell>);
    const tags = Array.from(container.firstElementChild!.children).map((e) => e.tagName);
    expect(tags).toEqual(['HEADER', 'NAV', 'SECTION', 'MAIN', 'FOOTER', 'NAV']);
  });
  it('phone: place shows by default, detail shows the sheet; action bar only renders when given', () => {
    const { rerender } = render(<PlatformShell {...slots}>Body</PlatformShell>);
    expect(screen.getByRole('main').className).toContain('max-[640px]:hidden');
    expect(screen.getByRole('region').className).not.toContain('max-[640px]:hidden');
    rerender(<PlatformShell {...slots} detail actionBar={<button>Save</button>}>Body</PlatformShell>);
    expect(screen.getByRole('main').className).not.toContain('max-[640px]:hidden');
    expect(screen.getByRole('region').className).toContain('max-[640px]:hidden');
    expect(screen.getByRole('button', { name: 'Save', hidden: true })).toBeTruthy();
  });
  it('phone action bar keeps the bottom safe-area inset (workshop .pbar)', () => {
    render(<PlatformShell {...slots} detail actionBar={<button>Save</button>}>Body</PlatformShell>);
    const bar = screen.getByRole('button', { name: 'Save', hidden: true }).parentElement!;
    expect(bar.className).toContain('max-[640px]:pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]');
    // workshop .pbar: on --frame, 8px 16px, no top border, 44px buttons sharing the row
    expect(bar.className).toContain('max-[640px]:bg-frame');
    expect(bar.className).toContain('max-[640px]:px-4');
    expect(bar.className).not.toContain('border-t');
    expect(bar.className).toContain('max-[640px]:[&>*]:h-11');
  });
  it('phone detail drops the bottom nav (workshop body.detail .pnav) and its grid row', () => {
    const { container, rerender } = render(<PlatformShell {...slots}>Body</PlatformShell>);
    expect(container.querySelector('[data-shell="phone-nav"]')).toBeTruthy();
    rerender(<PlatformShell {...slots} detail>Body</PlatformShell>);
    expect(container.querySelector('[data-shell="phone-nav"]')).toBeNull();
    expect(container.firstElementChild!.className).not.toContain('60px');
  });
  it('without a place column the sheet takes the column and stays visible on phone', () => {
    render(<PlatformShell {...slots} place={undefined}>Body</PlatformShell>);
    expect(screen.queryByRole('region')).toBeNull();
    expect(screen.getByRole('main').className).not.toContain('max-[640px]:hidden');
  });
  it('omits empty regions', () => {
    const { container } = render(<PlatformShell>Body</PlatformShell>);
    expect(container.querySelector('nav, footer, section')).toBeNull();
  });
  it('caller className cannot override the layout classes', () => {
    const { container } = render(<PlatformShell {...slots} className="block h-10 overflow-visible bg-bad grid-cols-1">x</PlatformShell>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('grid');
    expect(root.className).toContain('h-dvh');
    expect(root.className).toContain('overflow-hidden');
    expect(root.className).not.toMatch(/(^| )block( |$)/);
    expect(root.className).not.toContain('h-10');
    expect(root.className).toContain('grid-cols-[var(--rail)_var(--place)_minmax(0,1fr)]');
  });
  it('hidden attribute wins over display utilities', () => {
    render(<PlatformShell {...slots}>x</PlatformShell>);
    expect(screen.getByRole('main').className).toContain('[&[hidden]]:!hidden');
  });
  describe('phone: one visible main and one h1', () => {
    it('detail (sheet open): the sheet is the only main, the platform name is the only h1', () => {
      phone(true);
      render(<PlatformShell {...slots} detail heading="Auto Works">Body</PlatformShell>);
      const main = screen.getByRole('main');
      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(main.getAttribute('data-shell')).toBe('sheet');
      const h1s = screen.getAllByRole('heading', { level: 1, hidden: true });
      expect(h1s).toHaveLength(1);
      expect(h1s[0].textContent).toBe('Auto Works');
      expect(main.contains(h1s[0])).toBe(true);
    });
    it('place column showing: the place section is the only main and carries the h1 (heading, else placeLabel)', () => {
      phone(true);
      const { rerender } = render(<PlatformShell {...slots} heading="Auto Works">Body</PlatformShell>);
      const main = screen.getByRole('main');
      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(main.tagName).toBe('SECTION');
      expect(main.getAttribute('aria-label')).toBe('Platforms');
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(main.contains(screen.getByRole('heading', { level: 1 }))).toBe(true);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Auto Works');
      rerender(<PlatformShell {...slots}>Body</PlatformShell>);
      expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Platforms');
    });
    it('real focus: switching between place and sheet keeps exactly one main and one h1', () => {
      phone(true);
      const { rerender } = render(<PlatformShell {...slots} heading="Auto Works" place={<button>Open</button>}>Body</PlatformShell>);
      const btn = screen.getByRole('button', { name: 'Open' });
      btn.focus();
      expect(document.activeElement).toBe(btn);
      rerender(<PlatformShell {...slots} heading="Auto Works" place={<button>Open</button>} detail>Body</PlatformShell>);
      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(screen.getByRole('main').getAttribute('data-shell')).toBe('sheet');
      expect(screen.getAllByRole('heading', { level: 1, hidden: true })).toHaveLength(1);
    });
  });
  it('heading={null} opts out of every shell h1, including the phone placeLabel fallback', () => {
    phone(true);
    const { rerender } = render(<PlatformShell {...slots} heading={null}>Body</PlatformShell>);
    expect(screen.queryAllByRole('heading', { level: 1, hidden: true })).toHaveLength(0);
    expect(screen.getByRole('main')).toBeTruthy();
    rerender(<PlatformShell {...slots} heading={null} detail>Body</PlatformShell>);
    expect(screen.queryAllByRole('heading', { level: 1, hidden: true })).toHaveLength(0);
    phone(false);
    rerender(<PlatformShell {...slots} heading={null}>Body</PlatformShell>);
    expect(screen.queryAllByRole('heading', { level: 1, hidden: true })).toHaveLength(0);
  });
  it('desktop: the sheet stays the main, the place stays a region, no h1 unless a heading is given', () => {
    phone(false);
    const { rerender } = render(<PlatformShell {...slots}>Body</PlatformShell>);
    expect(screen.getByRole('main').getAttribute('data-shell')).toBe('sheet');
    expect(screen.getByRole('region', { name: 'Platforms' }).getAttribute('role')).toBeNull();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    rerender(<PlatformShell {...slots} heading="Auto Works">Body</PlatformShell>);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('main').contains(screen.getByRole('heading', { level: 1 }))).toBe(true);
  });
});
