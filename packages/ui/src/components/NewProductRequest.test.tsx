import { afterEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EMPTY_NEW_PRODUCT, NewProductBar, NewProductForm, NewProductRequests, newProductNeed } from './NewProductRequest';

afterEach(cleanup);
const no = () => false;

describe('NewProductRequest', () => {
  it('need: short code, already told, ok', () => {
    expect(newProductNeed({ ...EMPTY_NEW_PRODUCT, code: '123' }, 'your manager', no)).toBe('Type or scan the barcode, at least 8 digits.');
    expect(newProductNeed({ ...EMPTY_NEW_PRODUCT, code: '4805550099994' }, 'your manager', () => true)).toBe(
      'You already told your manager about this barcode. They have not set it up yet.',
    );
    expect(newProductNeed({ ...EMPTY_NEW_PRODUCT, code: '4805550099994' }, 'your manager', no)).toBe('');
  });

  it('bar sentence and disabled send', () => {
    const onSend = vi.fn();
    const { rerender } = render(<NewProductBar value={EMPTY_NEW_PRODUCT} alreadyRequested={no} onSend={onSend} />);
    expect((screen.getByRole('button', { name: /Send to your manager/ }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<NewProductBar value={{ ...EMPTY_NEW_PRODUCT, code: '4805550099994', qty: '6' }} alreadyRequested={no} onSend={onSend} />);
    expect(screen.getByRole('status').textContent).toBe('Nothing goes into stock yet. Your manager sets the product up first, then your count of 6 goes in.');
    fireEvent.click(screen.getByRole('button', { name: /Send to your manager/ }));
    expect(onSend).toHaveBeenCalled();
  });

  it('form edits and place toggle', () => {
    const onChange = vi.fn();
    render(<NewProductForm value={EMPTY_NEW_PRODUCT} onChange={onChange} locations={['Shelf A2']} />);
    fireEvent.change(screen.getByLabelText('Barcode'), { target: { value: '4805 5500' } });
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_NEW_PRODUCT, code: '48055500' });
    fireEvent.click(screen.getByRole('button', { name: 'Not sure' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_NEW_PRODUCT, loc: 'Not sure' });
    fireEvent.click(screen.getByRole('button', { name: 'One more How many you counted' }));
    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_NEW_PRODUCT, qty: '1' });
  });

  it('manager rows', async () => {
    const onSetUp = vi.fn();
    const onNotOurs = vi.fn();
    const { container } = render(
      <NewProductRequests
        requests={[{ id: 'a', barcode: '4805550099994', by: 'Jun Cruz', at: '8:40' }]}
        onSetUp={onSetUp}
        onNotOurs={onNotOurs}
      />,
    );
    expect(screen.getByText('No name typed')).toBeTruthy();
    expect(screen.getByText(/No count/).textContent).toBe('No count · Jun Cruz, 8:40');
    fireEvent.click(screen.getByRole('button', { name: 'Set up product' }));
    fireEvent.click(screen.getByRole('button', { name: 'Not ours' }));
    expect(onSetUp).toHaveBeenCalledWith('a');
    expect(onNotOurs).toHaveBeenCalledWith('a');
    const r = await axe.run(container);
    expect(r.violations).toEqual([]);
  });

  it('form has no axe violations', async () => {
    const { container } = render(<NewProductForm value={EMPTY_NEW_PRODUCT} onChange={() => undefined} locations={['Shelf A2']} />);
    const r = await axe.run(container, { rules: { region: { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});
