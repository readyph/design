import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SettingsModal, normPhone } from './SettingsModal';
import { sampleChannels, sampleLedaScope, sampleNotifications, sampleValue } from './SettingsModal.sample';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
});
afterEach(cleanup);

const setup = (over = {}) => {
  const fns = { onOpenChange: vi.fn(), onSave: vi.fn(), onThemeChange: vi.fn() };
  render(
    <SettingsModal open platform="Parts Stockroom" person={{ name: 'Berto Villanueva', initials: 'BV', title: 'Manager' }} notifications={sampleNotifications} channels={sampleChannels}
      ledaScope={sampleLedaScope} value={sampleValue} savedAt="9:12 AM" portalHref="#" signOutHref="#" theme="system" {...fns} {...over} />,
  );
  return fns;
};

describe('SettingsModal', () => {
  it('normalises Philippine mobiles', () => {
    expect(normPhone('+63 917 123 4567')).toBe('0917 123 4567');
    expect(normPhone('12')).toBeNull();
  });
  it('has a labelled dialog, a vertical tablist and no axe violations', async () => {
    setup();
    expect(screen.getByText('Parts Stockroom · Berto Villanueva')).toBeTruthy();
    const list = screen.getByRole('tablist', { hidden: true });
    expect(list.getAttribute('aria-orientation')).toBe('vertical');
    expect(screen.getAllByRole('tab', { hidden: true }).length).toBe(5);
    const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
  it('roving tabs wrap with the arrows', () => {
    setup();
    const tabs = screen.getAllByRole('tab', { hidden: true });
    fireEvent.keyDown(screen.getByRole('tablist', { hidden: true }), { key: 'ArrowUp' });
    expect(tabs[4].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(screen.getByRole('tablist', { hidden: true }), { key: 'Home' });
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
  });
  it('asks before discarding edits, and leaves at once with none', () => {
    const { onOpenChange } = setup();
    fireEvent.click(screen.getByLabelText('Close My settings'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
  it('counts a change, saves, and refuses text messages with no number', () => {
    const { onSave } = setup({ value: { ...sampleValue, phone: '' } });
    fireEvent.click(screen.getByRole('tab', { name: /Notifications/, hidden: true }));
    fireEvent.click(screen.getByLabelText('Text message', { selector: 'button' }));
    expect(screen.getByText('You have changes that are not saved.')).toBeTruthy();
    fireEvent.click(screen.getByText('Save'));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getAllByText('Add your contact number first. Text messages go there.').length).toBeGreaterThan(0);
  });
});
