import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

afterEach(cleanup);

function Demo(props: Partial<ConfirmDialogProps>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <ConfirmDialog
        title="Delete this topic?"
        description="This cannot be undone."
        name="Opening hours"
        context="Custom topic"
        tone="danger"
        confirmLabel="Delete"
        {...props}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

describe('ConfirmDialog', () => {
  it('is an alertdialog named by the title and described by the consequence line', async () => {
    render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    const d = screen.getByRole('alertdialog', { name: 'Delete this topic?' });
    expect(d.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(d.getAttribute('aria-describedby')!)?.textContent).toBe('This cannot be undone.');
    expect(d.className).toContain('min(420px,calc(100vw-32px))');
    expect(d.className).not.toContain('max-sm:inset-0');
  });
  it('starts focus on Cancel', async () => {
    render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });
  it('Esc cancels, calls onCancel and returns focus to the opener', async () => {
    const onCancel = vi.fn();
    render(<Demo onCancel={onCancel} />);
    const opener = screen.getByText('Open');
    await userEvent.click(opener);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });
  it('Cancel button cancels and returns focus', async () => {
    const onCancel = vi.fn();
    render(<Demo onCancel={onCancel} />);
    const opener = screen.getByText('Open');
    await userEvent.click(opener);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(opener);
  });
  it('backdrop click cancels', async () => {
    const onCancel = vi.fn();
    render(<Demo onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Open'));
    const overlay = document.querySelector('.bg-scrim') as HTMLElement;
    await userEvent.pointer([{ target: overlay, keys: '[MouseLeft]' }]);
    expect(onCancel).toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
  it('confirm calls onConfirm and does not call onCancel', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<Demo onConfirm={onConfirm} onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
  it('ignores Esc while loading', async () => {
    const onCancel = vi.fn();
    render(<Demo loading onCancel={onCancel} />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('shows name and context, and wraps long names', async () => {
    const long = 'A'.repeat(120);
    render(<Demo name={long} />);
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByText(long).className).toContain('overflow-wrap:anywhere');
    expect(screen.getByText('Custom topic')).toBeTruthy();
  });
  it('buttons use the 44px phone action-bar height', async () => {
    render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('button', { name: 'Cancel' }).className).toContain('var(--ctl-touch)');
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('var(--ctl-touch)');
  });
  it('returns focus to the opener by default, and onCloseAutoFocus can take that over with preventDefault', async () => {
    const { unmount } = render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(document.activeElement).toBe(screen.getByText('Open')));
    unmount();
    const seen = vi.fn((e: Event) => e.preventDefault());
    render(<Demo onCloseAutoFocus={seen} />);
    await userEvent.click(screen.getByText('Open'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await vi.waitFor(() => expect(seen).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    expect(document.activeElement).not.toBe(screen.getByText('Open'));
  });
});
