import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { useState } from 'react';
import { CustomerField } from './CustomerField';
import { CarFields } from './CarFields';
import { blankCar } from './sms/customersModel';
import { customers } from './sms/data';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('CustomerField', () => {
  it('lookup has no axe violations', async () => {
    const { container } = render(<CustomerField customer={null} vehicleId="" onPick={() => {}} onClear={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('picked customer with two cars has no axe violations and offers Change', async () => {
    const onClear = vi.fn();
    const { container } = render(<CustomerField customer={customers[0]!} vehicleId="v01" onPick={() => {}} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: /Change customer/ }));
    expect(onClear).toHaveBeenCalled();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('no match to new customer opens the form prefilled with the typed name', async () => {
    const { container } = render(<CustomerField customer={null} vehicleId="" initialQuery="Lorna Bautista" onPick={() => {}} onClear={() => {}} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'New customer' }).at(-1)!);
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Lorna Bautista');
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});

function Dup() {
  const [car, setCar] = useState({ ...blankCar('NBC 4521'), make: 'Toyota', model: 'Vios', year: '2016' });
  return <CarFields car={car} onChange={(p) => setCar((x) => ({ ...x, ...p }))} onOpenTwin={() => {}} />;
}
describe('CarFields', () => {
  it('duplicate plate names its owner and has no axe violations', async () => {
    const { container } = render(<Dup />);
    expect(screen.getByText('NBC 4521 is already on Maricel Reyes')).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('compact has no axe violations', async () => {
    const { container } = render(<CarFields car={blankCar()} compact onChange={() => {}} />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
