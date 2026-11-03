import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { TeamSection } from './TeamSection';
import { SEED_STAFF } from './sms/settingsModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, 'empty-table-header': { enabled: false } } };
const ui = (phone: boolean, initialOpen: 'edit' | 'add' | null = null, staff = SEED_STAFF) => <TeamSection staff={staff} onChange={() => {}} initialOpen={initialOpen} phone={phone} />;

describe('TeamSection', () => {
  it('table has no axe violations', async () => {
    const { container } = render(ui(false));
    expect(screen.getByRole('table', { name: 'Team' })).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('phone list has no axe violations', async () => {
    const { container } = render(ui(true));
    expect(screen.getByRole('list', { name: 'Team' })).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('empty state has no axe violations', async () => {
    const { container } = render(ui(false, null, []));
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('add and edit modals have no axe violations', async () => {
    for (const o of ['add', 'edit'] as const) {
      render(ui(false, o));
      expect(screen.getByRole('dialog')).toBeTruthy();
      expect((await axe.run(document.body, axeOpts)).violations).toEqual([]);
      cleanup();
    }
  });
});
