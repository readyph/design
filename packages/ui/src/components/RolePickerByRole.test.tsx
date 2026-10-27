// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { useState } from 'react';
import { RolePicker, type RolePickerByRoleProps, type RolePickerRoles } from './RolePicker';
import { invites, people, roleOptions, savedByRole } from './RolePicker.data';

afterEach(cleanup);

type Extra = Partial<Omit<RolePickerByRoleProps, 'mode'>>;
function H(p: Extra) {
  const [v, setV] = useState<RolePickerRoles>(savedByRole);
  return <RolePicker mode="by-role" platformName="Auto Works" people={people} invites={invites} roles={roleOptions['Repair shop']} value={v} savedValue={savedByRole} onChange={setV} onSave={() => {}} onDiscard={() => setV(savedByRole)} {...p} />;
}
const choose = (name: string, option: string) => {
  fireEvent.click(screen.getByRole('combobox', { name }));
  fireEvent.click(screen.getByRole('option', { name: option }));
};
const off = (b: HTMLElement) => b.getAttribute('aria-disabled') === 'true';

describe('RolePicker by-role', () => {
  it('renders one row per person with the role dropdown and the role line under it', () => {
    const { container } = render(<H />);
    expect(container.querySelectorAll('[data-person]')).toHaveLength(4);
    const cb = screen.getByRole('combobox', { name: 'Ana Cruz’s role at Auto Works' });
    expect(cb.textContent).toContain('Service advisor');
    expect(document.getElementById(cb.getAttribute('aria-describedby')!)?.textContent).toBe('Opens jobs, talks to customers and sends estimates.');
    fireEvent.click(cb);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Not assigned', 'Manager', 'Service advisor', 'Mechanic', 'Viewer']);
  });
  it('can leave the role lines out', () => {
    render(<H roleLines={false} />);
    expect(screen.queryByText('Sees and updates the jobs assigned to them.')).toBeNull();
  });
  it('shows Admin and Owner as a tag, with the title for members and what they do elsewhere', () => {
    render(<H />);
    expect(screen.getByText('Admin · Owner')).toBeTruthy();
    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.getByText('Service advisor', { selector: 'span.block' })).toBeTruthy();
    expect(screen.getByText(/also Stock clerk at Cebu Parts Stockroom/)).toBeTruthy();
    // the tag is not a control: no company access radios, and no way to change access
    expect(screen.queryByRole('radio')).toBeNull();
  });
  it('shows a pending invite read only, with its role', () => {
    const { container } = render(<H />);
    const row = container.querySelector<HTMLElement>('[data-invite="eli"]')!;
    expect(within(row).getByText('Mechanic when they join')).toBeTruthy();
    expect(within(row).getByText('Invite not sent yet')).toBeTruthy();
    expect(within(row).queryByRole('combobox')).toBeNull();
    expect(within(row).queryByRole('button')).toBeNull();
  });
  it('keeps Save and Discard disabled until a role changes, and Discard restores', () => {
    render(<H />);
    expect(off(screen.getByRole('button', { name: 'Save changes' }))).toBe(true);
    choose('Ana Cruz’s role at Auto Works', 'Viewer');
    expect(off(screen.getByRole('button', { name: 'Save changes' }))).toBe(false);
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByRole('combobox', { name: 'Ana Cruz’s role at Auto Works' }).textContent).toContain('Service advisor');
  });
  it('saves a plain change without asking', () => {
    const onSave = vi.fn();
    render(<H onSave={onSave} />);
    choose('Ana Cruz’s role at Auto Works', 'Viewer');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onSave).toHaveBeenCalledWith({ ...savedByRole, ac: 'viewer' });
  });
  it('asks first on Not assigned, with the default words, and applies on Save', () => {
    const onSave = vi.fn();
    render(<H onSave={onSave} />);
    choose('Ramon Bautista’s role at Auto Works', 'Not assigned');
    expect(screen.getByText("Ramon Bautista can't open Auto Works.")).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(onSave).not.toHaveBeenCalled();
    const dlg = screen.getByRole('alertdialog');
    expect(within(dlg).getByText('Take Ramon Bautista off Auto Works?')).toBeTruthy();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Save and remove' }));
    expect(onSave).toHaveBeenCalledWith({ ...savedByRole, rb: null });
  });
  it('uses the removal copy props, as text or as functions of the people removed', () => {
    render(
      <H
        removeConfirm={{
          title: (r) => `Take ${r[0]!.name.split(' ')[0]} off Auto Works?`,
          description: 'They lose their role here.',
          confirmLabel: 'Remove and save',
        }}
      />,
    );
    choose('Ramon Bautista’s role at Auto Works', 'Not assigned');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    const dlg = screen.getByRole('alertdialog');
    expect(within(dlg).getByText('Take Ramon off Auto Works?')).toBeTruthy();
    expect(within(dlg).getByText('They lose their role here.')).toBeTruthy();
    expect(within(dlg).getByRole('button', { name: 'Remove and save' })).toBeTruthy();
    fireEvent.click(within(dlg).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
  it('names several people in one confirm', () => {
    render(<H />);
    choose('Ana Cruz’s role at Auto Works', 'Not assigned');
    choose('Ramon Bautista’s role at Auto Works', 'Not assigned');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(within(screen.getByRole('alertdialog')).getByText('Take Ana Cruz and Ramon Bautista off Auto Works?')).toBeTruthy();
  });
  it('with a host-owned bar: no Save or Discard, no Not assigned, an X per row that reports the person', () => {
    const onRemovePerson = vi.fn();
    render(<H hideActions onRemovePerson={onRemovePerson} />);
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Discard' })).toBeNull();
    fireEvent.click(screen.getByRole('combobox', { name: 'Ana Cruz’s role at Auto Works' }));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).not.toContain('Not assigned');
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Ana Cruz’s role at Auto Works' }), { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Take Ana Cruz off Auto Works' }));
    expect(onRemovePerson).toHaveBeenCalledWith('ac');
  });
  it('opens a person through onOpenPerson and keeps the href', () => {
    const onOpenPerson = vi.fn();
    render(<H onOpenPerson={onOpenPerson} />);
    const a = screen.getByRole('link', { name: 'Ana Cruz' });
    expect(a.getAttribute('href')).toBe('#');
    fireEvent.click(a);
    expect(onOpenPerson).toHaveBeenCalledWith('ac');
  });
  it('goes read only with its reason, and shows busy and error states', () => {
    const { rerender } = render(<H readOnly readOnlyReason="Only an admin can change roles." />);
    expect(screen.getByText('Only an admin can change roles.')).toBeTruthy();
    expect((screen.getByRole('combobox', { name: 'Ana Cruz’s role at Auto Works' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
    rerender(<H saving error="Could not save." />);
    expect(screen.getByRole('alert').textContent).toContain('Could not save.');
    expect(screen.getByRole('button', { name: 'Saving' }).getAttribute('aria-busy')).toBe('true');
  });
  it('moves focus to the heading after Save', () => {
    function S() {
      const [v, setV] = useState<RolePickerRoles>(savedByRole);
      const [s, setS] = useState(savedByRole);
      return <RolePicker mode="by-role" heading="Team" platformName="Auto Works" people={people} roles={roleOptions['Repair shop']} value={v} savedValue={s} onChange={setV} onSave={setS} onDiscard={() => setV(s)} />;
    }
    render(<S />);
    choose('Ana Cruz’s role at Auto Works', 'Viewer');
    const save = screen.getByRole('button', { name: 'Save changes' });
    save.focus();
    fireEvent.click(save);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Team' }));
  });
  it('says so when nobody works here, and keeps caller classes', () => {
    const { container } = render(<H people={[]} invites={[]} className="mt-2" />);
    expect(screen.getByText('Nobody works here yet.')).toBeTruthy();
    expect(container.firstElementChild?.className).toContain('mt-2');
  });
  it('has no axe violations', async () => {
    const { container } = render(<H heading="Team" />);
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
    expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
  });
});
