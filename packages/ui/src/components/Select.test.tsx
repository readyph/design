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
    const btn = screen.getByRole('button');
    expect(btn.getAttribute('aria-haspopup')).toBe('listbox');
    btn.focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('c');
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });
  it('type-ahead picks the matching option', async () => {
    const onValueChange = vi.fn();
    render(<Select aria-label="x" options={options} onValueChange={onValueChange} />);
    screen.getByRole('button').focus();
    await userEvent.keyboard('{ArrowDown}ch{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('c');
  });
  it('marks the selected option and closes on Escape', async () => {
    render(<Select aria-label="x" options={options} defaultValue="c" />);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('option', { name: /Charlie/ }).getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
