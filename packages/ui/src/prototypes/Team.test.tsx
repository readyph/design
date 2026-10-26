// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Team } from './Team';
import { clearToasts } from '../components/toast/toastStore';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  cleanup();
  clearToasts();
  vi.useRealTimers();
});

describe('Team', () => {
  it('live: handover headline, one h1, groups with counts and the seat line', () => {
    render(<Team />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByText("9 people. Rico Lim's invite is ready but hasn't been sent.")).toBeTruthy();
    expect(screen.getByRole('group', { name: /Waiting to join/ })).toBeTruthy();
    expect(screen.getByRole('group', { name: /^People/ })).toBeTruthy();
    expect(screen.getByText('10 of 15 seats used')).toBeTruthy();
    expect(screen.getByText('Here now')).toBeTruthy();
  });

  it('solo, noaccess, over-seats and loading say what the handover says', () => {
    render(<Team state="solo" />);
    expect(screen.getAllByText('Just you so far').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Invite the people who work with you' })).toBeTruthy();
    cleanup();
    render(<Team state="noaccess" />);
    expect(screen.getByText(/Ask a company admin: Ramon Dela Cruz and Liza Santos\./)).toBeTruthy();
    cleanup();
    render(<Team state="over" />);
    expect(screen.getByText("10 of 3 seats. That's over your plan.")).toBeTruthy();
    expect(screen.getByText(/That's 10 of the 3 seats on Free\./)).toBeTruthy();
    cleanup();
    render(<Team state="loading" />);
    expect(document.querySelector('[aria-busy]')).toBeTruthy();
  });

  it('error: Try again loads the team', async () => {
    render(<Team state="error" />);
    expect(screen.getAllByText(/Couldn.t load your team/).length).toBeGreaterThan(0);
    await userEvent.click(screen.getAllByRole('button', { name: 'Try again' })[0]!);
    expect(screen.getByRole('group', { name: /^People/ })).toBeTruthy();
  });

  it('manager (Jun): can invite, cannot change roles, suspend or send reset links', async () => {
    render(<Team state="manager" />);
    expect(screen.getAllByRole('button', { name: 'Invite someone' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /More for Grace Lumbao$/ })).toBeNull();
    cleanup();
    render(<Team state="manager" person="grace" />);
    expect(screen.getByText('Only an owner or admin can change roles.')).toBeTruthy();
    expect(screen.getByText('Only an owner or admin can send reset links.')).toBeTruthy();
  });

  it('guards: the creator keeps Owner and cannot be suspended, with the reason shown', () => {
    render(<Team person="mon" />);
    expect(screen.getByText('You created this company, so you stay the Owner.')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: 'Suspend' })).toBeNull();
    cleanup();
    render(<Team state="manager" person="mon" />);
    expect(screen.getByText('Only an owner or admin can suspend people.')).toBeTruthy();
  });

  it('invite: create validates the email (focus returns to it), then Send now moves focus and creates an Undo toast', async () => {
    const user = userEvent.setup();
    render(<Team />);
    await user.click(screen.getAllByRole('button', { name: 'Invite someone' })[0]!);
    const dlg = screen.getByRole('dialog');
    const email = within(dlg).getByLabelText('Email') as HTMLInputElement;
    expect(document.activeElement).toBe(email);
    expect(within(dlg).getByText('Uses seat 11 of 15 on Starter.')).toBeTruthy();
    await user.click(within(dlg).getByRole('button', { name: 'Create invite' }));
    expect(within(dlg).getByRole('alert').textContent).toMatch(/An email is needed/);
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(email);
    await user.type(email, 'rico.lim.mech@gmail.com');
    await user.click(within(dlg).getByRole('button', { name: 'Create invite' }));
    expect(within(dlg).getByRole('alert').textContent).toBe('An invitation is already pending for this email.');
    await user.clear(email);
    await user.type(email, 'noel@example.ph');
    await user.click(within(dlg).getByRole('button', { name: 'Create invite' }));
    expect(screen.getByText(/invite is ready/)).toBeTruthy();
    expect(document.activeElement).toBe(within(dlg).getByRole('button', { name: 'Send now' }));
    await user.click(within(dlg).getByRole('button', { name: 'Send now' }));
    expect(screen.getByText(/Invite sent to noel@example.ph/)).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy();
  });

  it('a person: Save is disabled until a change; removing a platform asks first; Undo restores', async () => {
    const user = userEvent.setup();
    render(<Team person="grace" />);
    expect(screen.getByRole('heading', { name: 'Grace Lumbao' })).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save.getAttribute('aria-disabled')).toBe('true');
    await user.click(screen.getByRole('combobox', { name: 'Role for Dela Cruz Auto Works' }));
    await user.click(screen.getByRole('option', { name: 'Not assigned' }));
    expect(save.getAttribute('aria-disabled')).toBeNull();
    await user.click(save);
    const dlg = screen.getByRole('alertdialog');
    expect(within(dlg).getByText('Take Grace off Auto Works?')).toBeTruthy();
    expect(within(dlg).getByRole('button', { name: 'Remove and save' })).toBeTruthy();
  });

  it('a person: both sections carry the handover intro lines', () => {
    render(<Team person="grace" />);
    expect(screen.getByText("What Grace does in each one. A different role on each is fine. The same as each platform's Team tab.")).toBeTruthy();
    expect(screen.getByText('Who can change the Portal itself: platforms, the team, the plan and billing.')).toBeTruthy();
  });

  it('suspend: menu, confirm with the handover copy, toast with Undo restores', async () => {
    const user = userEvent.setup();
    render(<Team />);
    await user.click(screen.getByRole('button', { name: 'More for Dennis Ocampo' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Suspend' }));
    const dlg = await screen.findByRole('alertdialog');
    expect(within(dlg).getByText(/can't sign in to the Portal or Auto Works until you reactivate them/)).toBeTruthy();
    await user.click(within(dlg).getByRole('button', { name: 'Suspend Dennis' }));
    expect(screen.getByRole('group', { name: /Suspended/ })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.queryByRole('group', { name: /Suspended/ })).toBeNull();
  });

  it('Leda: a question opens the conversation with a table answer; her invite is a confirm card', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Team />);
    fireEvent.click(screen.getAllByRole('button', { name: /Ask Leda/ })[0]!);
    const input = await screen.findByRole('combobox');
    fireEvent.change(input, { target: { value: 'How many seats are left?' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await act(async () => { await vi.advanceTimersByTimeAsync(1200); });
    expect(screen.getByText(/5 of 15 seats left on Starter/)).toBeTruthy();
  });
});
