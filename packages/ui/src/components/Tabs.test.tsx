// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tabs, TabPanel, type TabItem } from './Tabs';
import { SheetBar } from './SheetBar';

afterEach(cleanup);
const items: TabItem[] = [
  { value: 'a', label: 'Today' },
  { value: 'b', label: 'Case B', closable: true },
  { value: 'c', label: 'Case C', closable: true, preview: true },
];

describe('Tabs', () => {
  it('renders tablist/tab with roving tabindex and aria-selected', () => {
    render(<Tabs items={items} aria-label="Open" />);
    expect(screen.getByRole('tablist', { name: 'Open' })).toBeTruthy();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    // Radix parks the tab stop on the list until focus enters; then exactly one tab is tabindex 0.
    act(() => tabs[0].focus());
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('moves with arrows, Home and End and switches (automatic activation)', async () => {
    const fn = vi.fn();
    const user = userEvent.setup();
    render(<Tabs items={items} onValueChange={fn} />);
    const tabs = screen.getAllByRole('tab');
    tabs[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(tabs[1]);
    expect(fn).toHaveBeenLastCalledWith('b');
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(tabs[2]);
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(tabs[0]);
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('uses Up/Down in the vertical list and shows the status word in warn', async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        variant="vertical"
        items={[
          { value: 'a', label: 'System', status: 'Saved' },
          { value: 'b', label: 'Settings', status: 'Unsaved', statusTone: 'warn' },
        ]}
      />,
    );
    screen.getAllByRole('tab')[0].focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getAllByRole('tab')[1]);
    expect(screen.getByText('Unsaved').className).toContain('text-warn');
    expect(screen.getByText('Saved').className).toContain('text-muted');
  });

  it('only sets aria-controls while the panel renders', () => {
    render(
      <Tabs items={items}>
        <TabPanel value="a">A body</TabPanel>
      </Tabs>,
    );
    const [a, b] = screen.getAllByRole('tab');
    const panel = screen.getByRole('tabpanel');
    expect(a.getAttribute('aria-controls')).toBe(panel.id);
    expect(b.hasAttribute('aria-controls')).toBe(false);
  });

  it('navigation-only tabs carry no aria-controls', () => {
    render(<Tabs items={items} />);
    screen.getAllByRole('tab').forEach((t) => expect(t.hasAttribute('aria-controls')).toBe(false));
  });

  it('fades the panel in (opacity animation, no slide)', () => {
    render(
      <Tabs items={items}>
        <TabPanel value="a">A</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tabpanel').className).toContain('animate-tab-fade');
  });
});

describe('Tabs editor', () => {
  it('closes with the button and the Delete key, handing focus to a neighbour', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Tabs variant="editor" items={items} onClose={onClose} />);
    const tabs = screen.getAllByRole('tab');
    tabs[1].focus();
    await user.keyboard('{Delete}');
    expect(onClose).toHaveBeenLastCalledWith('b');
    expect(document.activeElement).toBe(tabs[2]);
  });

  it('closes from the X without selecting the tab; the tablist holds only tabs', () => {
    const onClose = vi.fn();
    const onValueChange = vi.fn();
    const { container } = render(<Tabs variant="editor" items={items} onClose={onClose} onValueChange={onValueChange} />);
    expect(container.querySelectorAll('[data-close]')).toHaveLength(2);
    const x = screen.getByRole('tab', { name: 'Case B' }).querySelector('[data-close]')!;
    fireEvent.mouseDown(x);
    fireEvent.click(x);
    expect(onClose).toHaveBeenCalledWith('b');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(container.querySelector('[role="tablist"] button:not([role="tab"])')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Case B' }).getAttribute('aria-keyshortcuts')).toBe('Delete');
    expect(screen.getByRole('tab', { name: 'Today' }).hasAttribute('aria-keyshortcuts')).toBe(false);
  });

  it('pins a preview tab on double-click, italic label, 96-180px width', () => {
    const onPin = vi.fn();
    render(<Tabs variant="editor" items={items} onPin={onPin} />);
    fireEvent.doubleClick(screen.getByRole('tab', { name: 'Case C' }));
    expect(onPin).toHaveBeenCalledWith('c');
    expect(screen.getByText('Case C').className).toContain('italic');
    const wrap = screen.getByRole('tab', { name: 'Case C' }).parentElement!;
    expect(wrap.className).toContain('min-w-[96px]');
    expect(wrap.className).toContain('max-w-[180px]');
  });
});

describe('SheetBar', () => {
  it('is 48px with side padding (PlatformShell draws the border under it)', () => {
    render(<SheetBar actions={<button>Invite</button>}>left</SheetBar>);
    const bar = screen.getByText('left').parentElement!;
    expect(bar.className).toContain('h-[calc(var(--sheet-bar)-1px)]');
    expect(bar.className).toContain('px-pad');
    expect(screen.getByText('Invite')).toBeTruthy();
  });
});
