import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ActionLink, BackLink } from './ActionLink';

afterEach(cleanup);

describe('ActionLink', () => {
  it('renders an anchor with href, a button without, and quiet as plain text', () => {
    render(<><ActionLink href="/x">Open</ActionLink><ActionLink>Do</ActionLink><ActionLink quiet>Settled</ActionLink></>);
    expect(screen.getByRole('link', { name: 'Open' }).getAttribute('href')).toBe('/x');
    expect(screen.getByRole('button', { name: 'Do' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Settled' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Settled' })).toBeNull();
  });
  it('hover is colour only: no underline, background or padding shift classes', () => {
    render(<ActionLink href="#">Open</ActionLink>);
    const c = screen.getByRole('link').className;
    expect(c).toContain('hover:text-lk-hover');
    expect(c).toContain('no-underline');
    expect(c).not.toMatch(/hover:(bg|border|p|underline)/);
  });
});

describe('BackLink', () => {
  it('is a plain text link with a 44px phone height', () => {
    render(<BackLink href="#">Today</BackLink>);
    const c = screen.getByRole('link', { name: 'Today' }).className;
    expect(c).toContain('hover:text-muted');
    expect(c).toContain('max-[760px]:h-11');
  });
});
