// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { clearToasts } from '../components/toast/toastStore';
import { PlatformPage, type PlatformPageProps } from './Platform.page';

beforeAll(() => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
  window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= () => {};
});
afterEach(() => { cleanup(); clearToasts(); });

const setup = (props: PlatformPageProps) => render(<PlatformPage {...props} />);
const tabOf = (name: RegExp) => screen.getByRole('tab', { name });

describe('Platform map', () => {
  it('shows platforms and data links only, with no HQ building', () => {
    setup({ platformId: 'autoworks' });
    expect(document.body.textContent).toMatch(/\d platforms? ·\s*(\d+ data links?|no data links)/);
    expect(screen.queryByText(/\+ HQ/)).toBeNull();
    expect(screen.queryByText('HQ')).toBeNull();
  });
});

describe('Platform page drafts', () => {
  it('marks the tab Unsaved, keeps the draft across tabs, and Discard resets it', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks' });
    const name = screen.getByLabelText('Name') as HTMLInputElement;
    await u.clear(name);
    await u.type(name, 'Dela Cruz Auto Works QC');
    expect(tabOf(/General info/).textContent).toContain('Unsaved');
    expect(screen.getByRole('button', { name: 'Save general info' }).getAttribute('aria-disabled')).not.toBe('true');
    await u.click(tabOf(/Team/));
    await u.click(tabOf(/General info/));
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Dela Cruz Auto Works QC');
    await u.click(screen.getByRole('button', { name: 'Discard' }));
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe('Dela Cruz Auto Works');
    expect(tabOf(/General info/).textContent).not.toContain('Unsaved');
  });

  it('saves with an Undo toast and keeps focus on the Save button', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks' });
    await u.type(screen.getByLabelText('Name'), ' QC');
    const save = screen.getByRole('button', { name: 'Save general info' });
    await u.click(save);
    expect(document.activeElement).toBe(save);
    expect(await screen.findByText('General info saved.')).toBeTruthy();
    expect(tabOf(/General info/).textContent).not.toContain('Unsaved');
  });

  it('refuses a blank name with a described error', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks' });
    await u.clear(screen.getByLabelText('Name'));
    await u.click(screen.getByRole('button', { name: 'Save general info' }));
    const name = screen.getByLabelText('Name');
    expect(name.getAttribute('aria-invalid')).toBe('true');
    expect(document.getElementById(name.getAttribute('aria-describedby')!)!.textContent).toBe('Give it a name.');
  });
});

describe('Platform page focus', () => {
  it('after taking someone off the team, focus lands on a remaining row (not body)', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks', tab: 'team' });
    await u.click(screen.getByRole('button', { name: /Take Grace Lumbao off/ }));
    const dlg = await screen.findByRole('alertdialog');
    await u.click(within(dlg).getByRole('button', { name: 'Take off' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(screen.queryByText('Grace Lumbao')).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement?.closest('[data-person]')).not.toBeNull();
    expect(tabOf(/Team/).textContent).toContain('Unsaved');
  });

  it('Use the default returns focus to Upload', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks' });
    // jsdom decodes no images: stand in for the decode and the crop canvas
    class FakeImage { onload?: () => void; width = 10; height = 10; set src(_v: string) { queueMicrotask(() => this.onload?.()); } }
    const realImage = window.Image;
    window.Image = FakeImage as unknown as typeof Image;
    HTMLCanvasElement.prototype.getContext = (() => ({ drawImage() {} })) as never;
    HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA';
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    await u.upload(document.querySelector('input[type=file]') as HTMLInputElement, file);
    window.Image = realImage;
    const use = await screen.findByRole('button', { name: 'Use the default' });
    await u.click(use);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Upload' })));
  });

  it('adding and cancelling a custom topic returns focus to Add a topic', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks', tab: 'leda' });
    await u.click(screen.getByRole('button', { name: 'Add a topic' }));
    expect(document.activeElement).toBe(screen.getByLabelText('Title'));
    await u.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add a topic' }));
  });

  it('deleting a custom topic keeps focus in the sheet and offers Undo', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks', tab: 'leda' });
    await u.click(screen.getByRole('button', { name: 'Delete Warranty on repairs' }));
    const dlg = await screen.findByRole('alertdialog');
    await u.click(within(dlg).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('Warranty on repairs deleted.')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add a topic' }));
  });
});

describe('Disconnect', () => {
  it('is blocked while the platform shares data, then View connections opens that tab', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'stockroom' });
    await u.click(screen.getByRole('button', { name: 'Disconnect' }));
    const dlg = await screen.findByRole('dialog');
    expect(dlg.textContent).toContain('Parts Stockroom still shares data');
    expect(dlg.textContent).toContain('Dela Cruz Auto Works reads its catalog');
    await u.click(within(dlg).getByRole('button', { name: 'View connections' }));
    await waitFor(() => expect(tabOf(/Connections/).getAttribute('aria-selected')).toBe('true'));
  });
  it('asks first when nothing reads from it', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks' });
    await u.click(screen.getByRole('button', { name: 'Disconnect' }));
    const dlg = await screen.findByRole('alertdialog');
    expect(dlg.textContent).toContain('Disconnect Dela Cruz Auto Works?');
    await u.click(within(dlg).getByRole('button', { name: 'Disconnect' }));
    expect(await screen.findByText('This platform is no longer connected.')).toBeTruthy();
  });
});

describe('Leda & Memory', () => {
  it('a topic switch saves at once with Undo', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks', tab: 'leda' });
    const sw = screen.getByRole('switch', { name: /Opening hours: customers/ });
    expect(sw.getAttribute('aria-checked')).toBe('true');
    await u.click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(await screen.findByText('Opening hours turned off.')).toBeTruthy();
  });
});

describe('Onboarding', () => {
  it('step 1 adds the platform, locked steps open, skipped steps are listed at the end', async () => {
    const u = userEvent.setup();
    setup({ onboard: { kind: 'inventory', label: 'Cebu Stockroom' } });
    expect(screen.getByRole('heading', { level: 1, name: 'Add an Inventory' })).toBeTruthy();
    expect(screen.getByLabelText('Name')).toHaveProperty('value', 'Cebu Stockroom');
    await u.click(screen.getByRole('button', { name: 'Add and continue' }));
    expect(await screen.findByText('Platform added.')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Set up Cebu Stockroom' })).toBeTruthy();
    for (let i = 0; i < 4; i += 1) await u.click(screen.getByRole('button', { name: 'Skip for now' }));
    expect(await screen.findByText(/You skipped/)).toBeTruthy();
    expect(tabOf(/System/).textContent).toContain('Skipped');
  });
  it('refuses a blank name on step 1', async () => {
    const u = userEvent.setup();
    setup({ onboard: { kind: 'repair' } });
    await u.clear(screen.getByLabelText('Name'));
    await u.click(screen.getByRole('button', { name: 'Add and continue' }));
    expect(screen.getByLabelText('Name').getAttribute('aria-invalid')).toBe('true');
  });
  it('Leda prefilled says nothing is added until the person presses the button', () => {
    setup({ onboard: { kind: 'pos', byLeda: 'Add a POS for the parts counter', label: 'Parts Counter' } });
    expect(screen.getByText(/Nothing is added until you press Add and continue/)).toBeTruthy();
  });
});

describe('Platform page tabs: axe and real focus (RDY-361 stage 5)', () => {
  const violations = async () => (await axe.run(document.body, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })).violations;
  it.each([['general'], ['system'], ['team'], ['connections']] as const)('%s tab has no axe violations', async (tab) => {
    setup({ platformId: 'autoworks', tab });
    expect(await violations()).toEqual([]);
  });
  it('the stockroom own-hours editor has no axe violations', async () => {
    setup({ platformId: 'stockroom', tab: 'system' });
    expect(await violations()).toEqual([]);
  });
  it('the stockroom connections tab has no axe violations and its Remove button takes real focus', async () => {
    setup({ platformId: 'stockroom', tab: 'connections' });
    expect(await violations()).toEqual([]);
    const btn = screen.getAllByRole('button', { name: /^Remove connection/ })[0];
    btn.focus();
    expect(document.activeElement).toBe(btn);
  });
  it('a holiday checkbox takes real keyboard focus and toggles with Space', async () => {
    const u = userEvent.setup();
    setup({ platformId: 'autoworks', tab: 'system' });
    const box = screen.getByRole('checkbox', { name: /All Saints/ }) as HTMLInputElement;
    box.focus();
    expect(document.activeElement).toBe(box);
    await u.keyboard(' ');
    expect(box.checked).toBe(false);
    expect(document.activeElement).toBe(box);
  });
});
