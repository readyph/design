// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { List, ListCell, ListHeader, ListHeaderCell, ListMetric, ListMetrics, ListRow, listRowSurface } from './List';

afterEach(cleanup);

const plain = (onOpen = vi.fn(), props = {}) =>
  render(
    <List aria-label="Links" {...props}>
      <ListRow rowId="a" label="Stock" onActivate={() => onOpen('a')}><ListCell>A <button>Remove</button></ListCell></ListRow>
      <ListRow rowId="b" label="Catalog" onActivate={() => onOpen('b')}><ListCell>B</ListCell></ListRow>
      <ListRow rowId="c" dimmed><ListCell>C</ListCell></ListRow>
    </List>,
  );

describe('List', () => {
  it('is a list of listitems by default', () => {
    plain();
    expect(screen.getByRole('list', { name: 'Links' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('uses table roles with column headers in table mode', () => {
    render(
      <List as="table" aria-label="P" columns="1fr 1fr">
        <ListHeader><ListHeaderCell>Platform</ListHeaderCell><ListHeaderCell>Now</ListHeaderCell></ListHeader>
        <ListRow rowId="a"><ListCell>x</ListCell><ListCell>y</ListCell></ListRow>
      </List>,
    );
    expect(screen.getByRole('table', { name: 'P' })).toBeTruthy();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getAllByRole('cell')).toHaveLength(2);
    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('puts the columns on the list as a variable, not on the caller class', () => {
    const { container } = plain(vi.fn(), { columns: '1fr 120px', className: 'mt-4' });
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue('--list-cols')).toBe('1fr 120px');
    expect(container.firstElementChild!.className).toContain('@container/list');
  });

  it('j / k move the cursor with aria-current, clamped at the ends', () => {
    plain();
    const items = screen.getAllByRole('listitem');
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(items[0].getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(document.body, { key: 'j' });
    fireEvent.keyDown(document.body, { key: 'j' });
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(items[2].getAttribute('aria-current')).toBe('true');
    expect(items[0].getAttribute('aria-current')).toBeNull();
    fireEvent.keyDown(document.body, { key: 'k' });
    expect(items[1].getAttribute('data-current')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Catalog 2 of 3');
  });

  it('Enter opens the cursor row, but not from a button or an input', () => {
    const open = vi.fn();
    plain(open);
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(open).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: 'j' });
    fireEvent.keyDown(document.body, { key: 'Enter' });
    expect(open).toHaveBeenCalledWith('a');
    open.mockClear();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Remove' }), { key: 'Enter' });
    expect(open).not.toHaveBeenCalled();
  });

  it('ignores j / k while typing', () => {
    plain();
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'j' });
    expect(screen.getAllByRole('listitem')[0].getAttribute('aria-current')).toBeNull();
    input.remove();
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'plaintext-only');
    editor.innerHTML = '<b>x</b>';
    document.body.appendChild(editor);
    fireEvent.keyDown(editor.firstElementChild!, { key: 'j' });
    expect(screen.getAllByRole('listitem')[0].getAttribute('aria-current')).toBeNull();
    editor.remove();
  });

  it('removes its keydown listener on unmount', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = plain();
    const handler = add.mock.calls.find(([type]) => type === 'keydown')?.[1];
    unmount();
    expect(handler).toBeTruthy();
    expect(remove.mock.calls.some(([type, fn]) => type === 'keydown' && fn === handler)).toBe(true);
    add.mockRestore();
    remove.mockRestore();
  });

  it('clicking a row opens it and moves the cursor; clicking a button inside does not', () => {
    const open = vi.fn();
    plain(open);
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('B'));
    expect(open).toHaveBeenCalledWith('b');
    expect(screen.getAllByRole('listitem')[1].getAttribute('aria-current')).toBe('true');
  });

  it('supports a controlled cursor and reports changes', () => {
    const onCursorChange = vi.fn();
    plain(vi.fn(), { cursorId: 'b', onCursorChange });
    expect(screen.getAllByRole('listitem')[1].getAttribute('aria-current')).toBe('true');
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(onCursorChange).toHaveBeenCalledWith('c');
  });

  it('can turn the shortcuts off', () => {
    plain(vi.fn(), { shortcuts: false });
    fireEvent.keyDown(document.body, { key: 'j' });
    expect(screen.getAllByRole('listitem')[0].getAttribute('aria-current')).toBeNull();
  });

  it('restates the clip on hover, cursor and flash, square corners, 16px row padding', () => {
    expect(listRowSurface).toContain('hover:bg-clip-padding');
    expect(listRowSurface).toContain('data-[current=true]:bg-clip-padding');
    expect(listRowSurface).toContain('data-[flash=true]:bg-clip-padding');
    render(<List><ListRow rowId="a" flash dimmed>x</ListRow></List>);
    const li = screen.getByRole('listitem');
    expect(li.className).toContain('py-row-y');
    expect(li.className).toContain('border-x-8');
    expect(li.className).toContain('motion-safe:animate-row-flash');
    expect(li.className).toContain('text-muted');
    expect(li.className).not.toContain('rounded');
  });

  it('stacks on the list container width, per breakpoint', () => {
    render(
      <List stackBelow={600}>
        <ListRow><ListCell kind="lead">L</ListCell><ListCell whenStacked="only">chips</ListCell><ListCell whenStacked="hide">cols</ListCell></ListRow>
      </List>,
    );
    expect(screen.getByRole('listitem').className).toContain('@max-[600px]/list:grid-cols-[minmax(0,1fr)_auto]');
    expect(screen.getByText('chips').className).toContain('hidden @max-[600px]/list:block');
    expect(screen.getByText('cols').className).toContain('@max-[600px]/list:hidden');
  });

  it('renders metrics as a subgrid', () => {
    render(<ListMetrics><ListMetric label="Orders" value="14" /></ListMetrics>);
    expect(screen.getByRole('listitem').className).toContain('grid-cols-subgrid');
    expect(screen.getByText('14').className).toContain('text-right');
  });
});
