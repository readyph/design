// @vitest-environment jsdom
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { OnboardingStepper, type StepperStep } from './OnboardingStepper';

afterEach(cleanup);

const steps: StepperStep[] = [
  { id: 'a', label: 'General info', status: 'done', required: true },
  { id: 'b', label: 'System' },
  { id: 'c', label: 'Team', status: 'skipped' },
  { id: 'd', label: 'Connections', locked: true, reason: 'Add the platform first.' },
];

const setup = (over = {}) => {
  const p = { onStepChange: vi.fn(), onContinue: vi.fn(), onSkip: vi.fn(), onBack: vi.fn(), onFinishLater: vi.fn() };
  render(<OnboardingStepper steps={steps} current="b" {...p} {...over}><input aria-label="field" /></OnboardingStepper>);
  return p;
};

describe('OnboardingStepper', () => {
  it('renders an ordered list with aria-current on the open step', () => {
    setup();
    const list = screen.getByRole('list', { name: 'Setup steps' });
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('button', { name: /^System/ }).getAttribute('aria-current')).toBe('step');
    expect(screen.getByRole('button', { name: /^General info/ }).getAttribute('aria-current')).toBeNull();
  });

  it('states are in text, not colour alone', () => {
    setup();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('Skipped')).toBeTruthy();
    expect(screen.getByText('Locked')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
  });

  it('locked step is aria-disabled, described by its reason, and never changes step', async () => {
    const p = setup();
    const b = screen.getByRole('button', { name: /^Connections/ });
    expect(b.getAttribute('aria-disabled')).toBe('true');
    expect(b.getAttribute('aria-describedby')).toBeTruthy();
    expect(document.getElementById(b.getAttribute('aria-describedby')!)?.textContent).toBe('Add the platform first.');
    fireEvent.click(b);
    expect(p.onStepChange).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Add the platform first.'));
  });

  it('announces again on a repeated press of the same locked step', async () => {
    setup();
    const region = screen.getByRole('status');
    let changes = 0;
    new MutationObserver((m) => { changes += m.length; }).observe(region, { childList: true, characterData: true, subtree: true });
    const b = screen.getByRole('button', { name: /^Connections/ });
    fireEvent.click(b);
    await waitFor(() => expect(region.textContent).toContain('locked'));
    const first = changes;
    fireEvent.click(b);
    await waitFor(() => expect(changes).toBeGreaterThan(first + 1));
    await waitFor(() => expect(region.textContent).toContain('locked'));
  });

  it('opens another step, but not the current one', () => {
    const p = setup();
    fireEvent.click(screen.getByRole('button', { name: /^Team/ }));
    expect(p.onStepChange).toHaveBeenCalledWith('c');
    fireEvent.click(screen.getByRole('button', { name: /^System/ }));
    expect(p.onStepChange).toHaveBeenCalledTimes(1);
  });

  it('shows progress as done of total', () => {
    setup();
    expect(screen.getByText('1 of 4 steps done, 1 skipped')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  });

  it('footer: Back, Skip, Finish later, Continue call their handlers', () => {
    const p = setup({ continueLabel: 'Save and continue' });
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    fireEvent.click(screen.getByRole('button', { name: 'Skip for now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish later' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
    expect(p.onBack).toHaveBeenCalled();
    expect(p.onSkip).toHaveBeenCalled();
    expect(p.onFinishLater).toHaveBeenCalled();
    expect(p.onContinue).toHaveBeenCalled();
  });

  it('first step has no Back; a required step has no Skip', () => {
    setup({ current: 'a' });
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Skip for now' })).toBeNull();
  });

  it('busy marks the footer aria-disabled and keeps buttons focusable; clicks do nothing', () => {
    const onContinue = vi.fn();
    setup({ busy: true, continueLoading: true, onContinue });
    for (const n of ['Back', 'Skip for now', 'Finish later', /Save and continue/]) {
      const b = screen.getByRole('button', { name: n }) as HTMLButtonElement;
      expect(b.disabled).toBe(false);
      expect(b.getAttribute('aria-disabled')).toBe('true');
    }
    const c = screen.getByRole('button', { name: /Save and continue/ });
    expect(c.getAttribute('aria-busy')).toBe('true');
    c.focus();
    fireEvent.click(c);
    expect(onContinue).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(c);
  });

  it('moves focus to the heading when the step changes, not on first render', () => {
    const { rerender } = render(<OnboardingStepper steps={steps} current="a" onStepChange={() => {}} />);
    expect(document.activeElement).toBe(document.body);
    rerender(<OnboardingStepper steps={steps} current="b" onStepChange={() => {}} />);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'System' }));
  });

  it('live region starts empty and speaks only progress changes', async () => {
    const { rerender } = render(<OnboardingStepper steps={steps} current="b" onStepChange={() => {}} />);
    expect(screen.getByRole('status').textContent).toBe('');
    rerender(<OnboardingStepper steps={steps.map((s) => (s.id === 'b' ? { ...s, status: 'done' as const } : s))} current="c" onStepChange={() => {}} />);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('2 of 4 steps done.'));
  });

  it('works controlled and never touches the URL', () => {
    const before = window.location.href;
    function C() {
      const [cur, setCur] = useState('a');
      return <OnboardingStepper steps={steps} current={cur} onStepChange={setCur} />;
    }
    render(<C />);
    act(() => { fireEvent.click(screen.getByRole('button', { name: /^System/ })); });
    expect(screen.getByRole('button', { name: /^System/ }).getAttribute('aria-current')).toBe('step');
    expect(window.location.href).toBe(before);
  });

  it('caller className lands on the outer box without replacing the layout', () => {
    const { container } = render(<OnboardingStepper steps={steps} current="b" onStepChange={() => {}} className="mt-4 w-40 grid-cols-3" />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain('mt-4');
    expect(outer.className).toContain('w-full');
    expect(outer.className).not.toContain('w-40');
    expect((outer.firstElementChild as HTMLElement).className).not.toContain('grid-cols-3');
  });

  describe('focus after a step change (focusIfLost)', () => {
    const Harness = ({ delay = 0 }: { delay?: number }) => {
      const [cur, setCur] = useState('b');
      const [busy, setBusy] = useState(false);
      return (
        <div>
          <button type="button">Cancel</button>
          <OnboardingStepper
            steps={steps}
            current={cur}
            onStepChange={setCur}
            busy={busy}
            continueLoading={busy}
            onContinue={() => { setBusy(true); setTimeout(() => { setBusy(false); setCur('c'); }, delay); }}
          >
            <input aria-label="Name" />
          </OnboardingStepper>
        </div>
      );
    };
    const heading = (n: string) => screen.getByRole('heading', { name: n });

    it('Continue pressed and nothing else changed: focus goes to the new heading', async () => {
      render(<Harness delay={30} />);
      const btn = screen.getByRole('button', { name: 'Save and continue' });
      btn.focus();
      fireEvent.click(btn);
      await waitFor(() => expect(document.activeElement).toBe(heading('Team')));
    });

    it('the pressed Continue keeps focus while saving', () => {
      render(<Harness delay={50} />);
      const btn = screen.getByRole('button', { name: 'Save and continue' });
      btn.focus();
      fireEvent.click(btn);
      expect(document.activeElement).toBe(btn);
      expect(btn.getAttribute('aria-busy')).toBe('true');
    });

    it('does not steal focus from the form input the user is typing in during the save', async () => {
      render(<Harness delay={30} />);
      fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
      const input = screen.getByLabelText('Name');
      input.focus();
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Team' })).toBeTruthy());
      expect(document.activeElement).toBe(input);
    });

    it('does not steal focus from a control outside the stepper (sheet bar Cancel)', async () => {
      render(<Harness delay={30} />);
      fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }));
      const cancel = screen.getByRole('button', { name: 'Cancel' });
      cancel.focus();
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Team' })).toBeTruthy());
      expect(document.activeElement).toBe(cancel);
    });

    it('moves focus when the user chose the step from the list', () => {
      render(<Harness />);
      const t = screen.getByRole('button', { name: /^Team/ });
      t.focus();
      fireEvent.click(t);
      expect(document.activeElement).toBe(heading('Team'));
    });

    it('a locked step press changes nothing and leaves focus on it', () => {
      render(<Harness />);
      const l = screen.getByRole('button', { name: /^Connections/ });
      l.focus();
      fireEvent.click(l);
      expect(document.activeElement).toBe(l);
      expect(heading('System')).toBeTruthy();
    });
  });
});
