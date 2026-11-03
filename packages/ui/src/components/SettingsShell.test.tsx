import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { Buildings } from '@phosphor-icons/react';
import { SettingsNav } from './SettingsNav';
import { FileDropzone, SaveBar, WeekHoursEditor } from './SettingsFields';
import { SEED_SHOP, week } from './sms/settingsModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const sections = [{ id: 'shop', label: 'Shop details', hint: 'Name', icon: Buildings }, { id: 'team', label: 'Team', hint: 'Staff', icon: Buildings }];

describe('Settings shell', () => {
  it('side nav marks the current section and has no axe violations', async () => {
    const onSelect = vi.fn();
    const { container } = render(<SettingsNav sections={sections} current="shop" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: 'Shop details' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'Team' }));
    expect(onSelect).toHaveBeenCalledWith('team');
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('phone list has no axe violations', async () => {
    const { container } = render(<SettingsNav sections={sections} onSelect={() => {}} variant="list" />);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('save bar shows only when dirty and counts problems', async () => {
    const { container, rerender } = render(<SaveBar dirty={false} onSave={() => {}} onDiscard={() => {}} />);
    expect(container.firstChild).toBeNull();
    rerender(<SaveBar dirty problems={2} onSave={() => {}} onDiscard={() => {}} />);
    expect(screen.getByText('2 things need fixing before you can save.')).toBeTruthy();
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('hours editor and dropzone have no axe violations; invalid day shows its error', async () => {
    const bad = week(() => ({ open: true, from: '17:00', to: '08:00' }));
    const { container } = render(<div><FileDropzone label="Business logo" value={null} onChange={() => {}} placeholder="x" /><WeekHoursEditor value={bad} onChange={() => {}} /></div>);
    expect(screen.getAllByText('Closing time must be after opening time.').length).toBe(7);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    cleanup();
    const { container: c2 } = render(<WeekHoursEditor value={SEED_SHOP.hours} onChange={() => {}} />);
    expect((await axe.run(c2, axeOpts)).violations).toEqual([]);
  });
});
