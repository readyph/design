// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { OpeningHours, openingHoursDirty, weekSummary, DAY_KEYS, type OpeningHoursProps, type OpeningHoursValue } from './OpeningHours';
import { companyWeek, nowSample, ownValue, publicHolidays, sameValue, todayIso } from './OpeningHours.data';

afterEach(cleanup);

function H({ initial, spy, ...rest }: { initial: OpeningHoursValue; spy?: (v: OpeningHoursValue) => void } & Partial<OpeningHoursProps>) {
  const [v, setV] = useState(initial);
  return (
    <OpeningHours value={v} onChange={(n) => { setV(n); spy?.(n); }} companyWeek={companyWeek} publicHolidays={publicHolidays} today={todayIso} platformName="Auto Works" now={nowSample} {...rest} />
  );
}
const pick = (name: string, option: string) => {
  fireEvent.click(screen.getByRole('combobox', { name }));
  fireEvent.click(screen.getByRole('option', { name: option }));
};

describe('OpeningHours', () => {
  it('summarises the company week in one line when "same as company" is on', () => {
    render(<H initial={sameValue} />);
    expect(screen.getByTestId('week-summary').textContent).toBe('Mon-Sat 8:00 AM-6:00 PM · Sun closed');
    expect(screen.queryByRole('combobox')).toBeNull();
  });
  it('turning it off shows a row per day with named selects', () => {
    render(<H initial={sameValue} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Same as company hours' }));
    expect(screen.getByRole('combobox', { name: 'Opening time, Monday' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Closing time, Sunday' })).toBeTruthy();
    expect(screen.getAllByRole('switch', { name: /day$/ })).toHaveLength(7);
  });
  it('offers 30-minute steps from 5:00 AM to 11:00 PM, and closing only after opening', () => {
    render(<H initial={ownValue} />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Opening time, Monday' }));
    const opts = screen.getAllByRole('option').map((o) => o.textContent);
    expect(opts[0]).toBe('5:00 AM');
    expect(opts).not.toContain('11:00 PM');
    expect(opts).toHaveLength(36);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Opening time, Monday' }), { key: 'Escape' });
    fireEvent.click(screen.getByRole('combobox', { name: 'Closing time, Monday' }));
    const close = screen.getAllByRole('option').map((o) => o.textContent);
    expect(close[0]).toBe('8:30 AM');
    expect(close[close.length - 1]).toBe('11:00 PM');
  });
  it('moves closing and announces it when opening passes it', () => {
    const spy = vi.fn();
    render(<H initial={ownValue} spy={spy} />);
    pick('Opening time, Monday', '7:00 PM');
    expect(spy.mock.calls[0][0].week.mon).toEqual({ open: true, from: '19:00', to: '20:00' });
    expect(screen.getByRole('status').textContent).toContain('Monday closing moved to 8:00 PM');
  });
  it('caps the moved closing at 11:00 PM', () => {
    const spy = vi.fn();
    render(<H initial={ownValue} spy={spy} />);
    pick('Opening time, Monday', '10:30 PM');
    expect(spy.mock.calls[0][0].week.mon.to).toBe('23:00');
  });
  it('a closed day disables both selects and gives the reason', () => {
    render(<H initial={ownValue} />);
    const sel = screen.getByRole('combobox', { name: 'Opening time, Wednesday' }) as HTMLButtonElement;
    expect(sel.disabled).toBe(true);
    expect(sel.textContent).toContain('Closed');
    expect(document.getElementById(sel.getAttribute('aria-describedby')!)!.textContent).toContain('Wednesday is closed');
  });
  it('opening a day enables its selects with the kept times', () => {
    render(<H initial={ownValue} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Wednesday' }));
    const sel = screen.getByRole('combobox', { name: 'Opening time, Wednesday' }) as HTMLButtonElement;
    expect(sel.disabled).toBe(false);
    expect(sel.textContent).toContain('8:00 AM');
  });
  it('clicking the day name toggles the switch (whole row is a label)', () => {
    render(<H initial={ownValue} />);
    fireEvent.click(screen.getByText('Thursday'));
    expect(screen.getByRole('switch', { name: 'Thursday' }).getAttribute('aria-checked')).toBe('false');
  });
  it('Copy Monday copies to open days only, keeps focus and announces', () => {
    const spy = vi.fn();
    render(<H initial={ownValue} spy={spy} />);
    pick('Opening time, Monday', '9:00 AM');
    const btn = screen.getByRole('button', { name: 'Copy Monday to the other open days' });
    btn.focus();
    fireEvent.click(btn);
    const w = spy.mock.calls.at(-1)![0].week;
    expect(w.tue.from).toBe('09:00');
    expect(w.wed).toEqual(ownValue.week.wed);
    expect(w.sat.from).toBe('09:00');
    expect(document.activeElement).toBe(btn);
    expect(screen.getByRole('status').textContent).toMatch(/Copied Monday 9:00 AM to 6:00 PM to 4 days: Tuesday, Thursday, Friday, Saturday/);
  });
  it('Copy Monday is disabled with a visible reason when Monday is closed', () => {
    render(<H initial={{ ...ownValue, week: { ...ownValue.week, mon: { ...ownValue.week.mon, open: false } } }} />);
    expect((screen.getByRole('button', { name: /Copy Monday/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Monday is closed, so there is nothing to copy/)).toBeTruthy();
  });
  it('lists the next 5 holidays from today and switches one to open anyway', () => {
    const spy = vi.fn();
    render(<H initial={ownValue} spy={spy} />);
    const list = screen.getByRole('list', { name: 'Next public holidays' });
    expect(within(list).getAllByRole('switch')).toHaveLength(5);
    expect(within(list).queryByText(/Past holiday/)).toBeNull();
    fireEvent.click(within(list).getByRole('switch', { name: /All Saints/ }));
    expect(spy.mock.calls[0][0].holidays.openOn).toContain('2026-11-01');
    expect(within(list).getByRole('switch', { name: /Bonifacio/ }).getAttribute('aria-checked')).toBe('false');
  });
  it('hides the holiday list when closed-on-holidays is off', () => {
    render(<H initial={{ ...ownValue, holidays: { closed: false, openOn: [] } }} />);
    expect(screen.queryByRole('list', { name: 'Next public holidays' })).toBeNull();
  });
  it('adds a closure sorted by date, validates, and refocuses the date field', () => {
    const spy = vi.fn();
    render(<H initial={ownValue} spy={spy} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add closed day' }));
    expect(screen.getByRole('alert').textContent).toContain('Pick the day');
    const date = screen.getByLabelText('Closed on') as HTMLInputElement;
    expect(document.activeElement).toBe(date);
    fireEvent.change(date, { target: { value: '2026-11-02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add closed day' }));
    expect(screen.getByRole('alert').textContent).toContain('Already closed');
    fireEvent.change(date, { target: { value: '2026-10-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add closed day' }));
    expect(screen.getByRole('alert').textContent).toContain('already passed');
    fireEvent.change(date, { target: { value: '2026-11-10' } });
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'Outing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add closed day' }));
    const rows = within(screen.getByRole('list', { name: 'One-off closures' })).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([expect.stringContaining('Stock count'), expect.stringContaining('Outing'), expect.stringContaining('Staff Christmas')]);
    expect(document.activeElement).toBe(date);
    expect((date as HTMLInputElement).value).toBe('');
  });
  it('removing a closure asks first and returns focus to a real control', async () => {
    vi.useFakeTimers();
    render(<H initial={ownValue} />);
    fireEvent.click(screen.getByRole('button', { name: /Remove closure on .*Nov.*Stock count/ }));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(screen.getByText('Auto Works keeps its usual hours that day.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getAllByRole('button', { name: /Remove closure/ })).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /Remove closure on .*Nov.*Stock count/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getAllByRole('button', { name: /Remove closure/ })).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /Remove closure/ }));
    vi.useRealTimers();
  });
  it('builds the Leda line from now, and follows edits', () => {
    render(<H initial={ownValue} />);
    expect(screen.getByRole('note').textContent).toContain('Yes, Auto Works is open until 6:00 PM today.');
    pick('Opening time, Thursday', '11:00 AM');
    expect(screen.getByRole('note').textContent).toContain('Auto Works opens at 11:00 AM today.');
  });
  it('shows a supplied Leda answer and hides the line with neither', () => {
    const { rerender } = render(<OpeningHours value={sameValue} onChange={() => {}} companyWeek={companyWeek} ledaAnswer="We open at 8." />);
    expect(screen.getByRole('note').textContent).toContain('We open at 8.');
    rerender(<OpeningHours value={sameValue} onChange={() => {}} companyWeek={companyWeek} />);
    expect(screen.queryByRole('note')).toBeNull();
  });
  it('formats time from props: 24h and no clock', () => {
    render(<H initial={ownValue} hour12={false} locale="de-DE" />);
    expect(screen.getByRole('combobox', { name: /Opening time, (Montag|Monday)/ }).textContent).toContain('08:00');
  });
  it('uses a caller formatter', () => {
    render(<H initial={ownValue} formatTime={(s) => `@${s}`} />);
    expect(screen.getByRole('combobox', { name: 'Opening time, Monday' }).textContent).toContain('@08:00');
  });
  it('save bar: disabled until dirty, then saves; focus goes to the heading, not the page', async () => {
    vi.useFakeTimers();
    function S() {
      const [saved, setSaved] = useState(ownValue);
      const [v, setV] = useState(ownValue);
      return <OpeningHours value={v} onChange={setV} companyWeek={companyWeek} savedValue={saved} onSave={(x) => setSaved(x)} onDiscard={() => setV(saved)} />;
    }
    render(<S />);
    const save = screen.getByRole('button', { name: 'Save system settings' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    pick('Closing time, Monday', '5:00 PM');
    expect(save.disabled).toBe(false);
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    save.focus();
    fireEvent.click(save);
    act(() => { vi.advanceTimersByTime(200); });
    expect(save.disabled).toBe(true);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Opening hours' }));
    vi.useRealTimers();
  });
  it('discard restores the saved draft', () => {
    function S() {
      const [v, setV] = useState(ownValue);
      return <OpeningHours value={v} onChange={setV} companyWeek={companyWeek} savedValue={ownValue} onSave={() => {}} onDiscard={() => setV(ownValue)} />;
    }
    render(<S />);
    pick('Closing time, Monday', '5:00 PM');
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByRole('combobox', { name: 'Closing time, Monday' }).textContent).toContain('6:00 PM');
  });
  it('read only disables everything and hides the add form and save bar', () => {
    render(<H initial={ownValue} readOnly readOnlyReason="Only admins can change this." savedValue={ownValue} onSave={() => {}} />);
    expect(screen.getByText('Only admins can change this.')).toBeTruthy();
    screen.getAllByRole('switch').forEach((s) => expect((s as HTMLButtonElement).disabled).toBe(true));
    expect(screen.queryByRole('button', { name: 'Add closed day' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save system settings' })).toBeNull();
  });
  it('a caller className is merged onto the root without dropping the layout classes', () => {
    const { container } = render(<H initial={sameValue} className="mt-4" />);
    const cls = (container.firstElementChild as HTMLElement).className;
    expect(cls).toContain('mt-4');
    expect(cls).toContain('flex-col');
  });
  it('helpers: summary runs and dirty ignore own week while same as company', () => {
    expect(weekSummary(companyWeek, (s) => s, (i) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i])).toBe('Mon-Sat 08:00-18:00 · Sun closed');
    expect(openingHoursDirty(sameValue, { ...sameValue, week: { ...sameValue.week, mon: { open: false, from: '08:00', to: '18:00' } } })).toBe(false);
    expect(openingHoursDirty(ownValue, { ...ownValue, holidays: { closed: false, openOn: [] } })).toBe(true);
    expect(DAY_KEYS).toHaveLength(7);
  });
});
