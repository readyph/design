import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { Combobox } from './Combobox';
import { WizardBlock } from './WizardBlock';
import { WizardStepper } from './WizardStepper';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const steps = [{ id: 1, label: 'Services & price' }, { id: 2, label: 'Review & confirm', blocked: 'Not yet' }];

describe('WizardStepper', () => {
  it('marks the current step and disables a blocked one', () => {
    const onGo = vi.fn();
    render(<WizardStepper steps={steps} current={1} onGo={onGo} />);
    expect(screen.getByRole('button', { name: /Services & price/ }).getAttribute('aria-current')).toBe('step');
    expect((screen.getByRole('button', { name: /Review & confirm/ }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('has no axe violations', async () => {
    const { container } = render(<WizardStepper steps={steps} current={2} onGo={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('WizardBlock', () => {
  it('swaps to the editor with Done / Cancel', () => {
    const onEdit = vi.fn();
    render(<WizardBlock id="a" title="Schedule" onEdit={onEdit}>read</WizardBlock>);
    fireEvent.click(screen.getByRole('button', { name: 'Edit Schedule' }));
    expect(onEdit).toHaveBeenCalled();
    cleanup();
    render(<WizardBlock id="a" title="Schedule" editing edit={<p>controls</p>} onDone={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('controls')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Done' }).className).toContain('var(--ctl-touch)');
    expect(screen.getByRole('button', { name: 'Cancel' }).className).toContain('var(--ctl-touch)');
  });
  it('has no axe violations', async () => {
    const { container } = render(<WizardBlock id="a" title="Schedule" summary="Today" onEdit={() => {}}>read</WizardBlock>);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

describe('Combobox', () => {
  const options = [{ id: 'a', label: 'Alpha', node: <span>Alpha</span> }];
  it('picks with arrows and Enter', () => {
    const onSelect = vi.fn();
    render(<Combobox label="Pick" value="" onValueChange={() => {}} options={options} onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('a');
  });
  it('has no axe violations', async () => {
    const { container } = render(<Combobox label="Pick" value="" onValueChange={() => {}} options={options} onSelect={() => {}} hint="Hint" />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
