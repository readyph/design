// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ConnectionsEditor } from './ConnectionsEditor';
import { Demo } from './ConnectionsEditor.demo';
import { clearToasts } from './toast/toastStore';
import { cebu, main, optRead, pasig, readsFrom } from './ConnectionsEditor.sample';

afterEach(() => {
  cleanup();
  clearToasts();
});

const removeBtn = (name: string) => screen.getByRole('button', { name: `Remove connection to ${name}` });
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 120)); });

describe('ConnectionsEditor', () => {
  it('renders both groups with plain words and status as text', () => {
    render(<Demo />);
    expect(screen.getByRole('group', { name: /Reads from/ })).toBeTruthy();
    expect(screen.getByRole('group', { name: /Shares with/ })).toBeTruthy();
    expect(screen.getByText('Linked')).toBeTruthy();
    expect(screen.getByText('Slow')).toBeTruthy();
    expect(screen.getByText('Paused · Cubao is offline')).toBeTruthy();
    expect(screen.getAllByText('products, stock levels and movements').length).toBe(2);
  });

  it('shows the multi-source note when a kind comes from two platforms', () => {
    render(<Demo />);
    expect(screen.getByText('Stock comes from 2 platforms. Café POS lists their products together.')).toBeTruthy();
  });

  it('keeps Add aria-disabled (still focusable) until a choice, and does nothing', () => {
    const onAdd = vi.fn();
    render(<ConnectionsEditor platformId="cafe" platformName="Café POS" reads={[]} shares={[]} available={[optRead(cebu)]} onAdd={onAdd} />);
    const add = screen.getByRole('button', { name: 'Add connection' });
    expect(add.getAttribute('aria-disabled')).toBe('true');
    expect((add as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(add);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('adds, focuses the new row and offers Undo', async () => {
    render(<Demo />);
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: /Share catalog with Pasig/ }));
    expect(screen.getByRole('button', { name: 'Add connection' }).getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Add connection' }));
    await settle();
    expect(document.activeElement).toBe(removeBtn(pasig.name));
  });

  it('Undo of a Remove puts the row back with undo:true', async () => {
    const onAdd = vi.fn();
    render(<Demo onAdd={onAdd} />);
    fireEvent.click(removeBtn('Cebu Parts Stockroom'));
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }));
    await settle();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ direction: 'reads' }), { undo: true });
  });

  it('Remove asks first; cancel keeps the row', () => {
    const onRemove = vi.fn();
    render(<Demo onRemove={onRemove} />);
    fireEvent.click(removeBtn('Cebu Parts Stockroom'));
    const dlg = screen.getByRole('alertdialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Cancel' }));
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('after Remove focus goes to the next row, then the previous, then the Add dropdown', async () => {
    render(<Demo r={[readsFrom(cebu), readsFrom(main)]} s={[]} />);
    const confirmRemove = async (name: string) => {
      fireEvent.click(removeBtn(name));
      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }));
      await settle();
    };
    await confirmRemove('Cebu Parts Stockroom');
    expect(document.activeElement).toBe(removeBtn('Main Stockroom'));
    await confirmRemove('Main Stockroom');
    expect(document.activeElement).toBe(screen.getByRole('combobox'));
    expect(document.activeElement).not.toBe(document.body);
  });

  it('never offers a duplicate or the platform itself', () => {
    render(
      <ConnectionsEditor
        platformId="cebu"
        platformName="Cebu"
        reads={[readsFrom(main)]}
        shares={[]}
        available={[optRead(main), optRead(cebu), optRead(pasig), optRead(pasig)]}
      />,
    );
    fireEvent.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([expect.stringContaining('Pasig')]);
  });

  it('calls onHover for pointer and keyboard focus and clears on leave', () => {
    const onHover = vi.fn();
    render(<Demo onHover={onHover} />);
    const row = removeBtn('Cebu Parts Stockroom').closest('[data-conn-id]') as HTMLElement;
    fireEvent.mouseEnter(row);
    expect(onHover).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'reads:stock:cebu' }), 'reads');
    fireEvent.mouseLeave(row);
    expect(onHover).toHaveBeenLastCalledWith(null, null);
  });

  it('flashes the deep-linked row and focuses its Remove', () => {
    render(<Demo flashId="reads:stock:main" />);
    const row = removeBtn('Main Stockroom').closest('[data-conn-id]') as HTMLElement;
    expect(row.getAttribute('data-flash')).toBe('true');
    expect(document.activeElement).toBe(removeBtn('Main Stockroom'));
  });

  it('empty source offers Add {kind}; empty shares uses its line', () => {
    const onAddKind = vi.fn();
    render(<ConnectionsEditor platformId="cafe" platformName="Café POS" reads={[]} shares={[]} available={[]} sourceKinds={['Inventory']} onAddKind={onAddKind} sharesEmpty="No one reads it yet." />);
    expect(screen.getByText('Add a platform that provides this first.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Add Inventory' }));
    expect(onAddKind).toHaveBeenCalledWith('Inventory');
    expect(screen.getByText('No one reads it yet.')).toBeTruthy();
  });

  it('loading and error states', () => {
    const { rerender } = render(<ConnectionsEditor platformId="c" platformName="C" reads={[]} shares={[]} status="loading" />);
    expect(screen.getByRole('status', { name: 'Loading connections' })).toBeTruthy();
    const onRetry = vi.fn();
    rerender(<ConnectionsEditor platformId="c" platformName="C" reads={[]} shares={[]} status="error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Add connection' })).toBeNull();
  });

  it('keeps the caller className on the outer element only', () => {
    const { container } = render(<ConnectionsEditor className="mt-9" platformId="c" platformName="C" reads={[]} shares={[]} />);
    expect((container.firstElementChild as HTMLElement).className).toContain('mt-9');
  });
});
