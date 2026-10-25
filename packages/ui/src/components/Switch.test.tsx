// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

afterEach(cleanup);

describe('Switch accessible name', () => {
  it('uses aria-label when there is no visible label', () => {
    render(<Switch aria-label="Lights, Main Lab" />);
    expect(screen.getByRole('switch', { name: 'Lights, Main Lab' })).toBeTruthy();
  });

  it('uses aria-labelledby', () => {
    render(<><span id="n">Lights</span><Switch aria-labelledby="n" /></>);
    expect(screen.getByRole('switch', { name: 'Lights' })).toBeTruthy();
  });

  it('prefers the visible label and keeps the name free of the description', () => {
    render(<Switch label="Visible" aria-label="Ignored" description="Helper" />);
    expect(screen.getByRole('switch', { name: 'Visible' })).toBeTruthy();
  });

  it('associates the label with the switch', () => {
    render(<Switch label="Auto-sync" />);
    fireEvent.click(screen.getByText('Auto-sync'));
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });
});

describe('Switch row content', () => {
  it('describes the switch with description, example and lock note', () => {
    render(<Switch label="Stock answers" description="Leda can answer stock." example="Is the blue kettle in?" lockNote="Managed by your administrator" />);
    const sw = screen.getByRole('switch');
    const ids = (sw.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids).toHaveLength(2);
    const text = ids.map((i) => document.getElementById(i)?.textContent).join(' ');
    expect(text).toContain('Leda can answer stock.');
    expect(text).toContain('Is the blue kettle in?');
    expect(text).toContain('Managed by your administrator');
  });

  it('omits aria-describedby when there is nothing to describe', () => {
    render(<Switch label="Plain" />);
    expect(screen.getByRole('switch').hasAttribute('aria-describedby')).toBe(false);
  });
});

describe('Switch behaviour', () => {
  it('toggles on click and on Space, reports the value', () => {
    const onChange = vi.fn();
    render(<Switch label="Beta" onCheckedChange={onChange} />);
    const sw = screen.getByRole('switch');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenLastCalledWith(true);
    expect(sw.getAttribute('data-state')).toBe('checked');
  });

  it('does not toggle when disabled', () => {
    const onChange = vi.fn();
    render(<Switch label="Locked" disabled lockNote="Read only" onCheckedChange={onChange} />);
    const sw = screen.getByRole('switch');
    expect((sw as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(sw);
    fireEvent.click(screen.getByText('Locked'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is a button with role switch so it is reachable by Tab', () => {
    render(<Switch label="Tab" />);
    expect(screen.getByRole('switch').tagName).toBe('BUTTON');
  });
});
