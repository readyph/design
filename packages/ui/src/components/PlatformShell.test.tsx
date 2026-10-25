// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PlatformShell } from './PlatformShell';

afterEach(cleanup);

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
});
