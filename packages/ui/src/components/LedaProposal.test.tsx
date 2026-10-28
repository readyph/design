import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import axe from 'axe-core';
import { LedaProposal, type LedaProposalProps } from './LedaProposal';

afterEach(cleanup);

const props: LedaProposalProps = {
  id: 'CMD-RL',
  title: 'Raise oil filter reorder level to 30',
  writes: ['Reorder level: 20 to 30'],
  notes: ['Nothing is ordered yet.'],
  cannot: "Leda can't change the supplier.",
  warning: 'Cannot be undone after 5 s.',
  lines: [{ label: 'Oil filter', detail: '2 x 120', value: '240' }, { label: 'Total', value: '240', total: true }],
};

describe('LedaProposal', () => {
  it('shows the top line, ID in mono, lines table and the writes list right above the actions', () => {
    const { container } = render(<LedaProposal {...props} />);
    const g = screen.getByRole('group', { name: props.title as string });
    expect(g.textContent).toContain("Leda's draft · waiting for you");
    expect(screen.getByText('CMD-RL').className).toContain('font-mono');
    expect(screen.getByRole('table', { name: 'Lines' })).toBeTruthy();
    expect(screen.getByRole('rowheader', { name: /Oil filter/ })).toBeTruthy();
    expect(screen.getByRole('list', { name: 'Confirm writes' }).textContent).toContain('Note: Nothing is ordered yet.');
    expect(g.textContent).toContain("Leda can't: Leda can't change");
    expect(g.textContent).toContain('Warning: Cannot be undone');
    const list = container.querySelector('ul')!;
    const actions = screen.getByRole('button', { name: 'Confirm' }).parentElement!;
    expect(list.compareDocumentPosition(actions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('uses a custom confirm label, heading and extra action', () => {
    render(<LedaProposal {...props} confirmLabel="Confirm rush PO" writesHeading="Confirm creates" extra={<button>Change it first</button>} />);
    expect(screen.getByRole('button', { name: 'Confirm rush PO' })).toBeTruthy();
    expect(screen.getByText('Confirm creates')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Change it first' })).toBeTruthy();
  });

  it('calls onConfirm once even on a double click, and Discard once', () => {
    const onConfirm = vi.fn();
    const onDiscard = vi.fn();
    render(<LedaProposal {...props} onConfirm={onConfirm} onDiscard={onDiscard} />);
    const b = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.click(b);
    fireEvent.click(b);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Discard draft' }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('allows a second write after the state returns to waiting', () => {
    const onConfirm = vi.fn();
    const { rerender } = render(<LedaProposal {...props} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    rerender(<LedaProposal {...props} state="writing" onConfirm={onConfirm} />);
    rerender(<LedaProposal {...props} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it('writing: busy, aria-disabled buttons that keep focus, clicks ignored, Aurora on', () => {
    const onConfirm = vi.fn();
    const onDiscard = vi.fn();
    const { container } = render(<LedaProposal {...props} state="writing" onConfirm={onConfirm} onDiscard={onDiscard} />);
    const g = screen.getByRole('group');
    expect(g.getAttribute('aria-busy')).toBe('true');
    expect(g.textContent).toContain('· writing');
    const b = screen.getByRole('button', { name: 'Writing…' }) as HTMLButtonElement;
    expect(b.disabled).toBe(false);
    expect(b.getAttribute('aria-disabled')).toBe('true');
    b.focus();
    fireEvent.click(b);
    fireEvent.click(screen.getByRole('button', { name: 'Discard draft' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(b);
    expect(container.querySelector('svg.ld-on.ld-aurora')).toBeTruthy();
  });

  it('keeps focus on Confirm when it goes to writing, then moves it to the result when done', () => {
    function Host() {
      const [s, setS] = useState<LedaProposalProps['state']>('waiting');
      return <LedaProposal {...props} state={s} after="Reorder level is now 30." doneAt="9:12 AM" onConfirm={() => setS('writing')} onDiscard={() => setS('discarded')} />;
    }
    const { rerender } = render(<Host />);
    const b = screen.getByRole('button', { name: 'Confirm' });
    b.focus();
    fireEvent.click(b);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Writing…' }));
    expect(document.activeElement).not.toBe(document.body);
    rerender(<LedaProposal {...props} state="done" after="Reorder level is now 30." doneAt="9:12 AM" />);
    expect(document.activeElement?.textContent).toContain('Reorder level is now 30.');
  });

  it('does not steal focus when the user moved elsewhere during a slow write, and announces instead', () => {
    function Host({ s }: { s: LedaProposalProps['state'] }) {
      return (
        <>
          <LedaProposal {...props} state={s} after="Reorder level is now 30." />
          <input aria-label="Other" />
        </>
      );
    }
    const { rerender } = render(<Host s="waiting" />);
    const b = screen.getByRole('button', { name: 'Confirm' });
    b.focus();
    fireEvent.click(b);
    rerender(<Host s="writing" />);
    const other = screen.getByLabelText('Other') as HTMLInputElement;
    other.focus();
    rerender(<Host s="done" />);
    expect(document.activeElement).toBe(other);
    expect(screen.getByRole('group').querySelector('[role=status]')!.textContent).toBe('Written. Reorder level is now 30.');
  });

  it('moves focus to the result when focus was lost (body) after the write', () => {
    const { rerender } = render(<LedaProposal {...props} />);
    const b = screen.getByRole('button', { name: 'Confirm' });
    b.focus();
    fireEvent.click(b);
    rerender(<LedaProposal {...props} state="writing" />);
    rerender(<LedaProposal {...props} state="done" after="All set." />);
    expect(document.activeElement?.textContent).toContain('All set.');
  });

  it('puts the total row in a tfoot', () => {
    const { container } = render(<LedaProposal {...props} />);
    expect(container.querySelector('tfoot')?.textContent).toContain('Total');
    expect(container.querySelector('tbody')?.textContent).not.toContain('Total');
  });

  it('Discard moves focus to the discarded line', () => {
    function Host() {
      const [s, setS] = useState<LedaProposalProps['state']>('waiting');
      return <LedaProposal {...props} state={s} onDiscard={() => setS('discarded')} />;
    }
    render(<Host />);
    const d = screen.getByRole('button', { name: 'Discard draft' });
    d.focus();
    fireEvent.click(d);
    expect(document.activeElement?.textContent).toContain('Draft discarded');
    // announced by focus, not again by the live region
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('does not announce on mount, announces writing and an external done once', () => {
    const { rerender } = render(<LedaProposal {...props} />);
    expect(screen.getByRole('status').textContent).toBe('');
    rerender(<LedaProposal {...props} state="writing" />);
    expect(screen.getByRole('status').textContent).toBe('Leda is writing.');
    rerender(<LedaProposal {...props} state="done" after="Reorder level is now 30." />);
    expect(screen.getByRole('status').textContent).toBe('Written. Reorder level is now 30.');
  });

  it('done and discarded show the result and drop the actions', () => {
    const { rerender } = render(<LedaProposal {...props} state="done" after="Reorder level is now 30." doneAt="9:12 AM" doneAction={<button>See it in Memory</button>} />);
    expect(screen.getByRole('group').textContent).toContain('· written');
    expect(screen.getByText(/Reorder level is now 30/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'See it in Memory' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
    rerender(<LedaProposal {...props} state="discarded" />);
    expect(screen.getAllByText('Draft discarded. Nothing was written.').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Discard draft' })).toBeNull();
  });

  it('on another page offers Open {page} to confirm instead of Confirm', () => {
    render(<LedaProposal {...props} openPage="Parts Stockroom" openHref="/parts" />);
    expect(screen.getByRole('link', { name: 'Open Parts Stockroom to confirm' }).getAttribute('href')).toBe('/parts');
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull();
  });

  it('wraps long text, keeps its box, forwards ref and className', () => {
    const ref = createRef<HTMLDivElement>();
    render(<LedaProposal ref={ref} {...props} className="mt-4 bg-surface p-0" />);
    expect(ref.current?.className).toContain('mt-4');
    expect(ref.current?.className).toContain('bg-raised');
    expect(ref.current?.className).not.toContain('bg-surface');
    expect(ref.current?.className).toContain('[overflow-wrap:anywhere]');
    expect(ref.current?.className).not.toMatch(/truncate|line-clamp/);
  });

  for (const state of ['waiting', 'writing', 'done', 'discarded'] as const) {
    it(`has no axe violations (${state})`, async () => {
      const { container } = render(<LedaProposal {...props} state={state} after="Done." />);
      const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
      expect(r.violations.map((v) => v.id)).toEqual([]);
    });
  }
});
