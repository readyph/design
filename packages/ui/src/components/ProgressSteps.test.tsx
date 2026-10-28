import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { ProgressSteps, SideSteps } from './ProgressSteps';

afterEach(cleanup);

const po = [
  { label: 'Drafted', note: 'By Berto', state: 'done' as const },
  { label: 'Sent', note: 'Not sent. Print it, then mark it sent.', state: 'now' as const },
  { label: 'Received', note: 'Expected Fri 23 Oct', state: 'next' as const },
];

describe('ProgressSteps', () => {
  it('marks only the current step', () => {
    render(<ProgressSteps steps={po} />);
    const items = screen.getAllByRole('listitem');
    expect(items[1].getAttribute('aria-current')).toBe('step');
    expect(items[0].getAttribute('aria-current')).toBeNull();
    expect(items[2].className).toContain('before:bg-rule');
  });
  it('flags a late note in red', () => {
    render(<ProgressSteps steps={[{ label: 'Received', note: '2 days late', state: 'now', flag: true }]} />);
    expect(screen.getByText('2 days late').className).toContain('text-bad');
  });
  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <ProgressSteps steps={po} />
        <SideSteps aria-label="Send this list" steps={[{ title: '1 · Check it', note: 'Change quantities.' }]} />
      </>,
    );
    const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(r.violations).toEqual([]);
  });
});

describe('SideSteps', () => {
  it('renders titles and notes', () => {
    render(<SideSteps steps={[{ title: '1 · Check it', note: 'Change quantities.' }, { title: '2 · Print it', note: 'Print.' }]} />);
    expect(screen.getByText('2 · Print it')).toBeTruthy();
  });
});
