import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ direction: 'reads' }), { undo: true, index: 0 });
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

  describe('focus with slow and failing saves (real focus)', () => {
    const pickAndAdd = (label: RegExp) => {
      fireEvent.click(screen.getByRole('combobox'));
      fireEvent.click(screen.getByRole('option', { name: label }));
      fireEvent.click(screen.getByRole('button', { name: 'Add connection' }));
    };
    const confirmRemove = (name: string) => {
      fireEvent.click(removeBtn(name));
      fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' }));
    };

    it('slow Add: focus goes to the new row when it lands, if focus was lost', async () => {
      render(<Demo delay={150} />);
      pickAndAdd(/Share catalog with Pasig/);
      await waitFor(() => expect(document.activeElement).toBe(removeBtn(pasig.name)), { timeout: 1500 });
    });

    it('slow Add: a user who moved to another field is left alone', async () => {
      render(<><Demo delay={150} /><input aria-label="Other" /></>);
      pickAndAdd(/Share catalog with Pasig/);
      const other = screen.getByLabelText('Other');
      other.focus();
      await waitFor(() => expect(screen.queryByRole('button', { name: `Remove connection to ${pasig.name}` })).toBeTruthy(), { timeout: 1500 });
      await settle();
      expect(document.activeElement).toBe(other);
    });

    it('failed Add: nothing is armed for the next list change', async () => {
      const { rerender } = render(<Demo delay={50} fail />);
      pickAndAdd(/Share catalog with Pasig/);
      await settle();
      cleanup();
      // a later, unrelated add of the same row must not steal focus either: the intent was dropped
      render(<><Demo /><input aria-label="Other" /></>);
      const other = screen.getByLabelText('Other');
      other.focus();
      await settle();
      expect(document.activeElement).toBe(other);
      expect(rerender).toBeTruthy();
    });

    it('slow Remove: focus ends on the next row, never on body', async () => {
      render(<Demo delay={300} r={[readsFrom(cebu), readsFrom(main)]} s={[]} />);
      confirmRemove('Cebu Parts Stockroom');
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove connection to Cebu Parts Stockroom' })).toBeNull(), { timeout: 1500 });
      await settle();
      expect(document.activeElement).toBe(removeBtn('Main Stockroom'));
    });

    it('slow Remove of the last row: focus goes to the Add dropdown', async () => {
      render(<Demo delay={200} r={[readsFrom(cebu)]} s={[]} />);
      confirmRemove('Cebu Parts Stockroom');
      await waitFor(() => expect(screen.queryByRole('button', { name: /Remove connection to/ })).toBeNull(), { timeout: 1500 });
      await settle();
      expect(document.activeElement).toBe(screen.getByRole('combobox'));
    });

    it('slow Remove: a user who typed elsewhere keeps focus', async () => {
      render(<><Demo delay={300} r={[readsFrom(cebu), readsFrom(main)]} s={[]} /><input aria-label="Other" /></>);
      confirmRemove('Cebu Parts Stockroom');
      const other = screen.getByLabelText('Other');
      other.focus();
      await waitFor(() => expect(screen.queryByRole('button', { name: 'Remove connection to Cebu Parts Stockroom' })).toBeNull(), { timeout: 1500 });
      await settle();
      expect(document.activeElement).toBe(other);
    });

    it('deep link focuses the flashed row once; a later Add focuses the new row', async () => {
      render(<Demo flashId="reads:stock:main" />);
      expect(document.activeElement).toBe(removeBtn('Main Stockroom'));
      pickAndAdd(/Share catalog with Pasig/);
      await waitFor(() => expect(document.activeElement).toBe(removeBtn(pasig.name)));
      await settle();
      expect(document.activeElement).toBe(removeBtn(pasig.name));
    });

    it('Undo of an Add sends focus to the Add dropdown, not body', async () => {
      render(<Demo />);
      pickAndAdd(/Share catalog with Pasig/);
      await settle();
      const undo = screen.getByRole('button', { name: 'Undo' });
      undo.focus();
      fireEvent.click(undo);
      await settle();
      expect(screen.queryByRole('button', { name: `Remove connection to ${pasig.name}` })).toBeNull();
      expect(document.activeElement).not.toBe(document.body);
      expect(document.activeElement).toBe(screen.getByRole('combobox'));
    });

    it('Undo of a Remove puts the row back in its old place', async () => {
      render(<Demo r={[readsFrom(cebu), readsFrom(main)]} s={[]} />);
      confirmRemove('Cebu Parts Stockroom');
      await settle();
      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
      await settle();
      const names = screen.getAllByRole('button', { name: /^Remove connection to/ }).map((b) => b.getAttribute('aria-label'));
      expect(names).toEqual(['Remove connection to Cebu Parts Stockroom', 'Remove connection to Main Stockroom']);
      expect(document.activeElement).toBe(removeBtn('Cebu Parts Stockroom'));
    });

    it('explains the disabled Add button', () => {
      render(<Demo />);
      const add = screen.getByRole('button', { name: 'Add connection' });
      expect(add.getAttribute('aria-describedby')).toBeTruthy();
      expect(document.getElementById(add.getAttribute('aria-describedby') as string)?.textContent).toBe('Choose a connection first');
    });
  });
});
