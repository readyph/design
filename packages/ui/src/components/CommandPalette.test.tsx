// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { CommandPalette, type CommandPaletteGroup } from './CommandPalette';

afterEach(cleanup);

const groups: CommandPaletteGroup[] = [
  { id: 'ask', label: 'Ask Leda', items: [{ id: 'a1', label: 'What is low?', leda: true }] },
  {
    id: 'go',
    label: 'Go to',
    items: [
      { id: 'g1', label: 'Home' },
      { id: 'g2', label: 'Settings', keywords: ['system'] },
      { id: 'g3', label: 'Off', disabled: true },
    ],
  },
];

function Demo({ onSelect = () => {}, onAsk = () => {}, messages = 0, onConvo = () => {}, withAsk = true }: { onSelect?: (l: string) => void; onAsk?: (q: string) => void; messages?: number; onConvo?: () => void; withAsk?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        onSelect={(i) => onSelect(i.label)}
        onAsk={withAsk ? onAsk : undefined}
        conversationMessages={messages}
        onOpenConversation={onConvo}
      />
    </>
  );
}

const opened = async (props = {}) => {
  render(<Demo {...props} />);
  await userEvent.click(screen.getByText('Open'));
  return screen.getByRole('combobox');
};

describe('CommandPalette', () => {
  it('is a modal dialog with a combobox focused and a listbox of grouped options', async () => {
    const input = await opened();
    const d = screen.getByRole('dialog', { name: 'Ask Leda' });
    expect(d.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(input);
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-labelledby'))).toHaveLength(2);
    expect(screen.getByRole('listbox').querySelectorAll('button, a, input')).toHaveLength(0);
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getAllByRole('option')[0].id);
  });

  it('arrows move the selection (wrapping, skipping disabled) and Enter runs it', async () => {
    const onSelect = vi.fn();
    const input = await opened({ onSelect });
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /Home/ }).getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('option', { name: /What is low/ }).getAttribute('aria-selected')).toBe('true');
    await userEvent.keyboard('{ArrowUp}');
    expect(input.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: /Settings/ }).id);
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('Settings');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('filters as you type, including keywords, and shows the Ask row first', async () => {
    const onAsk = vi.fn();
    await opened({ onAsk });
    await userEvent.keyboard('system');
    const opts = screen.getAllByRole('option');
    expect(opts[0].textContent).toContain('Ask Leda: “system”');
    expect(opts.map((o) => o.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Settings')]));
    expect(screen.queryByRole('option', { name: /Home/ })).toBeNull();
    await userEvent.keyboard('{Enter}');
    expect(onAsk).toHaveBeenCalledWith('system');
  });

  it('shows an empty state when nothing matches and there is no Ask row', async () => {
    await opened({ withAsk: false });
    await userEvent.keyboard('zzzz');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByText(/No match for/)).toBeTruthy();
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe('false');
  });

  it('offers the open conversation with an empty input only', async () => {
    const onConvo = vi.fn();
    await opened({ messages: 4, onConvo });
    expect(screen.getByRole('option', { name: /Open your conversation with Leda \(4 messages\)/ })).toBeTruthy();
    await userEvent.keyboard('{Enter}');
    expect(onConvo).toHaveBeenCalled();
  });

  it('Enter during IME composition does not run a row', async () => {
    const onSelect = vi.fn();
    const onAsk = vi.fn();
    const input = await opened({ onSelect, onAsk });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true, keyCode: 229 });
    expect(onAsk).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('What is low?');
  });

  it('click runs a row; Esc closes and focus returns to the opener', async () => {
    const onSelect = vi.fn();
    render(<Demo onSelect={onSelect} />);
    const opener = screen.getByText('Open');
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    await userEvent.click(opener);
    await userEvent.click(screen.getByRole('option', { name: /Home/ }));
    expect(onSelect).toHaveBeenCalledWith('Home');
  });

  it('reopens with an empty input on first paint and typed text is not polluted', async () => {
    const seen: string[] = [];
    function Probe() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Open</button>
          <CommandPalette open={open} onOpenChange={setOpen} groups={groups} onSelect={() => {}} />
        </>
      );
    }
    // Records the input's value the moment it is first inserted in the DOM (before any later effect or timer).
    const mo = new MutationObserver(() => {
      const i = document.querySelector('input[role=combobox]') as HTMLInputElement | null;
      if (i && !i.dataset.seen) { i.dataset.seen = '1'; seen.push(i.value); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    render(<Probe />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.keyboard('stock{Escape}');
    await userEvent.click(screen.getByText('Open'));
    await Promise.resolve();
    mo.disconnect();
    expect(seen).toEqual(['', '']);
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('');
    await userEvent.keyboard('go');
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('go');
  });

  it('Esc during IME composition does not close; a plain Esc does', async () => {
    const input = await opened();
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Escape', isComposing: true, keyCode: 229 });
    expect(screen.getByRole('dialog')).toBeTruthy();
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('keeps focus inside on Tab', async () => {
    await opened();
    await userEvent.tab();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });

  it('registers no global shortcuts', async () => {
    render(<Demo />);
    await userEvent.keyboard('{Control>}k{/Control}/');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('caller className cannot remove the layout classes it does not override', async () => {
    render(<CommandPalette open onOpenChange={() => {}} groups={groups} onSelect={() => {}} className="my-x" />);
    const d = screen.getByRole('dialog');
    expect(d.className).toContain('my-x');
    expect(d.className).toContain('top-[72px]');
    expect(d.className).toContain('w-[min(640px,calc(100vw-32px))]');
  });
});
