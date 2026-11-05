import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MySettingsPage } from './MySettings.page';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
});
afterEach(cleanup);

describe('My settings page', () => {
  it('opens the modal over the frame on the asked tab, with no axe violations', async () => {
    render(<MySettingsPage settings="notifications" />);
    expect(screen.getByText('Parts Stockroom · Berto Villanueva')).toBeTruthy();
    expect(screen.getAllByRole('tab', { hidden: true }).length).toBe(5);
    expect(screen.getAllByRole('tab', { hidden: true }).find((t) => t.getAttribute('aria-selected') === 'true')?.textContent).toContain('Notifications');
    const r = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations.map((v) => v.id)).toEqual([]);
  });
  it('gates notifications by role and tenant B names the café', () => {
    render(<MySettingsPage as="clerk" tenant="b" settings="notifications" />);
    expect(screen.getByText('Café Inventory · Mika Torres')).toBeTruthy();
    expect(screen.queryByText('A transfer needs approval')).toBeNull();
    expect(screen.queryByText('New product to set up')).toBeNull();
    expect(screen.getByText('Stock is low or out')).toBeTruthy();
  });
  it('asks before discarding unsaved edits', () => {
    render(<MySettingsPage settings="notifications" />);
    fireEvent.click(screen.getByRole('switch', { name: 'Stock is low or out', hidden: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel', hidden: true }));
    expect(screen.getByText('Discard your changes?')).toBeTruthy();
  });
});
