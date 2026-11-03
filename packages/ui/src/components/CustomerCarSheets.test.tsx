import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { CustomerSheet } from './CustomerSheet';
import { CarSheet } from './CarSheet';
import { customers } from './sms/data';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('CustomerSheet', () => {
  it('new: save disabled and says what is missing; no axe violations', async () => {
    const { container } = render(<CustomerSheet onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Still needed: a name, a phone number, one car with plate, make and model.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Save customer' }) as HTMLButtonElement).disabled).toBe(true);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('edit: keeps a car with services without Remove; no axe violations', async () => {
    const { container } = render(<CustomerSheet customer={customers[0]!} keepIds={['v01']} onSave={() => {}} onClose={() => {}} />);
    expect(screen.getAllByRole('button', { name: /^Remove car/ })).toHaveLength(1);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('duplicate phone names its owner and links to them', async () => {
    const onOpen = vi.fn();
    const { container } = render(<CustomerSheet customer={customers[2]!} onSave={() => {}} onOpenExisting={onOpen} />);
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: customers[0]!.phone } });
    expect(screen.getByText('Maricel Reyes already has this number')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open Maricel' }));
    expect(onOpen).toHaveBeenCalledWith(customers[0]);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('edited then Cancel asks before leaving', () => {
    const onClose = vi.fn();
    render(<CustomerSheet customer={customers[0]!} onSave={() => {}} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Maricel R' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Discard your changes?')).toBeTruthy();
  });
});

describe('CarSheet', () => {
  it('add: needs plate, make and model; no axe violations', async () => {
    const { container } = render(<CarSheet customer={customers[0]!} onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Still needed: a plate, a make, a model.')).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('edit: no axe violations', async () => {
    const { container } = render(<CarSheet customer={customers[0]!} car={customers[0]!.vehicles[1]!} onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByText('Edit NDH 5502')).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('duplicate plate names its owner', async () => {
    const { container } = render(<CarSheet customer={customers[1]!} car={{ ...customers[1]!.vehicles[0]!, plate: 'NBC 4521' }} onSave={() => {}} onClose={() => {}} />);
    expect(screen.getByText('NBC 4521 is already on Maricel Reyes')).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
