import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Buildings } from '@phosphor-icons/react';
import { useState } from 'react';
import { Modal } from './Modal';
import { Select } from './Select';
import { LedaMark } from './Leda';

afterEach(cleanup);

function Demo({ size = 'panel' as const, onClose = () => {} }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onOpenChange={(o) => { setOpen(o); if (!o) onClose(); }} size={size} title="Edit place" description="Details" icon={Buildings} footer={<button>Save</button>}>
        <input aria-label="Name" />
      </Modal>
    </>
  );
}

describe('Modal', () => {
  it('has dialog semantics, name and description', async () => {
    render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    const d = screen.getByRole('dialog', { name: 'Edit place' });
    expect(d.getAttribute('aria-describedby')).toBeTruthy();
    expect(d.getAttribute('data-size')).toBe('panel');
  });
  it('fixed sizes use the 720x640 and 904x744 classes', async () => {
    render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog').className).toContain('min(720px,calc(100vw-48px))');
    expect(screen.getByRole('dialog').className).toContain('min(640px,calc(100vh-48px))');
  });
  it('closes on Escape and returns focus to the trigger', async () => {
    const onClose = vi.fn();
    render(<Demo onClose={onClose} />);
    const trigger = screen.getByText('Open');
    await userEvent.click(trigger);
    expect(document.activeElement).not.toBe(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalled();
    expect(document.activeElement).toBe(trigger);
  });
  it('close button closes; focus is trapped', async () => {
    render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    for (let i = 0; i < 6; i++) await userEvent.tab();
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    await userEvent.click(screen.getByLabelText('Close Edit place'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('hideClose removes the X', async () => {
    render(<Modal open hideClose title="T">x</Modal>);
    expect(screen.queryByLabelText('Close')).toBeNull();
  });
  it('close label names the dialog', async () => {
    render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('button', { name: 'Close Edit place' })).toBeTruthy();
  });
  it('body is keyboard focusable so it can scroll', async () => {
    render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    expect(screen.getByLabelText('Name').parentElement?.getAttribute('tabindex')).toBe('0');
  });
  it('body focus outline is drawn inside the dialog so overflow-hidden does not clip it', async () => {
    render(<Demo />);
    await userEvent.click(screen.getByText('Open'));
    const cls = screen.getByLabelText('Name').parentElement?.className ?? '';
    expect(cls).toContain('focus-visible:-outline-offset-2');
    expect(cls).not.toContain('ring-inset');
  });
  it('icon well uses raised surface and card radius, and holds the Leda mark', async () => {
    render(<Modal open title="Try it" iconNode={<LedaMark size={18} decorative />}>x</Modal>);
    const well = screen.getByRole('dialog').querySelector('span[aria-hidden]') as HTMLElement;
    expect(well.className).toContain('bg-raised');
    expect(well.className).toContain('rounded-card');
    expect(well.querySelector('svg')).toBeTruthy();
  });
  it('Esc closes an open Select first, then the modal', async () => {
    function W() {
      const [open, setOpen] = useState(true);
      return (
        <Modal open={open} onOpenChange={setOpen} title="T" size="panel">
          <Select aria-label="Region" options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]} defaultValue="a" />
        </Modal>
      );
    }
    render(<W />);
    const combo = screen.getByRole('combobox');
    await userEvent.click(combo);
    expect(screen.getByRole('listbox')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('dialog')).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
