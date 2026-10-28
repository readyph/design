import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

afterEach(cleanup);
const opts = [
  { value: 'a', label: 'All', count: 12 },
  { value: 'b', label: 'On', count: 8 },
  { value: 'c', label: 'Off', disabled: true },
  { value: 'd', label: 'Custom' },
];

describe('SegmentedControl pressed', () => {
  it('exposes a group of aria-pressed buttons and defaults to the first', () => {
    render(<SegmentedControl options={opts} aria-label="Filter" />);
    expect(screen.getByRole('group', { name: 'Filter' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /All/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: /On/ }).getAttribute('aria-pressed')).toBe('false');
  });
  it('renders counts and calls onChange once per change', () => {
    const fn = vi.fn();
    render(<SegmentedControl options={opts} onChange={fn} />);
    expect(screen.getByText('12')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /On/ }));
    fireEvent.click(screen.getByRole('button', { name: /On/ }));
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });
  it('does not select disabled segments and disables all when asked', () => {
    const fn = vi.fn();
    const { rerender } = render(<SegmentedControl options={opts} onChange={fn} />);
    fireEvent.click(screen.getByRole('button', { name: 'Off' }));
    expect(fn).not.toHaveBeenCalled();
    rerender(<SegmentedControl options={opts} disabled />);
    expect((screen.getByRole('button', { name: /All/ }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('is controlled when value is given', () => {
    render(<SegmentedControl options={opts} value="d" />);
    fireEvent.click(screen.getByRole('button', { name: /All/ }));
    expect(screen.getByRole('button', { name: 'Custom' }).getAttribute('aria-pressed')).toBe('true');
  });
  it('uses the 28px segment, 13px text', () => {
    render(<SegmentedControl options={opts} />);
    const cls = screen.getByRole('button', { name: /All/ }).className;
    expect(cls).toContain('h-7');
    expect(cls).toContain('text-ui');
  });
});

describe('SegmentedControl radio', () => {
  it('uses radiogroup, aria-checked and a single tab stop', () => {
    render(<SegmentedControl options={opts} semantics="radio" aria-label="Theme" defaultValue="b" />);
    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.getAttribute('tabindex'))).toEqual(['-1', '0', '-1', '-1']);
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
  });
  it('moves with arrows, skipping disabled, wrapping, and Home/End', () => {
    const fn = vi.fn();
    render(<SegmentedControl options={opts} semantics="radio" onChange={fn} />);
    const radios = screen.getAllByRole('radio');
    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[1]);
    fireEvent.keyDown(radios[1], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[3]);
    fireEvent.keyDown(radios[3], { key: 'ArrowRight' });
    expect(document.activeElement).toBe(radios[0]);
    fireEvent.keyDown(radios[0], { key: 'End' });
    expect(document.activeElement).toBe(radios[3]);
    fireEvent.keyDown(radios[3], { key: 'Home' });
    expect(document.activeElement).toBe(radios[0]);
    expect(fn).toHaveBeenLastCalledWith('a');
  });
});

describe('SegmentedControl menu', () => {
  it('uses menuitemradio with aria-checked', () => {
    render(<SegmentedControl options={opts} semantics="menu" />);
    expect(screen.getAllByRole('menuitemradio')[0].getAttribute('aria-checked')).toBe('true');
  });
});
