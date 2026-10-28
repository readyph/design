import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { TryIt, type TryItProps } from './TryIt';
import { sampleAbouts, sampleAsk, sampleQuestions } from './TryIt.sample';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const base: TryItProps = { open: true, onOpenChange: () => {}, abouts: sampleAbouts, questions: sampleQuestions, ask: (a, q) => sampleAsk(a, q) };
const settle = async (ms = 900) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
const q = () => screen.getByRole('combobox', { name: 'A customer asks' });

describe('TryIt', () => {
  it('focuses the question on open and asks with the first question', async () => {
    vi.useFakeTimers();
    const ask = vi.fn(base.ask);
    render(<TryIt {...base} ask={ask} />);
    expect(document.activeElement).toBe(q());
    expect(ask).toHaveBeenCalledWith('any', 'prices');
    expect(screen.getByRole('status').textContent).toBe('Thinking…');
    await settle();
    expect(screen.getByRole('status').textContent).toContain('Leda says: An oil change');
    expect(document.activeElement).toBe(q());
  });

  it('filters questions by About and shows the reason', async () => {
    vi.useFakeTimers();
    render(<TryIt {...base} about="parts" />);
    fireEvent.click(q());
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'What time do you open on Saturdays?',
      'Do you have the brake pads for a 2016 Toyota Vios, front axle, ceramic, in stock right now?',
    ]);
    fireEvent.keyDown(q(), { key: 'Escape' });
    await settle();
    expect(screen.getAllByText(/Used the topic “Opening hours”, from Parts Stockroom data/).length).toBeGreaterThan(0);
  });

  it('fixed About is text, not a picker', () => {
    vi.useFakeTimers();
    render(<TryIt {...base} about="auto" aboutFixed />);
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    expect(screen.getByText('Auto Works')).toBeTruthy();
  });

  it('hides the reply until Thinking ends and keeps focus on the question through a mouse pick', async () => {
    vi.useFakeTimers();
    render(<TryIt {...base} />);
    await settle();
    fireEvent.click(q());
    fireEvent.click(screen.getByRole('option', { name: 'Do you have the brake pads for a 2016 Toyota Vios, front axle, ceramic, in stock right now?' }));
    expect(screen.getByRole('status').textContent).toBe('Thinking…');
    await settle();
    expect(screen.getAllByText(/“Parts in stock” is off/).length).toBeGreaterThan(0);
    expect(document.activeElement).toBe(q());
  });

  it('returns focus to the question only when it was lost, never from another control', async () => {
    vi.useFakeTimers();
    render(<TryIt {...base} />);
    const close = screen.getByRole('button', { name: 'Close Try it' });
    close.focus();
    fireEvent.click(q()); // a run starts on a change below
    fireEvent.keyDown(q(), { key: 'Escape' });
    close.focus();
    await settle();
    expect(document.activeElement).toBe(close);
    // lost focus (body) goes back to the question
    (document.activeElement as HTMLElement).blur();
    fireEvent.click(q());
    fireEvent.click(screen.getByRole('option', { name: 'What time do you open on Saturdays?' }));
    (document.activeElement as HTMLElement).blur();
    await settle();
    expect(document.activeElement).toBe(q());
  });

  it('shows an error with Try again that stays focusable and busy while it retries', async () => {
    vi.useFakeTimers();
    let fail = true;
    const ask = vi.fn(() => (fail ? Promise.reject(new Error('x')) : Promise.resolve(sampleAsk('auto', 'prices'))));
    render(<TryIt {...base} about="auto" aboutFixed ask={ask} />);
    await settle();
    const retry = screen.getByRole('button', { name: 'Try again' });
    retry.focus();
    fail = false;
    fireEvent.click(retry);
    expect(retry.getAttribute('aria-disabled')).toBe('true');
    expect(retry.getAttribute('aria-busy')).toBe('true');
    expect(document.activeElement).toBe(retry);
    fireEvent.click(retry);
    expect(ask).toHaveBeenCalledTimes(2);
    await settle();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
    expect(document.activeElement).toBe(q());
  });

  it('asks again with the switches as they are when About changes', async () => {
    vi.useFakeTimers();
    const ask = vi.fn(base.ask);
    render(<TryIt {...base} ask={ask} />);
    await settle();
    fireEvent.click(screen.getByRole('combobox', { name: 'About' }));
    fireEvent.click(screen.getByRole('option', { name: 'The company' }));
    await settle();
    expect(ask).toHaveBeenLastCalledWith('company', 'hours');
  });

  it('has no axe violations (answer, refusal, error)', async () => {
    const { unmount } = render(<TryIt {...base} thinkingMs={0} />);
    await screen.findByText(/Leda says/, { selector: '[role=status]' });
    const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
    unmount();
  });
});
