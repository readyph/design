import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { RequestBody, RequestHeader, type DetailActions } from './RequestDetail';
import { RequestThread } from './RequestThread';
import { CustomerThread } from './CustomerThread';
import { getMech } from './sms/mechModel';
import { customerChatOf, itemsOf, jobOf, mechOf, seedRequests, threadPostsOf } from './sms/requestsModel';
import { manager } from './sms/data';
import { SCENARIO_JOB, seedTracker } from './sms/trackerModel';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const fn = () => vi.fn();
const acts = (): DetailActions => ({ onApprove: fn(), onReady: fn(), onDecline: fn(), onQuote: fn(), onDismiss: fn(), onAnswer: fn(), onCustomerAnswer: fn(), onOpenService: fn(), onBack: fn() });

describe('RequestDetail', () => {
  for (const customer of ['waiting', 'approved', 'declined'] as const) {
    seedRequests({ scenario: 'default', customer });
    const items = itemsOf(getMech());
    it(`every kind renders without axe violations (${customer})`, async () => {
      for (const item of items) {
        const { container, unmount } = render(<><RequestHeader item={item} job={jobOf(item.jobId)} a={acts()} /><RequestBody item={item} job={jobOf(item.jobId)} a={acts()} /></>);
        expect((await axe.run(container, axeOpts)).violations).toEqual([]);
        unmount();
      }
    });
  }
  it('part request: Approve fires; Ready is locked until approved', () => {
    seedRequests({ scenario: 'default', customer: 'waiting' });
    const item = itemsOf(getMech()).find((i) => i.kind === 'part' && i.part?.status === 'Requested')!;
    const a = acts();
    render(<RequestBody item={item} job={jobOf(item.jobId)} a={a} />);
    expect((screen.getByRole('button', { name: /Ready at stockroom/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Approve/ }));
    expect(a.onApprove).toHaveBeenCalled();
  });
  it('open service link calls onOpenService', () => {
    seedRequests({ scenario: 'default', customer: 'waiting' });
    const item = itemsOf(getMech()).find((i) => i.jobId)!;
    const a = acts();
    render(<RequestHeader item={item} job={jobOf(item.jobId)} a={a} />);
    fireEvent.click(screen.getByRole('link', { name: /Open service/ }));
    expect(a.onOpenService).toHaveBeenCalled();
  });
});

describe('RequestThread and CustomerThread', () => {
  it('RequestThread sends a quick reply and typed text, no axe violations', async () => {
    seedRequests({ scenario: 'default', customer: 'waiting' });
    const item = itemsOf(getMech()).find((i) => i.kind === 'question')!;
    const onSend = vi.fn();
    const { container } = render(<RequestThread posts={threadPostsOf(getMech(), jobOf(item.jobId))} hasService you={manager} mech={mechOf(item.mechId)} itemKey={item.id} onSend={onSend} />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick reply: Yes' }));
    expect(onSend).toHaveBeenCalledWith('Yes');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: ' Hello ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith('Hello');
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
  it('RequestThread without a service has no reply box', () => {
    render(<RequestThread posts={[]} hasService={false} you={manager} mech={mechOf('m-jun')} onSend={() => {}} />);
    expect(screen.queryByRole('textbox')).toBeNull();
  });
  it('CustomerThread sends and passes axe', async () => {
    seedTracker('in progress', 'conversation');
    const onSend = vi.fn();
    const { container } = render(<CustomerThread customer={{ id: 'c1', name: 'Ana Reyes', short: 'Ana', initials: 'AR' }} you={manager} posts={customerChatOf(getMech(), jobOf(SCENARIO_JOB['in progress'])!)} onSend={onSend} />);
    fireEvent.click(screen.getByRole('button', { name: 'Quick reply: Call the shop' }));
    expect(onSend).toHaveBeenCalledWith('Call the shop');
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
  });
});
