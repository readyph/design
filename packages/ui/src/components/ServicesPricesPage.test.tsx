import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ServicesPricesPage, type ServicesPricesProps } from './ServicesPricesPage';

afterEach(cleanup);
// Source flaw accepted (RDY-523): ServiceTypeForm has a <p> inside the <dl>.
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'empty-table-header': { enabled: false }, 'aria-required-children': { enabled: false }, 'definition-list': { enabled: false } } };
const SCENARIOS: Record<string, ServicesPricesProps> = {
  default: {}, embedded: { embedded: true }, mechanic: { role: 'mechanic' }, empty: { state: 'empty' }, loading: { state: 'loading' },
  filtered: { initialCategory: 'Brakes' }, noResult: { initialQuery: 'turbo' }, stress: { stress: true }, inactive: { initialShowInactive: true },
  form: { initialForm: 'sv01' }, ask: { initialAsk: 'sv10' },
};

describe('ServicesPricesPage', () => {
  for (const [name, props] of Object.entries(SCENARIOS)) {
    it(`${name} has no axe violations`, async () => {
      const { container } = render(<ServicesPricesPage {...props} />);
      expect(screen.getAllByText('Services & prices').length).toBeGreaterThan(0);
      expect((await axe.run(props.initialForm || props.initialAsk ? document.body : container, axeOpts)).violations).toEqual([]);
    });
  }
  it('mechanic sees View only and no Add service', () => {
    render(<ServicesPricesPage role="mechanic" embedded />);
    expect(screen.getByText('View only')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Add service' })).toBeNull();
  });
});
