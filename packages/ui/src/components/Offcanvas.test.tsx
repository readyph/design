import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { Offcanvas } from './Offcanvas';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('Offcanvas', () => {
  it('renders nothing while closed', () => {
    render(<Offcanvas open={false} onClose={() => {}} label="Detail">x</Offcanvas>);
    expect(screen.queryByLabelText('Detail')).toBeNull();
  });
  it('is a named panel that takes focus on open', () => {
    render(<Offcanvas open onClose={() => {}} label="Detail">body</Offcanvas>);
    const a = screen.getByLabelText('Detail');
    expect(a.tagName).toBe('ASIDE');
    expect(document.activeElement).toBe(a);
  });
  it('closes on Escape and on the scrim click', async () => {
    const onClose = vi.fn();
    const { container } = render(<Offcanvas open onClose={onClose} label="Detail">body</Offcanvas>);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(container.querySelector('[data-offcanvas-scrim]')!);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it('full screen has no scrim', () => {
    const { container } = render(<Offcanvas open fullScreen onClose={() => {}} label="Detail">body</Offcanvas>);
    expect(container.querySelector('[data-offcanvas-scrim]')).toBeNull();
  });
  it('has no axe violations', async () => {
    const { container } = render(<Offcanvas open onClose={() => {}} label="Detail">body</Offcanvas>);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
