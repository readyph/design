import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { MechFrame, MechStatus } from './MechFrame';
import { MechMe } from './MechMe';
import { useDirtyGuard } from './DirtyGuard';
import { mechanics } from './sms/data';
import { branch } from './sms/data';

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
    render(<MechFrame title="Job" me={me} business={branch.business} branchName={branch.name} onProfile={prof} crumbs={[{ label: 'Services', onClick: back }, { label: 'Job' }]}>x</MechFrame>);
    fireEvent.click(screen.getByRole('button', { name: 'Back to Services' }));
    fireEvent.click(screen.getByRole('button', { name: /Profile/ }));
    expect(back).toHaveBeenCalledOnce(); expect(prof).toHaveBeenCalledOnce();
  });
  it('shows the host business and the signed-in user, not the studio shop', () => {
    render(<MechFrame title="Services" me={{ name: 'Jun Reyes' }} business="Reyes Motor Works" onProfile={() => {}} crumbs={[{ label: 'Services' }]}>x</MechFrame>);
    expect(screen.getByText('Reyes Motor Works')).toBeTruthy();
    expect(screen.queryByText(branch.business)).toBeNull();
    expect(screen.queryByText(branch.name)).toBeNull();
    expect(screen.getByTitle('Jun Reyes')).toBeTruthy();
  });
  it('MechMe is props-driven', () => {
    const onPref = vi.fn(); const out = vi.fn();
    render(<MechMe name="Jun Reyes" subtitle="Bay 9" prefs={[{ id: 'p1', label: 'Tell me X', checked: false }]} onPref={onPref} hoursText="Today 8 to 5." onSignOut={out} />);
    expect(screen.getByText('Bay 9')).toBeTruthy(); expect(screen.getByText(/Today 8 to 5\./)).toBeTruthy();
    fireEvent.click(screen.getByRole('switch', { name: 'Tell me X' }));
    expect(onPref).toHaveBeenCalledWith('p1', true);
    fireEvent.click(screen.getByRole('button', { name: 'Log out' })); expect(out).toHaveBeenCalledOnce();
  });
  it('shows status as icon plus word', () => {
    render(<MechStatus word="Waiting for part" />);
    expect(screen.getByText('Waiting for part')).toBeTruthy();
  });
  it('has no axe violations', async () => {
    const { container } = render(<MechFrame title="Services" me={me} business={branch.business} branchName={branch.name} onProfile={() => {}} crumbs={[{ label: 'Services' }]}><MechMe name={me.name} prefs={[{ id: 'a', label: 'Tell me A', checked: true }]} onPref={() => {}} hoursText="Today you are off." onSignOut={() => {}} /></MechFrame>);
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
