import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { QuantityStepper } from './QuantityStepper';

afterEach(cleanup);

function Harness({ initial = 3, min }: { initial?: number; min?: number }) {
  const [v, setV] = useState(initial);
  return <QuantityStepper value={v} onValueChange={setV} min={min} productName="Rice" />;
}

describe('QuantityStepper', () => {
  it('steps and labels', () => {
    render(<Harness />);
    fireEvent.click(screen.getByLabelText('One more Rice'));
    expect((screen.getByLabelText('Quantity of Rice', { selector: 'input' }) as HTMLInputElement).value).toBe('4');
  });
  it('clamps 0 to 1 with a note', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Quantity of Rice', { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.value).toBe('1');
    expect(screen.getByText('Quantity must be at least 1. To take it off the list, use Remove.')).toBeTruthy();
  });
  it('clamps over the maximum to 9,999', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Quantity of Rice', { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '20000' } });
    fireEvent.blur(input);
    expect(input.value).toBe('9999');
    expect(screen.getByText('Most you can order here is 9,999. Set to 9,999.')).toBeTruthy();
  });
  it('allows 0 when min is 0', () => {
    render(<Harness min={0} initial={0} />);
    expect((screen.getByLabelText('Quantity of Rice', { selector: 'input' }) as HTMLInputElement).value).toBe('0');
  });
  it('has no axe violations', async () => {
    const { container } = render(<Harness />);
    expect((await axe.run(container)).violations).toEqual([]);
  });
});
