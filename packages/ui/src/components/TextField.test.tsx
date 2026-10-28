import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';
import { TextField, Textarea } from './TextField';

afterEach(cleanup);

const check = async (el: HTMLElement) => {
  const r = await axe.run(el, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
};

describe('TextField', () => {
  it('has a real label tied to the input', () => {
    render(<TextField label="Name" />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    const label = document.querySelector('label') as HTMLLabelElement;
    expect(label.htmlFor).toBe(input.id);
  });

  it('puts the hint in aria-describedby', () => {
    render(<TextField label="Name" hint="Like a branch name." />);
    const input = screen.getByLabelText('Name');
    const hint = screen.getByText('Like a branch name.');
    expect(input.getAttribute('aria-describedby')).toContain(hint.id);
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('error replaces the hint, sets aria-invalid and is described', () => {
    render(<TextField label="Name" hint="Hint" error="Required" />);
    const input = screen.getByLabelText('Name');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toContain(screen.getByText('Required').id);
    expect(screen.queryByText('Hint')).toBeNull();
  });

  it('keeps a caller aria-describedby', () => {
    render(<TextField label="Name" aria-describedby="extra" hint="h" />);
    expect(screen.getByLabelText('Name').getAttribute('aria-describedby')).toMatch(/^extra /);
  });

  it('unit is a suffix in the description, not the name', () => {
    render(<TextField label="Capacity" unit="bays" type="number" />);
    const input = screen.getByRole('spinbutton', { name: 'Capacity' });
    const unit = screen.getByText('bays');
    expect(input.getAttribute('aria-describedby')).toContain(unit.id);
    expect(input.parentElement?.contains(unit)).toBe(true);
    expect(screen.queryByRole('spinbutton', { name: /bays/ })).toBeNull();
  });

  it.each([['number', 'spinbutton'], ['email', 'textbox'], ['tel', 'textbox'], ['text', 'textbox']] as const)('type %s renders that input type', (type, role) => {
    render(<TextField label="X" type={type} />);
    expect(screen.getByRole(role).getAttribute('type')).toBe(type);
  });

  it('passes required and disabled to the input', () => {
    render(<TextField label="Name" required disabled />);
    const input = screen.getByLabelText(/Name/) as HTMLInputElement;
    expect(input.required).toBe(true);
    expect(input.disabled).toBe(true);
  });

  it('has no axe violations', async () => {
    const { container } = render(<><TextField label="A" hint="h" unit="bays" /><TextField label="B" error="bad" required /><TextField label="C" disabled /></>);
    await check(container);
  });
});

describe('Textarea', () => {
  it('has label, rows, hint and error wiring', () => {
    const { rerender } = render(<Textarea label="Notes" rows={5} hint="Short." />);
    const area = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    expect(area.rows).toBe(5);
    expect(area.getAttribute('aria-describedby')).toContain(screen.getByText('Short.').id);
    rerender(<Textarea label="Notes" rows={5} error="Too long" />);
    expect(screen.getByLabelText('Notes').getAttribute('aria-invalid')).toBe('true');
  });

  it('defaults to 3 rows and has no axe violations', async () => {
    const { container } = render(<Textarea label="Notes" />);
    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).rows).toBe(3);
    await check(container);
  });

  it('large size, quiet label and no mark keep the older page look', () => {
    const { container } = render(<TextField label="Name" required requiredMark={false} size="large" labelTone="quiet" />);
    expect(container.querySelector('label')?.className).not.toContain('after:content');
    expect(container.querySelector('label')?.className).toContain('text-muted');
    expect(container.querySelector('.h-\\[var\\(--ctl-dropdown\\)\\]')).not.toBeNull();
    expect((screen.getByLabelText('Name') as HTMLInputElement).required).toBe(true);
  });

  it('invalid marks the field without error text', () => {
    render(<TextField label="Title" invalid />);
    expect(screen.getByLabelText('Title').getAttribute('aria-invalid')).toBe('true');
    expect(document.querySelector('[role=alert]')).toBeNull();
  });
});
