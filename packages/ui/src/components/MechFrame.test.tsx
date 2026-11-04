import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MechFrame, MechStatus } from './MechFrame';
import { MechMe } from './MechMe';
import { useDirtyGuard } from './DirtyGuard';
import { mechanics } from './sms/data';
import { getMech } from './sms/mechModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const me = mechanics[0];

function Guarded({ dirty, leave }: { dirty: boolean; leave: () => void }) {
  const { guard, node } = useDirtyGuard(dirty);
  return <><button onClick={() => guard(leave)}>go</button>{node}</>;
}

describe('MechFrame', () => {
  it('goes back through the crumb and opens Profile', () => {
    const back = vi.fn(); const prof = vi.fn();
    render(<MechFrame title="Job" me={me} onProfile={prof} crumbs={[{ label: 'Services', onClick: back }, { label: 'Job' }]}>x</MechFrame>);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Services' }));
    fireEvent.click(screen.getByRole('button', { name: /Profile/ }));
    expect(back).toHaveBeenCalledOnce(); expect(prof).toHaveBeenCalledOnce();
  });
  it('shows status as icon plus word', () => {
    render(<MechStatus word="Waiting for part" />);
    expect(screen.getByText('Waiting for part')).toBeTruthy();
  });
  it('has no axe violations', async () => {
    const { container } = render(<MechFrame title="Services" me={me} onProfile={() => {}} crumbs={[{ label: 'Services' }]}><MechMe me={me} s={getMech()} onSignOut={() => {}} offToday={false} /></MechFrame>);
    const r = await axe.run(container, axeOpts);
    expect(r.violations).toEqual([]);
  });
});

describe('DirtyGuard', () => {
  it('leaves at once when clean', () => {
    const leave = vi.fn(); render(<Guarded dirty={false} leave={leave} />);
    fireEvent.click(screen.getByText('go')); expect(leave).toHaveBeenCalledOnce();
  });
  it('asks first when edited', () => {
    const leave = vi.fn(); render(<Guarded dirty leave={leave} />);
    fireEvent.click(screen.getByText('go')); expect(leave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Discard changes')); expect(leave).toHaveBeenCalledOnce();
  });
});
