import { render, cleanup, screen, fireEvent, act, within, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { SettingsPage, type SettingsProps } from './Settings.page';
import { getShopLogo, setShopLogo, smsCount, summarizeWeek, SEED_STAFF, phoneValid, resetStaff, getStaff, setStaff } from './settingsModel';
import { lanesFor } from './floorModel';
import { mechanicOptions } from './ext/ServicesToolbar';
import { calMechanicOptions } from './ext/CalendarToolbar';
import { MechanicPage } from './Mechanic.page';
import { ManagerTodayPage } from './ManagerToday.page';
import { mechanics } from './data';

beforeAll(() => {
  const D = HTMLDialogElement.prototype as { showModal?: () => void; close?: () => void };
  D.showModal = D.showModal ?? function (this: HTMLDialogElement) { this.setAttribute('open', ''); };
  D.close = D.close ?? function (this: HTMLDialogElement) { this.removeAttribute('open'); };
  Element.prototype.scrollIntoView = () => {};
  Element.prototype.scrollTo = () => {};
  class RO { constructor(private cb: ResizeObserverCallback) {} observe() { this.cb([{ contentRect: { width: 1000, height: 600 } } as ResizeObserverEntry], this as unknown as ResizeObserver); } unobserve() {} disconnect() {} }
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = RO;
  class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = IO;
  window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as MediaQueryList);
});
afterEach(() => { cleanup(); setShopLogo(null); resetStaff(); window.location.hash = ''; });

const mount = async (p: SettingsProps = {}) => { await act(async () => { render(<SettingsPage phone={false} {...p} />); }); };
const nav = (name: string) => within(screen.getByRole('navigation', { name: 'Settings sections' })).getByRole('button', { name });
const click = async (el: HTMLElement) => { await act(async () => { fireEvent.click(el); }); };
const type = async (label: string | RegExp, value: string) => { await act(async () => { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }); };
const bar = () => screen.queryByRole('region', { name: 'Unsaved changes' });

describe('Settings shell', () => {
  it('the section menu switches sections and marks the current one', async () => {
    await mount();
    expect(screen.getByRole('heading', { level: 2, name: 'Shop details' })).toBeTruthy();
    await click(nav('Team'));
    expect(screen.getByRole('heading', { level: 2, name: 'Team' })).toBeTruthy();
    expect(nav('Team').getAttribute('aria-current')).toBe('page');
    await click(nav('Notifications'));
    expect(screen.getByRole('table', { name: 'Who is told about what' })).toBeTruthy();
    await click(nav('Services & prices'));
    expect(screen.getByRole('heading', { level: 2, name: /Services & prices/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add service' })).toBeTruthy();
  });
  it('shows the Save bar only when dirty, and asks before leaving with changes (DirtyGuard)', async () => {
    await mount();
    expect(bar()).toBeNull();
    await type('Business name', 'Dela Cruz Auto Works 2');
    expect(bar()).not.toBeNull();
    await click(nav('Team'));
    expect(screen.getByRole('alertdialog', { hidden: true }) || screen.getByText('Discard your changes?')).toBeTruthy();
    await click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Shop details' })).toBeTruthy();
    await click(nav('Team'));
    await click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Team' })).toBeTruthy();
    await click(nav('Shop details'));
    expect((screen.getByLabelText('Business name') as HTMLInputElement).value).toBe('Dela Cruz Auto Works');
  });
  it('Discard restores the saved values', async () => {
    await mount();
    await type('Branch name', 'Elsewhere');
    await click(within(bar()!).getByRole('button', { name: 'Discard' }));
    expect((screen.getByLabelText('Branch name') as HTMLInputElement).value).toBe('Kapitolyo');
    expect(bar()).toBeNull();
  });
  it('phone: the menu list is the first screen, a section is pushed with a back breadcrumb', async () => {
    await mount({ phone: true });
    expect(screen.queryByRole('heading', { level: 2, name: 'Shop details' })).toBeNull();
    await click(within(screen.getByRole('navigation', { name: 'Settings sections' })).getByRole('button', { name: /Team/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Team' })).toBeTruthy();
    await click(within(screen.getByRole('navigation', { name: /Breadcrumb/ })).getByText(/Settings/));
    expect(screen.getByRole('navigation', { name: 'Settings sections' })).toBeTruthy();
  });
  it('the unsaved-changes overlay and the invalid state open as story starting points', async () => {
    await mount({ initialState: 'dirty', initialOverlay: 'unsaved' });
    expect(screen.getByText('Discard your changes?')).toBeTruthy();
    cleanup();
    await mount({ initialState: 'invalid' });
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    expect(bar()!.textContent).toMatch(/need fixing/);
  });
});

describe('Leaving through the left rail or the phone tabs', () => {
  const rail = (name: string) => document.querySelector(`a[href="#${name}"]`) as HTMLAnchorElement;
  it('with unsaved edits, a rail link asks first: Keep editing stays, Discard changes goes', async () => {
    await mount();
    await type('Business name', 'Dela Cruz Auto Works 2');
    expect(bar()).not.toBeNull();
    await click(rail('today'));
    expect(screen.getByText('Discard your changes?')).toBeTruthy();
    expect(window.location.hash).toBe('');
    await click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(window.location.hash).toBe('');
    expect((screen.getByLabelText('Business name') as HTMLInputElement).value).toBe('Dela Cruz Auto Works 2');
    await click(rail('services'));
    await click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(window.location.hash).toBe('#services');
    expect((screen.getByLabelText('Business name') as HTMLInputElement).value).toBe('Dela Cruz Auto Works');
  });
  it('with nothing edited the link just goes; the Settings link itself never asks', async () => {
    await mount();
    await click(rail('today'));
    expect(screen.queryByText('Discard your changes?')).toBeNull();
    await type('Business name', 'X');
    await click(rail('settings'));
    expect(screen.queryByText('Discard your changes?')).toBeNull();
  });
  it('notification edits are guarded too', async () => {
    await mount({ initialSection: 'notifications', initialState: 'dirty' });
    expect(bar()).not.toBeNull();
    await click(rail('customers'));
    expect(screen.getByText('Discard your changes?')).toBeTruthy();
  });
});

describe('Team edits feed Today, Services and Mechanic', () => {
  const team = () => within(screen.getByRole('table', { name: 'Team' }));
  it('a new mechanic is assignable everywhere and has their own Mechanic day', async () => {
    await mount({ initialSection: 'team' });
    await click(screen.getByRole('button', { name: 'Add staff' }));
    await type('Full name', 'Nilo Reyes');
    await type('Mobile number', '0917 111 2222');
    await click(within(screen.getByRole('dialog', { name: 'Add staff' })).getByRole('button', { name: 'Add staff' }));
    expect(mechanics.map((m) => m.short)).toContain('Nilo');
    expect(lanesFor([]).map((l) => l.name)).toContain('Nilo');
    expect(mechanicOptions().map((o) => o.label)).toContain('Nilo');
    expect(calMechanicOptions().map((o) => o.label).join('|')).toContain('Nilo');
    cleanup();
    const id = mechanics.find((m) => m.short === 'Nilo')!.id;
    await act(async () => { render(<MechanicPage mechanicId={id} />); });
    // Their own (empty) day, not a fallback to the first mechanic's services.
    expect(document.body.textContent).not.toMatch(/JO-0412|JO-0415/);
    expect(screen.getByText('No cars for you yet')).toBeTruthy();
    expect(document.body.textContent).toContain('NR');
  });
  it('deactivating a mechanic removes them from every assignment list; reactivating brings them back', async () => {
    await mount({ initialSection: 'team' });
    await click(team().getByRole('row', { name: 'Edit Jun Bautista' }));
    await click(within(screen.getByRole('dialog', { name: 'Edit staff' })).getByRole('button', { name: 'Deactivate' }));
    await click(within(screen.getByRole('alertdialog', { name: /Deactivate Jun/ })).getByRole('button', { name: 'Deactivate' }));
    expect(mechanics.map((m) => m.short)).not.toContain('Jun');
    expect(lanesFor([]).map((l) => l.name)).not.toContain('Jun');
    expect(mechanicOptions().map((o) => o.label)).not.toContain('Jun');
    setStaff(getStaff().map((s) => (s.id === 'm-jun' ? { ...s, active: true } : s)));
    expect(mechanics.map((m) => m.short)).toContain('Jun');
  });
  it('role, bay and shift edits reach the mechanic record; a role change away from mechanic removes them', async () => {
    await mount({ initialSection: 'team' });
    setStaff(getStaff().map((s) => (s.id === 'm-arnel' ? { ...s, bay: 'Bay 3', hours: { ...s.hours, mon: { open: true, from: '09:30', to: '18:00' } } } : s)));
    const arnel = mechanics.find((m) => m.id === 'm-arnel')!;
    expect(arnel.bay).toBe('Bay 3'); expect(arnel.shift).toBe('9:30-18:00');
    setStaff(getStaff().map((s) => (s.id === 'm-arnel' ? { ...s, role: 'front_desk' as const } : s)));
    expect(mechanics.find((m) => m.id === 'm-arnel')).toBeUndefined();
  });
  it('seeded data is unchanged until someone edits: the four mechanics, in order', () => {
    expect(mechanics.map((m) => m.id)).toEqual(['m-jun', 'm-arnel', 'm-paolo', 'm-ricky']);
    expect(mechanics.map((m) => m.shift)).toEqual(['8:00-17:00', '8:00-17:00', '9:00-18:00', '8:00-17:00']);
  });
  it('the stress / new scenarios stay local to the page and do not touch the shared data', async () => {
    await mount({ initialSection: 'team', data: 'new' });
    await click(screen.getByRole('button', { name: 'Add your first staff' }));
    await type('Full name', 'Local Only');
    await type('Mobile number', '0917 111 3333');
    await click(within(screen.getByRole('dialog', { name: 'Add staff' })).getByRole('button', { name: 'Add staff' }));
    expect(mechanics.map((m) => m.short)).not.toContain('Local');
  });
  it('Today phone nav has Requests with the same count as the rail', async () => {
    cleanup();
    await act(async () => { render(<ManagerTodayPage />); });
    const tabs = document.querySelectorAll('a[href="#requests"]');
    expect(tabs.length).toBe(2);
    const text = [...tabs].map((a) => a.textContent);
    expect(text.some((t) => /Requests/.test(t!))).toBe(true);
    const nums = [...tabs].map((a) => (a.textContent ?? '').replace(/\D/g, ''));
    expect(nums[0]).toBe(nums[1]);
    expect(Number(nums[0])).toBeGreaterThan(0);
  });
});

describe('Shop details', () => {
  it('validates name and phone, then saves with a toast and clears the bar', async () => {
    await mount();
    await type('Business name', '');
    await type('Phone', 'abc');
    await click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText(/Enter your business name/)).toBeTruthy();
    expect(screen.getByText(/Use a Philippine number/)).toBeTruthy();
    await type('Business name', 'Dela Cruz Auto Works');
    await type('Phone', '0917 555 0142');
    await type('Branch name', 'Kapitolyo 2');
    await click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText('Shop details saved.')).toBeTruthy();
    expect(bar()).toBeNull();
  });
  it('a logo previews in the 64px square, saves to the shared store, and can be removed', async () => {
    await mount();
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    await act(async () => { fireEvent.change(screen.getByLabelText('Business logo file'), { target: { files: [file] } }); });
    await waitFor(() => expect(screen.getByAltText('Your business logo')).toBeTruthy());
    expect(screen.getByTestId('logo-preview').className).toMatch(/size-16/);
    await click(screen.getByRole('button', { name: 'Save changes' }));
    expect(getShopLogo()).toMatch(/^data:/);
    await click(screen.getByRole('button', { name: 'Remove logo' }));
    expect(screen.queryByAltText('Your business logo')).toBeNull();
    await click(screen.getByRole('button', { name: 'Save changes' }));
    expect(getShopLogo()).toBeNull();
  });
  it('rejects a file that is not an image', async () => {
    await mount();
    await act(async () => { fireEvent.change(screen.getByLabelText('Business logo file'), { target: { files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] } }); });
    expect(screen.getByText(/Use a PNG, JPG, SVG or WebP/)).toBeTruthy();
  });
  it("hours: the switch closes a day; copy Monday's hours to all weekdays", async () => {
    await mount();
    const sw = (d: string) => screen.getByRole('switch', { name: `${d}: Open` });
    expect(sw('Tuesday').getAttribute('aria-checked')).toBe('true');
    await click(sw('Monday'));
    expect(sw('Monday').getAttribute('aria-checked')).toBe('false');
    await click(screen.getByRole('button', { name: /Copy Monday's hours to all weekdays/ }));
    expect(screen.getByRole('switch', { name: 'Friday: Open' }).getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('switch', { name: 'Saturday: Open' }).getAttribute('aria-checked')).toBe('true');
  });
  it('closed days: add and remove', async () => {
    await mount();
    expect(within(screen.getByRole('list', { name: 'Closed days' })).getAllByRole('listitem').length).toBe(3);
    await type('Date', '2026-12-08');
    await click(screen.getByRole('button', { name: 'Add closed day' }));
    expect(within(screen.getByRole('list', { name: 'Closed days' })).getAllByRole('listitem').length).toBe(4);
    await click(within(screen.getByRole('list', { name: 'Closed days' })).getAllByRole('button', { name: /^Remove/ })[0]!);
    expect(within(screen.getByRole('list', { name: 'Closed days' })).getAllByRole('listitem').length).toBe(3);
  });
});

describe('Team', () => {
  it('lists the same mechanics as Today and Mechanic, with role chip, phone and shift', async () => {
    await mount({ initialSection: 'team' });
    const t = screen.getByRole('table', { name: 'Team' });
    for (const m of mechanics) { const row = within(t).getByRole('row', { name: `Edit ${m.name}` }); expect(row.textContent).toContain(m.phone); expect(row.textContent).toContain('Mechanic'); }
    expect(within(t).getByRole('row', { name: 'Edit Eddie Ramos' }).textContent).toContain('Inactive');
  });
  it('add staff validates, saves and shows the new row; the row opens Edit', async () => {
    await mount({ initialSection: 'team' });
    await click(screen.getByRole('button', { name: 'Add staff' }));
    const d = within(screen.getByRole('dialog', { name: 'Add staff' }));
    await click(d.getByRole('button', { name: 'Add staff' }));
    expect(screen.getByText('Enter the staff name.')).toBeTruthy();
    await type('Full name', 'Nilo Reyes');
    await type('Mobile number', '0917 111 2222');
    await click(within(screen.getByRole('dialog', { name: 'Add staff' })).getByRole('button', { name: 'Add staff' }));
    expect(screen.getByText(/Nilo Reyes added. We sent an invite/)).toBeTruthy();
    await click(within(screen.getByRole('table', { name: 'Team' })).getByRole('row', { name: 'Edit Nilo Reyes' }));
    expect(screen.getByRole('dialog', { name: 'Edit staff' })).toBeTruthy();
    expect(screen.getByText(/Mechanics can't see prices or payments/)).toBeTruthy();
  });
  it('deactivate from the modal asks, then marks the person Inactive; you cannot deactivate yourself', async () => {
    await mount({ initialSection: 'team' });
    await click(within(screen.getByRole('table', { name: 'Team' })).getByRole('row', { name: 'Edit Jun Bautista' }));
    await click(within(screen.getByRole('dialog', { name: 'Edit staff' })).getByRole('button', { name: 'Deactivate' }));
    await click(within(screen.getByRole('alertdialog', { name: /Deactivate Jun/ })).getByRole('button', { name: 'Deactivate' }));
    expect(within(screen.getByRole('table', { name: 'Team' })).getByRole('row', { name: 'Edit Jun Bautista' }).textContent).toContain('Inactive');
    await click(within(screen.getByRole('table', { name: 'Team' })).getByRole('row', { name: /Edit Ramon/ }));
    expect(within(screen.getByRole('dialog', { name: 'Edit staff' })).queryByRole('button', { name: 'Deactivate' })).toBeNull();
  });
  it('search narrows the list; no result and empty team have their own states', async () => {
    await mount({ initialSection: 'team' });
    await type('Search staff', 'paolo');
    expect(within(screen.getByRole('table', { name: 'Team' })).getAllByRole('row').length).toBe(2);
    await type('Search staff', 'zzz');
    expect(screen.getByText(/No one matches/)).toBeTruthy();
    cleanup();
    await mount({ initialSection: 'team', data: 'new' });
    expect(screen.getByText('No one on your team yet')).toBeTruthy();
  });
  it('role filter narrows by role', async () => {
    await mount({ initialSection: 'team' });
    await click(screen.getByRole('combobox', { name: 'Role' }));
    await click(screen.getByRole('option', { name: 'Front desk' }));
    const rows = within(screen.getByRole('table', { name: 'Team' })).getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(rows[1]!.textContent).toContain('Carmela Dizon');
  });
  it('40 staff load in pages and long names wrap', async () => {
    await mount({ initialSection: 'team', data: 'stress' });
    expect(within(screen.getByRole('table', { name: 'Team' })).getAllByRole('row').length).toBe(13);
    cleanup();
    await mount({ initialSection: 'team', data: 'long' });
    expect(screen.getByText(/Maria Cristina Dela Cruz-Villanueva/)).toBeTruthy();
  });
  it('phone: staff are rows, not a table', async () => {
    await mount({ initialSection: 'team', phone: true, initialPushed: true });
    expect(screen.queryByRole('table', { name: 'Team' })).toBeNull();
    expect(within(screen.getByRole('list', { name: 'Team' })).getAllByRole('listitem').length).toBe(SEED_STAFF.length);
  });
});

describe('Notifications', () => {
  it('every box has a full name and toggling it makes the page dirty and saves', async () => {
    await mount({ initialSection: 'notifications' });
    const box = screen.getByRole('checkbox', { name: 'Payment received, Front desk, SMS' }) as HTMLInputElement;
    expect(box.checked).toBe(false);
    await click(box);
    expect(box.checked).toBe(true);
    expect(bar()).not.toBeNull();
    await click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText('Notification settings saved.')).toBeTruthy();
    expect(bar()).toBeNull();
    expect(screen.queryByRole('checkbox', { name: /Mechanic message, Mechanic/ })).toBeNull();
  });
  it('template editor: variable chips insert, preview and SMS count update, reset restores', async () => {
    await mount({ initialSection: 'notifications' });
    await click(screen.getByRole('button', { name: 'Edit text: Payment receipt' }));
    const d = within(screen.getByRole('dialog', { name: /Payment receipt/ }));
    const ta = screen.getByLabelText('Message') as HTMLTextAreaElement;
    await type('Message', 'Hi {customer}');
    await click(d.getByRole('button', { name: /Insert \{plate\}/ }));
    expect(ta.value).toContain('{plate}');
    expect(screen.getByTestId('sms-preview').textContent).toMatch(/Hi Maricel.*NBC 4521/);
    expect(screen.getByTestId('sms-count').textContent).toMatch(/1 text message/);
    await type('Message', 'x'.repeat(170));
    expect(screen.getByTestId('sms-count').textContent).toMatch(/170 characters · 2 text messages/);
    await click(d.getByRole('button', { name: 'Reset to default' }));
    expect(ta.value).toMatch(/We received \{amount\}/);
    await type('Message', 'Thanks {customer}, got {amount}');
    await click(d.getByRole('button', { name: 'Save text' }));
    expect(screen.getByText('Payment receipt text saved.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit text: Payment receipt' }).textContent).toMatch(/Edited/);
  });
  it('warns when Quote ready has no link', async () => {
    await mount({ initialOverlay: 'template' });
    await type('Message', 'Your quote is ready');
    expect(screen.getByText(/cannot open the quotation/)).toBeTruthy();
  });
});

describe('settingsModel', () => {
  it('counts SMS segments (GSM and unicode) and validates PH phones', () => {
    expect(smsCount('a'.repeat(160)).segments).toBe(1);
    expect(smsCount('a'.repeat(161)).segments).toBe(2);
    expect(smsCount('Hi “there”').unicode).toBe(true);
    expect(smsCount('a'.repeat(71) + '“').segments).toBe(2);
    expect(phoneValid('0917 555 0142')).toBe(true);
    expect(phoneValid('02 8123 4567')).toBe(true);
    expect(phoneValid('12345')).toBe(false);
  });
  it('summarises a shift', () => { expect(summarizeWeek(SEED_STAFF[1]!.hours)).toBe('Mon-Sat 8 am-5 pm'); });
});
