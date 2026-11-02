import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MoneyField } from './MoneyField';

afterEach(cleanup);

describe('MoneyField', () => {
  it('shows PHP as the default unit and accepts typing', () => {
    render(<MoneyField label="Amount" />);
    expect(screen.getByText('PHP')).toBeTruthy();
    const input = screen.getByLabelText('Amount') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '250' } });
    expect(input.value).toBe('250');
  });

  it('takes another unit', () => {
    render(<MoneyField label="Discount" unit="%" />);
    expect(screen.getByText('%')).toBeTruthy();
  });
});
