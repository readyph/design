import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CustomerField as ProtoField } from './CustomerField';
import { CustomerField as PromotedField } from '../../../components/CustomerField';
import { WizardDataProvider, seedWizardData } from '../../../components/sms/wizardData';
import { customers, type Customer } from '../data';

const noCar: Customer = { id: 'c-nocar', name: 'Zztest Customer 1', phone: '0917 000 1111', since: '2026-11-01', vehicles: [] };

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  class RO { observe() {} unobserve() {} disconnect() {} }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;
});
afterEach(() => { cleanup(); customers.splice(customers.indexOf(noCar), 1); });

const withData = (Field: typeof ProtoField) => (p: React.ComponentProps<typeof ProtoField>) => {
  const d = seedWizardData();
  return <WizardDataProvider data={{ ...d, customers: [...d.customers, noCar] }}><Field {...p} /></WizardDataProvider>;
};

describe.each([['prototype', ProtoField], ['promoted', withData(PromotedField)]] as const)('%s CustomerField with a customer who has no vehicles', (_n, Field) => {
  it('lists the customer without throwing and picking leaves the car empty', async () => {
    customers.push(noCar);
    const onPick = vi.fn();
    await act(async () => { render(<Field customer={null} vehicleId="" initialQuery="Zztest" onPick={onPick} onClear={() => {}} />); });
    const input = screen.getByRole('combobox');
    await act(async () => { fireEvent.focus(input); fireEvent.change(input, { target: { value: 'Zztest' } }); });
    const row = await screen.findByText('Zztest Customer 1');
    expect(screen.getByText(/No car yet/)).toBeTruthy();
    await act(async () => { fireEvent.click(row); });
    expect(onPick).toHaveBeenCalledWith(noCar, '');
  });

  it('a picked customer with no car asks for a car', () => {
    render(<Field customer={noCar} vehicleId="" onPick={() => {}} onClear={() => {}} />);
    expect(screen.getByText('No car on file.')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add car/ })).toBeTruthy();
  });
});
