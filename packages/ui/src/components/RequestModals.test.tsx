import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { DeclineModal, DismissModal, QuoteModal } from './RequestModals';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('RequestModals', () => {
  it('decline needs a reason and Other needs words', async () => {
    const onConfirm = vi.fn();
    render(<DeclineModal open partName="Pads" onClose={() => {}} onConfirm={onConfirm} />);
    const go = screen.getByRole('button', { name: 'Decline request' });
    expect((go as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(screen.getByRole('radio', { name: 'Other' }));
    expect((go as HTMLButtonElement).disabled).toBe(true);
    await userEvent.type(screen.getByRole('textbox'), 'Why not');
    await userEvent.click(go);
    expect(onConfirm).toHaveBeenCalledWith('Other', 'Why not');
  });
  it('dismiss sends the optional reason', async () => {
    const onConfirm = vi.fn();
    render(<DismissModal open onClose={() => {}} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss problem' }));
    expect(onConfirm).toHaveBeenCalledWith('');
  });
  it('quote total follows labour and sends', async () => {
    const onSend = vi.fn();
    render(<QuoteModal open problem="Worn pads" customerAfter="waiting" onClose={() => {}} onSend={onSend} />);
    await userEvent.type(screen.getByLabelText(/Labour/), '500');
    await userEvent.click(screen.getByRole('button', { name: 'Send to customer' }));
    expect(onSend).toHaveBeenCalledWith({ amount: 500, note: 'Worn pads', customer: 'waiting', parts: [] });
  });
  it('has no axe violations (all three)', async () => {
    const els = [
      <QuoteModal key="q" open problem="Worn pads" customerAfter="waiting" onClose={() => {}} onSend={() => {}} />,
      <DeclineModal key="d" open partName="Pads" onClose={() => {}} onConfirm={() => {}} />,
      <DismissModal key="x" open onClose={() => {}} onConfirm={() => {}} />,
    ];
    for (const el of els) { render(el); expect((await axe.run(document.body, axeOpts)).violations).toEqual([]); cleanup(); }
  });
});
