// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { RolePicker, type RolePickerProps, type RolePickerValue } from './RolePicker';
import { eight, lockedPlatforms, platforms, roleOptions, saved } from './RolePicker.data';

afterEach(cleanup);

function H(p: Partial<RolePickerProps> & { start?: RolePickerValue; spy?: Partial<Pick<RolePickerProps, 'onSave' | 'onDiscard'>> }) {
  const [v, setV] = useState(p.start ?? saved);
  const { start: _s, spy, ...rest } = p;
  return <RolePicker platforms={platforms} roleOptions={roleOptions} subject="Maria" value={v} savedValue={p.savedValue ?? saved} onChange={setV} onSave={spy?.onSave ?? (() => {})} onDiscard={spy?.onDiscard ?? (() => setV(saved))} {...rest} />;
}
const choose = (name: string, option: string) => {
  fireEvent.click(screen.getByRole('combobox', { name }));
  fireEvent.click(screen.getByRole('option', { name: option }));
};

describe('RolePicker', () => {
  it('names each dropdown with its platform and lists Not assigned plus that kind roles', () => {
    render(<H />);
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
    fireEvent.click(screen.getByRole('combobox', { name: 'Role for Cebu Parts Stockroom' }));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Not assigned', 'Manager', 'Stock clerk', 'Viewer']);
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Role for Cebu Parts Stockroom' }), { key: 'Escape' });
    fireEvent.click(screen.getByRole('combobox', { name: 'Role for Quezon City Auto Works' }));
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });
  it('uses the other-kind roles for an unknown kind', () => {
    render(<H />);
    fireEvent.click(screen.getByRole('combobox', { name: 'Role for Cubao Cafe' }));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Not assigned', 'Manager', 'Staff', 'Viewer']);
  });
  it('associates the role line and the locked reason with the dropdown, and locks it', () => {
    render(<H platforms={lockedPlatforms} />);
    const cb = screen.getByRole('combobox', { name: 'Role for Cubao Cafe' }) as HTMLButtonElement;
    expect(cb.disabled).toBe(true);
    const text = cb.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent);
    expect(text.join(' ')).toContain("Maria can't open Cubao Cafe.");
    expect(text.join(' ')).toContain('Only an admin or the Cubao Cafe manager');
    const mech = screen.getByRole('combobox', { name: 'Role for Quezon City Auto Works' });
    expect(document.getElementById(mech.getAttribute('aria-describedby')!)?.textContent).toContain('Sees and updates');
  });
  it('keeps Save and Discard disabled until dirty, then Discard restores', () => {
    render(<H />);
    const save = screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement;
    const discard = screen.getByRole('button', { name: 'Discard' }) as HTMLButtonElement;
    expect(save.disabled && discard.disabled).toBe(true);
    expect(screen.queryByText('Unsaved changes')).toBeNull();
    choose('Role for Cubao Cafe', 'Staff');
    expect(save.disabled || discard.disabled).toBe(false);
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.click(discard);
    expect(screen.getByRole('combobox', { name: 'Role for Cubao Cafe' }).textContent).toContain('Not assigned');
    expect((screen.getByRole('button', { name: 'Save changes' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('saves the draft value in the agreed shape', () => {
    const onSave = vi.fn();
    render(<H spy={{ onSave }} />);
    choose('Role for Cubao Cafe', 'Manager');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).toHaveBeenCalledWith({ access: 'member', roles: { aw: 'mechanic', sr: 'clerk', cf: 'manager' } });
  });
  it('asks before saving a removal', () => {
    const onSave = vi.fn();
    render(<H spy={{ onSave }} />);
    choose('Role for Cebu Parts Stockroom', 'Not assigned');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).not.toHaveBeenCalled();
    const dlg = screen.getByRole('alertdialog');
    expect(within(dlg).getByText(/Cebu Parts Stockroom/)).toBeTruthy();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Save and remove' }));
    expect(onSave).toHaveBeenCalledOnce();
  });
  it('moves focus to the heading after Save, so it is not lost to the page', async () => {
    function S() {
      const [sv, setSv] = useState(saved);
      const [v, setV] = useState(saved);
      return <RolePicker platforms={platforms} roleOptions={roleOptions} value={v} savedValue={sv} onChange={setV} onSave={setSv} onDiscard={() => setV(sv)} />;
    }
    render(<S />);
    choose('Role for Cubao Cafe', 'Staff');
    const save = screen.getByRole('button', { name: 'Save changes' });
    save.focus();
    fireEvent.click(save);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Roles on each platform' })));
    expect(screen.getByRole('heading', { name: 'Roles on each platform' }).getAttribute('tabindex')).toBe('-1');
  });
  it('moves focus to the heading after Save and remove in the confirm, and after Discard', async () => {
    function S() {
      const [sv, setSv] = useState(saved);
      const [v, setV] = useState(saved);
      return <RolePicker platforms={platforms} roleOptions={roleOptions} value={v} savedValue={sv} onChange={setV} onSave={setSv} onDiscard={() => setV(sv)} />;
    }
    render(<S />);
    choose('Role for Quezon City Auto Works', 'Not assigned');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Save and remove' }));
    const h = () => screen.getByRole('heading', { name: 'Roles on each platform' });
    await waitFor(() => expect(document.activeElement).toBe(h()));
    choose('Role for Cubao Cafe', 'Staff');
    const d = screen.getByRole('button', { name: 'Discard' });
    d.focus();
    fireEvent.click(d);
    await waitFor(() => expect(document.activeElement).toBe(h()));
  });
  it('returns focus to Save when saving fails and keeps it there while saving is pending', async () => {
    const { rerender } = render(<RolePicker platforms={platforms} roleOptions={roleOptions} value={{ ...saved, roles: { ...saved.roles, cf: 'staff' } }} savedValue={saved} onChange={() => {}} onSave={() => {}} onDiscard={() => {}} />);
    const save = screen.getByRole('button', { name: 'Save changes' });
    save.focus();
    fireEvent.click(save);
    await new Promise((r) => setTimeout(r, 30));
    expect(document.activeElement).toBe(save);
    rerender(<RolePicker platforms={platforms} roleOptions={roleOptions} value={{ ...saved, roles: { ...saved.roles, cf: 'staff' } }} savedValue={saved} onChange={() => {}} onSave={() => {}} onDiscard={() => {}} error="No." />);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save changes' })));
  });
  it('shows busy and error states', () => {
    render(<H saving error="Could not save." />);
    expect(screen.getByRole('alert').textContent).toContain('Could not save.');
    expect(screen.getByRole('button', { name: 'Save changes' }).getAttribute('aria-busy')).toBe('true');
    expect((screen.getAllByRole('combobox')[0] as HTMLButtonElement).disabled).toBe(true);
  });
  it('company access is a radiogroup with arrow keys', async () => {
    render(<H />);
    const g = screen.getByRole('radiogroup', { name: 'Portal access' });
    const radios = within(g).getAllByRole('radio');
    expect(radios.map((r) => r.textContent || r.getAttribute('value'))).toEqual(['admin', 'member']);
    const member = within(g).getByRole('radio', { name: /Member/ });
    expect(member.getAttribute('aria-checked')).toBe('true');
    member.focus();
    fireEvent.keyDown(member, { key: 'ArrowUp' });
    await waitFor(() => expect(within(g).getByRole('radio', { name: /Admin/ }).getAttribute('aria-checked')).toBe('true'));
  });
  it('Admin swaps the rows for one line and says so, keeping focus on the radio', () => {
    render(<H />);
    const admin = screen.getByRole('radio', { name: /Admin/ });
    admin.focus();
    fireEvent.click(admin);
    expect(screen.queryAllByRole('combobox')).toHaveLength(0);
    expect(screen.getAllByText(/Full access to every platform/).length).toBeGreaterThan(0);
    expect(screen.getByRole('status').textContent).toContain('Full access to every platform');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: /Admin/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Member/ }));
    expect(screen.getAllByRole('combobox')).toHaveLength(3);
  });
  it('Owner is shown but cannot be chosen, and the reason is tied to the group', () => {
    render(<H start={{ access: 'owner', roles: {} }} savedValue={{ access: 'owner', roles: {} }} accessReason="She created the company." />);
    const g = screen.getByRole('radiogroup');
    expect(within(g).getAllByRole('radio')).toHaveLength(3);
    expect(document.getElementById(g.getAttribute('aria-describedby')!)?.textContent).toBe('She created the company.');
    expect(within(g).getByRole('radio', { name: /Admin/ }).hasAttribute('disabled')).toBe(true);
  });
  it('warns when a member has no role anywhere', () => {
    render(<H start={{ access: 'member', roles: {} }} savedValue={{ access: 'member', roles: {} }} />);
    expect(screen.getByText(/can sign in to the Portal but can't open any platform/)).toBeTruthy();
  });
  it('hides the access radios for the single-platform form and goes read only', () => {
    render(<H hideAccess readOnly readOnlyReason="Only an owner can change roles." />);
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
    expect((screen.getAllByRole('combobox')[0] as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Only an owner can change roles.')).toBeTruthy();
  });
  it('handles 8 platforms with long and unbreakable names, never cutting them, and keeps caller classes', () => {
    const { container } = render(<H platforms={eight} start={{ access: 'member', roles: {} }} savedValue={{ access: 'member', roles: {} }} className="mt-4 w-full" />);
    expect(screen.getAllByRole('combobox')).toHaveLength(8);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain('mt-4');
    expect(root.className).toContain('min-w-0');
    expect(root.className).toContain('[overflow-wrap:anywhere]');
    expect(root.innerHTML).not.toMatch(/line-clamp/);
    expect(screen.getByText(eight[2].name).className).not.toContain('truncate');
  });
});
