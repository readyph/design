// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useState } from 'react';
import axe from 'axe-core';
import { Chat, ChatBlocks, ChatComposer, ChatEmpty, ChatHeader, ChatMessage, ChatThread, LEDA_CONVERSATION_KEY, usePersistedChat } from './Chat';
import { chatSample } from './Chat.sample';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.sessionStorage.clear();
});

const check = async (el: HTMLElement) => {
  const r = await axe.run(el, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } });
  expect(r.violations.map((v) => `${v.id}: ${v.nodes[0]?.html}`)).toEqual([]);
};

function Panel({ onClose = () => {}, onNew = () => {}, busy = false, onSend = () => {} }: { onClose?: () => void; onNew?: () => void; busy?: boolean; onSend?: (v: string) => void }) {
  const [v, setV] = useState('');
  return (
    <Chat variant="inline" onClose={onClose}>
      <ChatHeader busy={busy} onNewConversation={onNew} onClose={onClose} />
      <ChatThread>{chatSample.withProposal.map((m) => <ChatMessage key={m.id} message={m} />)}</ChatThread>
      <ChatComposer value={v} onChange={setV} onSend={onSend} busy={busy} scope="About Parts Stockroom" />
    </Chat>
  );
}

describe('Chat', () => {
  it('renders a labelled region, a log, flat rows with scope chip and the proposal card; no axe violations', async () => {
    const { container } = render(<Panel />);
    expect(screen.getByRole('region', { name: 'Leda conversation' })).toBeTruthy();
    const log = screen.getByRole('log');
    expect(log.getAttribute('aria-live')).toBe('polite');
    expect(screen.getAllByText('About Parts Stockroom').length).toBe(2); // owner message chip + composer chip
    expect(screen.getByRole('group', { name: 'Raise oil filter reorder level to 30' })).toBeTruthy();
    await check(container);
  });

  it('every block type renders and passes axe', async () => {
    const { container } = render(<ChatBlocks blocks={[...chatSample.thread.flatMap((m) => m.blocks), { type: 'figure', value: 'PHP 1', label: 'Sales' }, { type: 'actions', actions: [{ id: 'a', label: 'Open' }] }]} />);
    expect(screen.getByRole('table', { name: 'Data links' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Data links' })).toBeTruthy();
    expect(screen.getByRole('note', { name: "Leda can't do this" })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Go to Parts Stockroom' })).toBeTruthy();
    await check(container);
  });

  it('empty state shows scope, copy and chips that can be picked', () => {
    const pick = vi.fn();
    render(<ChatEmpty scope="Memory" chips={chatSample.chips} onPick={pick} />);
    expect(screen.getByRole('heading', { name: 'Ask Leda about Memory' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: chatSample.chips[0]!.label }));
    expect(pick).toHaveBeenCalledWith(chatSample.chips[0]);
  });

  it('moves focus into the composer on open and back to the opener on unmount (only when lost)', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const { unmount } = render(<Panel />);
    const composer = screen.getByRole('textbox', { name: 'Ask Leda' });
    expect(document.activeElement).toBe(composer);
    unmount();
    expect(document.activeElement).toBe(opener);
    // The user moved on meanwhile: focus stays where they put it.
    const other = document.createElement('input');
    document.body.append(other);
    opener.focus();
    const again = render(<Panel />);
    other.focus();
    again.unmount();
    expect(document.activeElement).toBe(other);
    opener.remove();
    other.remove();
  });

  it('Esc closes the panel, but not when a dialog above took the key', () => {
    const onClose = vi.fn();
    render(<Panel onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Enter sends, Shift+Enter does not, empty and busy do not; Send stays focusable while busy', () => {
    const onSend = vi.fn();
    const { rerender } = render(<ChatComposer value="  " onChange={() => {}} onSend={onSend} scope="About Home" />);
    const box = screen.getByRole('textbox');
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
    rerender(<ChatComposer value="Hello" onChange={() => {}} onSend={onSend} scope="About Home" />);
    fireEvent.keyDown(box, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
    fireEvent.keyDown(box, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Hello');
    rerender(<ChatComposer value="Hello" onChange={() => {}} onSend={onSend} busy scope="About Home" />);
    const send = screen.getByRole('button', { name: 'Send' });
    send.focus();
    expect(document.activeElement).toBe(send);
    expect(send.hasAttribute('disabled')).toBe(false);
    expect(send.getAttribute('aria-disabled')).toBe('true');
    expect(send.getAttribute('aria-busy')).toBe('true');
    fireEvent.click(send);
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(send);
  });

  it('disabled New conversation uses aria-disabled variants so the muted/50%/default-cursor look beats the Button and keepFocus classes', () => {
    render(<ChatHeader empty onNewConversation={vi.fn()} />);
    const cls = screen.getByRole('button', { name: 'New conversation' }).className;
    for (const c of ['aria-disabled:opacity-50', 'aria-disabled:cursor-default', 'aria-disabled:hover:bg-transparent', 'aria-disabled:hover:text-muted']) expect(cls).toContain(c);
  });

  it('New conversation asks first; Confirm clears and puts focus in the composer; Cancel does nothing', () => {
    const onNew = vi.fn();
    render(<Panel onNew={onNew} />);
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onNew).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'New conversation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start new conversation' }));
    expect(onNew).toHaveBeenCalledTimes(1);
  });

  it('streams word by word (all words laid out, full text for assistive tech) and reports when done', () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const { container } = render(<ChatBlocks blocks={[{ type: 'text', text: 'One two three', stream: true }]} onStreamed={done} />);
    expect(container.querySelector('.sr-only, [class*="clip"]')?.textContent).toBe('One two three');
    const words = () => Array.from(container.querySelectorAll('[aria-hidden] > span')).map((s) => s.className.includes('opacity-100'));
    expect(words()).toEqual([false, false, false]);
    act(() => { vi.advanceTimersByTime(70); });
    expect(words()).toEqual([true, true, false]);
    act(() => { vi.advanceTimersByTime(100); });
    expect(words()).toEqual([true, true, true]);
    expect(done).toHaveBeenCalled();
  });

  it('shows the reply at once under reduced motion', () => {
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false, onchange: null })) as typeof window.matchMedia;
    const { container } = render(<ChatBlocks blocks={[{ type: 'text', text: 'One two', stream: true }]} />);
    expect(Array.from(container.querySelectorAll('[aria-hidden] > span')).every((s) => s.className.includes('opacity-100'))).toBe(true);
    window.matchMedia = mm;
  });

  it('thinking row: Aurora avatar, reserved line, aria-busy; header tagline switches under reduced motion', () => {
    render(<ChatMessage message={{ id: 't', from: 'leda', name: 'Leda', thinking: true, blocks: [] }} />);
    expect(screen.getByText('Thinking…')).toBeTruthy();
    expect(screen.getByRole('article', { name: 'Leda' }).getAttribute('aria-busy')).toBe('true');
    cleanup();
    render(<ChatHeader busy />);
    expect(screen.getByRole('status').textContent).toBe('Leda is thinking');
    expect(screen.getByText('Ask Leda').className).toContain('motion-reduce:hidden');
  });

  it('persists the thread in sessionStorage under rph-leda-convo-v1 and survives corrupt storage', () => {
    const { result, unmount } = renderHook(() => usePersistedChat<string[]>([]));
    act(() => result.current[1](['a']));
    expect(JSON.parse(window.sessionStorage.getItem(LEDA_CONVERSATION_KEY)!)).toEqual(['a']);
    unmount();
    expect(renderHook(() => usePersistedChat<string[]>([])).result.current[0]).toEqual(['a']);
    window.sessionStorage.setItem(LEDA_CONVERSATION_KEY, '{nope');
    expect(renderHook(() => usePersistedChat<string[]>(['x'])).result.current[0]).toEqual(['x']);
  });
});
