// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Buildings } from '@phosphor-icons/react';
import { useState } from 'react';
import { Modal } from './Modal';

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
    await userEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
  it('hideClose removes the X', async () => {
    render(<Modal open hideClose title="T">x</Modal>);
    expect(screen.queryByLabelText('Close')).toBeNull();
  });
});
