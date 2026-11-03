import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ShopDetailsSection } from './ShopDetailsSection';
import { NEW_SHOP, SAMPLE_LOGO, SEED_SHOP, validateShop, week } from './sms/settingsModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const invalid = { ...NEW_SHOP, tin: '12', hours: week((d) => ({ open: d !== 'sun', from: '17:00', to: '08:00' })) };
const states = { 'new shop': NEW_SHOP, filled: SEED_SHOP, 'logo uploaded': { ...SEED_SHOP, logo: SAMPLE_LOGO }, invalid };

describe('ShopDetailsSection', () => {
  for (const [name, v] of Object.entries(states)) {
    it(`${name}: no axe violations`, async () => {
      const { container } = render(<ShopDetailsSection value={v} onChange={() => {}} errors={validateShop(v)} showErrors={name === 'invalid'} />);
      expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    });
  }
  it('adds a closed day in date order and clears the inputs', () => {
    const onChange = vi.fn();
    render(<ShopDetailsSection value={NEW_SHOP} onChange={onChange} errors={{}} showErrors={false} />);
    expect(screen.getByText('No closed days yet.')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-11-30' } });
    fireEvent.change(screen.getByLabelText('Reason (optional)'), { target: { value: ' Bonifacio Day ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add closed day' }));
    expect(onChange.mock.calls[0][0].closed[0]).toMatchObject({ date: '2026-11-30', reason: 'Bonifacio Day' });
  });
});
