// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { LedaNote, LedaNoteLink, LedaRefusal } from './LedaNote';

afterEach(cleanup);

describe('LedaNote', () => {
  it('is a named note with a decorative tile and the text in reading order', () => {
    const { container } = render(<LedaNote byline="Leda, 9:12 AM">Reorder before Friday.</LedaNote>);
    const n = screen.getByRole('note', { name: 'Leda note' });
    expect(n.textContent).toBe('Reorder before Friday.Leda, 9:12 AM');
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[role=img]')).toBeNull();
  });
  it('omits the byline when not given and never truncates long text', () => {
    const long = 'x'.repeat(300);
    render(<LedaNote>{long}</LedaNote>);
    const n = screen.getByRole('note');
    expect(n.querySelectorAll('p')).toHaveLength(1);
    expect(n.textContent).toBe(long);
    expect(n.className).toContain('[overflow-wrap:anywhere]');
    expect(n.className).not.toMatch(/truncate|line-clamp/);
  });
  it('lets the caller add classes and a label but keeps the box', () => {
    const ref = createRef<HTMLDivElement>();
    render(<LedaNote ref={ref} label="Leda on stock" className="mt-4 bg-surface px-0">Hi.</LedaNote>);
    expect(screen.getByRole('note', { name: 'Leda on stock' })).toBe(ref.current);
    expect(ref.current?.className).toContain('mt-4');
    expect(ref.current?.className).toContain('bg-raised');
    expect(ref.current?.className).not.toContain('bg-surface');
    expect(ref.current?.className).toContain('px-3');
  });
});

describe('LedaRefusal', () => {
  it('shows the reason with a hidden icon and a way out, and is not an alert', () => {
    const { container } = render(<LedaRefusal action={<LedaNoteLink href="/a">Open Auto Works</LedaNoteLink>}>Leda can't write to Repair shop yet.</LedaRefusal>);
    expect(screen.getByRole('note', { name: "Leda can't do this" })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('link', { name: 'Open Auto Works' }).getAttribute('href')).toBe('/a');
  });
  it('renders without an action', () => {
    render(<LedaRefusal>Leda can't see Payroll.</LedaRefusal>);
    expect(screen.getByRole('note').querySelectorAll('a,button')).toHaveLength(0);
  });
});
