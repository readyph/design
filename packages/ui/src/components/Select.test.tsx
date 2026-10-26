// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Bravo', disabled: true },
  { value: 'c', label: 'Charlie' },
];

afterEach(cleanup);

describe('Select', () => {
  it('opens, skips disabled, chooses with Enter', async () => {
    const onValueChange = vi.fn();
    render(<Select aria-label="x" options={options} onValueChange={onValueChange} />);
    const btn = screen.getByRole('combobox');
    expect(btn.getAttribute('aria-haspopup')).toBe('listbox');
    btn.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('c');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });
  it('type-ahead picks the matching option', async () => {
    const onValueChange = vi.fn();
    render(<Select aria-label="x" options={options} onValueChange={onValueChange} />);
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{ArrowDown}ch{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('c');
  });
  it('marks the selected option and closes on Escape', async () => {
    render(<Select aria-label="x" options={options} defaultValue="c" />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: /Charlie/ }).getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
  it('exposes the active option and keeps option names clean', async () => {
    render(<Select aria-label="x" options={options} defaultValue="c" />);
    const box = screen.getByRole('combobox');
    box.focus();
    await userEvent.keyboard('{ArrowDown}');
    const opt = screen.getByRole('option', { name: 'Charlie' });
    expect(box.getAttribute('aria-activedescendant')).toBe(opt.id);
  });
  it('PageDown/PageUp clamp to the last/first enabled option', async () => {
    render(<Select aria-label="x" options={options} />);
    const box = screen.getByRole('combobox');
    box.focus();
    await userEvent.keyboard('{ArrowDown}{PageDown}');
    expect(box.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Charlie' }).id);
    await userEvent.keyboard('{PageUp}');
    expect(box.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Alpha' }).id);
  });
  it('fires a bubbling change on the hidden input', async () => {
    const onChange = vi.fn();
    const { container } = render(<form><Select aria-label="x" name="f" options={options} /></form>);
    container.querySelector('form')!.addEventListener('change', onChange);
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalled();
    expect((container.querySelector('input[name=f]') as HTMLInputElement).value).toBe('c');
  });
  it('wraps long option labels instead of truncating', async () => {
    const long = 'Read stock from Pasig Loyalty Program for Fieldwork Rewards and Seasonal Offers';
    render(<Select aria-label="x" options={[{ value: 'l', label: long }]} />);
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{ArrowDown}');
    const label = screen.getByText(long);
    expect(label.className).not.toContain('truncate');
    expect(label.className).toContain('overflow-wrap:anywhere');
    expect(screen.getByRole('listbox').className).toContain('w-max');
  });
});
