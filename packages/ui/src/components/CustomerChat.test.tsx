import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ChatPanel } from './CustomerChat';
import { jobs, TODAY } from './sms/data';
import { getMech, patchMech, resetMech } from './sms/mechModel';

afterEach(cleanup);
// GAP: the source separators are <li role="presentation"> inside the <ul>; kept as in the source, so axe's `list` rule is off.
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, list: { enabled: false } } };
const job = jobs.find((j) => j.id === 'j0408')!;
const at = (hmm: string) => `${TODAY}T${hmm}:00+08:00`;

describe('ChatPanel', () => {
  it('shows the empty state, sends with Enter and keeps Send disabled when blank', async () => {
    resetMech();
    const { container } = render(<ChatPanel job={job} s={getMech()} />);
    expect(screen.getByText('Say hi to the shop')).toBeTruthy();
    const send = screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Message to the manager'), { target: { value: 'Hello' } });
    fireEvent.keyDown(screen.getByLabelText('Message to the manager'), { key: 'Enter' });
    expect(getMech().custMsgs.map((m) => m.text)).toEqual(['Hello']);
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
  it('shows bubbles, the New line and the unread count', async () => {
    resetMech();
    patchMech(() => ({ custMsgs: [
      { id: 'a', jobId: job.id, from: 'customer', text: 'Hi', at: at('09:20') },
      { id: 'b', jobId: job.id, from: 'manager', text: 'Update', at: at('10:09'), read: false },
    ] }));
    const { container } = render(<ChatPanel job={job} s={getMech()} />);
    expect(screen.getByText('New')).toBeTruthy();
    expect(screen.getByText('1 new')).toBeTruthy();
    await act(async () => {});
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
});
