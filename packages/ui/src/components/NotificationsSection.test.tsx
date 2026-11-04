import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { NotificationsSection } from './NotificationsSection';
import { SEED_PREFS, SEED_TEMPLATES } from './sms/settingsModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const ui = (initialTemplate: string | null = null) => <NotificationsSection prefs={SEED_PREFS} onPrefs={() => {}} templates={SEED_TEMPLATES} onTemplates={() => {}} initialTemplate={initialTemplate} />;

describe('NotificationsSection', () => {
  it('grid and template list have no axe violations', async () => {
    const { container } = render(ui());
    expect(screen.getByRole('table', { name: 'Who is told about what' })).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('template modal opens, shows count and preview, has no axe violations', async () => {
    render(ui());
    fireEvent.click(screen.getAllByRole("button", { name: /edit text/ })[0]!);
    expect(screen.getByTestId('sms-count')).toBeTruthy();
    expect(screen.getByTestId('sms-preview')).toBeTruthy();
    expect((await axe.run(document.body, axeOpts)).violations).toEqual([]);
  });
});
