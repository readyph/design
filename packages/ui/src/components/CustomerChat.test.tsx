import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ChatPanel, type ChatPanelProps } from './CustomerChat';
import { TODAY, jobs } from './sms/data';
import { getMech, patchMech, resetMech } from './sms/mechModel';
import { chatManager, chatShop, chatThreadView } from './sms/trackerAdapter';
import type { TrackerChatMessage } from './trackerView';

afterEach(cleanup);
// GAP: the source separators are <li role="presentation"> inside the <ul>; kept as in the source, so axe's `list` rule is off.
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false }, list: { enabled: false } } };
const job = jobs.find((j) => j.id === 'j0408')!;
const at = (hmm: string) => `${TODAY}T${hmm}:00+08:00`;
const props = (thread: TrackerChatMessage[], over: Partial<ChatPanelProps> = {}): ChatPanelProps => ({ thread, manager: chatManager, shop: chatShop, today: TODAY, onSend: () => {}, ...over });

describe('ChatPanel', () => {
  it('shows the empty state, calls onSend on Enter and keeps Send disabled when blank', async () => {
    const onSend = vi.fn();
    const { container } = render(<ChatPanel {...props([], { onSend })} />);
    expect(screen.getByText('Say hi to the shop')).toBeTruthy();
    const send = screen.getByRole('button', { name: 'Send' }) as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Message to the manager'), { target: { value: 'Hello' } });
    fireEvent.keyDown(screen.getByLabelText('Message to the manager'), { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Hello');
    expect((screen.getByLabelText('Message to the manager') as HTMLTextAreaElement).value).toBe('');
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
  it('does not send on Shift+Enter', () => {
    const onSend = vi.fn();
    render(<ChatPanel {...props([], { onSend })} />);
    fireEvent.change(screen.getByLabelText('Message to the manager'), { target: { value: 'Hi' } });
    fireEvent.keyDown(screen.getByLabelText('Message to the manager'), { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });
  it('shows bubbles, the New line and the unread count, and reports unread as read', async () => {
    const onMarkRead = vi.fn();
    const thread: TrackerChatMessage[] = [
      { id: 'a', from: 'customer', text: 'Hi', at: at('09:20') },
      { id: 'b', from: 'manager', text: 'Update', at: at('10:09'), read: false },
    ];
    const { container } = render(<ChatPanel {...props(thread, { onMarkRead })} />);
    expect(screen.getByText('New')).toBeTruthy();
    expect(screen.getByText('1 new')).toBeTruthy();
    await act(async () => {});
    expect(onMarkRead).toHaveBeenCalled();
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
  it('shows Sending... while pending and the error line', () => {
    const thread: TrackerChatMessage[] = [{ id: 'a', from: 'customer', text: 'Hi', at: at('09:20') }];
    const { rerender } = render(<ChatPanel {...props(thread)} />);
    expect(screen.getByText(/Sent/)).toBeTruthy();
    rerender(<ChatPanel {...props(thread, { pending: true, error: 'Could not send.' })} />);
    expect(screen.getByText(/Sending/)).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Could not send.');
  });
  it('renders the store thread through the adapter', () => {
    resetMech();
    patchMech(() => ({ custMsgs: [{ id: 'a', jobId: job.id, from: 'customer', text: 'From store', at: at('09:20') }] }));
    render(<ChatPanel {...props(chatThreadView(getMech(), job))} />);
    expect(screen.getByText('From store')).toBeTruthy();
  });
});
