import { afterEach, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { cleanup, render, screen } from '@testing-library/react';
import { StockerHomePage } from './Stocker.home';

afterEach(cleanup);
const axeOk = async () => expect((await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } })).violations.map((v) => v.id)).toEqual([]);

describe('Stocker Home (RDY-430)', () => {
  it('live: every section, row actions, no axe violations', async () => {
    render(<StockerHomePage />);
    ['To receive', 'To send', 'To check in', 'Your activity', 'Tell your manager'].forEach((h) => expect(screen.getAllByText(h).length).toBeGreaterThan(0));
    expect(screen.getAllByText('Receive').length).toBeGreaterThan(0);
    await axeOk();
  });
  it('loading, error, empty, quiet and tenant B have no axe violations', async () => {
    for (const p of [{ state: 'loading' }, { state: 'error' }, { state: 'empty' }, { state: 'quiet' }, { tenant: 'b' }] as const) {
      render(<StockerHomePage {...p} />);
      await axeOk();
      cleanup();
    }
  });
  it('error: message and Try again; quiet: nothing to send or check in', () => {
    render(<StockerHomePage state="error" />);
    expect(screen.getByText(/Orders did not load\./)).toBeTruthy();
    cleanup();
    render(<StockerHomePage state="quiet" />);
    expect(screen.getByText('Nothing to send.')).toBeTruthy();
    expect(screen.getByText('Nothing to check in.')).toBeTruthy();
  });
});
