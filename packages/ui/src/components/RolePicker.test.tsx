import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    const save = screen.getByRole('button', { name: 'Save changes' });
    const discard = screen.getByRole('button', { name: 'Discard' });
    const off = (b: HTMLElement) => b.getAttribute('aria-disabled') === 'true';
    expect(off(save) && off(discard)).toBe(true);
    expect((save as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText('Unsaved changes')).toBeNull();
    choose('Role for Cubao Cafe', 'Staff');
    expect(off(save) || off(discard)).toBe(false);
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.click(discard);
    expect(screen.getByRole('combobox', { name: 'Role for Cubao Cafe' }).textContent).toContain('Not assigned');
    expect(off(screen.getByRole('button', { name: 'Save changes' }))).toBe(true);
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
  it('shows the optional intros and custom removal words, and nothing extra by default', () => {
    const { unmount } = render(<H />);
    expect(screen.queryByText('Intro roles')).toBeNull();
    expect(screen.queryByText('Intro access')).toBeNull();
    unmount();
    const onSave = vi.fn();
    render(<H spy={{ onSave }} rolesIntro="Intro roles" accessIntro="Intro access" removeConfirm={{ title: (r) => `Take Maria off ${r[0].name}?`, description: 'Gone.', confirmLabel: 'Remove and save' }} />);
    expect(screen.getByText('Intro roles')).toBeTruthy();
    expect(screen.getByText('Intro access')).toBeTruthy();
    choose('Role for Cebu Parts Stockroom', 'Not assigned');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const dlg = screen.getByRole('alertdialog');
    expect(within(dlg).getByText('Take Maria off Cebu Parts Stockroom?')).toBeTruthy();
    expect(within(dlg).getByText('Gone.')).toBeTruthy();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Remove and save' }));
    expect(onSave).toHaveBeenCalledOnce();
  });
  const heading = () => screen.getByRole('heading', { name: 'Roles on each platform' });
  /** A page with a slow save: `finish()` ends it (ok or error) when the test says so. */
  function Slow({ onEnd }: { onEnd: (finish: (ok: boolean) => void) => void }) {
    const [sv, setSv] = useState(saved);
    const [v, setV] = useState(saved);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | undefined>();
    return (
      <div>
        <input aria-label="Other field" />
        <RolePicker
          platforms={platforms}
          roleOptions={roleOptions}
          value={v}
          savedValue={sv}
          saving={saving}
          error={error}
          onChange={setV}
          onDiscard={() => setV(sv)}
          onSave={(x) => {
            setError(undefined);
            setSaving(true);
            onEnd((ok) => {
              setSaving(false);
              if (ok) setSv(x);
              else setError('No.');
            });
          }}
        />
      </div>
    );
  }
  

  it('moves focus to the heading right after a direct Save (no timer) and leaves Save focusable while saving', () => {
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
    expect(document.activeElement).toBe(heading());
    expect(heading().getAttribute('tabindex')).toBe('-1');
  });
  it('keeps focus on Save while a slow save runs, then moves it to the heading when it ends', () => {
    let finish!: (ok: boolean) => void;
    render(<Slow onEnd={(f) => (finish = f)} />);
    choose('Role for Cubao Cafe', 'Staff');
    screen.getByRole('button', { name: 'Save changes' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const busy = screen.getByRole('button', { name: 'Saving' });
    expect(document.activeElement).toBe(busy);
    expect(document.activeElement).not.toBe(document.body);
    act(() => finish(true));
    expect(document.activeElement).toBe(heading());
  });
  it('does not take focus from another input the user went to during a slow save', () => {
    let finish!: (ok: boolean) => void;
    render(<Slow onEnd={(f) => (finish = f)} />);
    choose('Role for Cubao Cafe', 'Staff');
    screen.getByRole('button', { name: 'Save changes' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const other = screen.getByLabelText('Other field') as HTMLInputElement;
    other.focus();
    fireEvent.change(other, { target: { value: 'typing' } });
    act(() => finish(true));
    expect(document.activeElement).toBe(other);
    expect(other.value).toBe('typing');
  });
  it('does not pull focus back from the dropdown or the radio used right after Save (no timer)', async () => {
    function S() {
      const [sv, setSv] = useState(saved);
      const [v, setV] = useState(saved);
      return <RolePicker platforms={platforms} roleOptions={roleOptions} value={v} savedValue={sv} onChange={setV} onSave={setSv} onDiscard={() => setV(sv)} />;
    }
    render(<S />);
    choose('Role for Cubao Cafe', 'Staff');
    screen.getByRole('button', { name: 'Save changes' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const dd = screen.getByRole('combobox', { name: 'Role for Cebu Parts Stockroom' });
    dd.focus();
    fireEvent.click(dd);
    await new Promise((r) => setTimeout(r, 120));
    expect(document.activeElement).toBe(dd);
    expect(dd.getAttribute('aria-expanded')).toBe('true');
  });
  it('places focus on the heading when focus was lost to the page (body) or the pressed control is the only holder', () => {
    let finish!: (ok: boolean) => void;
    render(<Slow onEnd={(f) => (finish = f)} />);
    choose('Role for Cubao Cafe', 'Staff');
    screen.getByRole('button', { name: 'Save changes' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    (document.activeElement as HTMLElement).blur();
    expect(document.activeElement).toBe(document.body);
    act(() => finish(true));
    expect(document.activeElement).toBe(heading());
  });
  it('returns focus to Save when saving fails, unless the user moved on', () => {
    let finish!: (ok: boolean) => void;
    const { unmount } = render(<Slow onEnd={(f) => (finish = f)} />);
    choose('Role for Cubao Cafe', 'Staff');
    screen.getByRole('button', { name: 'Save changes' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    act(() => finish(false));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Save changes' }));
    unmount();
    cleanup();
    render(<Slow onEnd={(f) => (finish = f)} />);
    choose('Role for Cubao Cafe', 'Staff');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const other = screen.getByLabelText('Other field') as HTMLInputElement;
    other.focus();
    act(() => finish(false));
    expect(document.activeElement).toBe(other);
  });
  it('ignores clicks on Save and Discard while they are aria-disabled', () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    render(<H spy={{ onSave, onDiscard }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
  });
  it('moves focus to the heading after Save and remove, and after Discard; Cancel returns it to Save', async () => {
    function S() {
      const [sv, setSv] = useState(saved);
      const [v, setV] = useState(saved);
      return <RolePicker platforms={platforms} roleOptions={roleOptions} value={v} savedValue={sv} onChange={setV} onSave={setSv} onDiscard={() => setV(sv)} />;
    }
    render(<S />);
    choose('Role for Quezon City Auto Works', 'Not assigned');
    const save = screen.getByRole('button', { name: 'Save changes' });
    save.focus();
    fireEvent.click(save);
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(document.activeElement).toBe(save));
    fireEvent.click(save);
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Save and remove' }));
    await waitFor(() => expect(document.activeElement).toBe(heading()));
    choose('Role for Cubao Cafe', 'Staff');
    const d = screen.getByRole('button', { name: 'Discard' });
    d.focus();
    fireEvent.click(d);
    expect(document.activeElement).toBe(heading());
  });
  it('after Save and remove, leaves focus alone if the user went to another input', async () => {
    let finish!: (ok: boolean) => void;
    render(<Slow onEnd={(f) => (finish = f)} />);
    choose('Role for Quezon City Auto Works', 'Not assigned');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Save and remove' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    const other = screen.getByLabelText('Other field') as HTMLInputElement;
    other.focus();
    act(() => finish(true));
    expect(document.activeElement).toBe(other);
  });
  it('shows busy and error states', () => {
    render(<H saving error="Could not save." />);
    expect(screen.getByRole('alert').textContent).toContain('Could not save.');
    const busy = screen.getByRole('button', { name: 'Saving' });
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect(busy.getAttribute('aria-disabled')).toBe('true');
    expect((busy as HTMLButtonElement).disabled).toBe(false);
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
