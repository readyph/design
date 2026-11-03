import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { TrackingLink } from './TrackingLink';
import { LiveTrackingLink } from './sms/LiveTrackingLink';
import { jobs } from './sms/data';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('TrackingLink', () => {
  it('shows the link, the QR modal and the regenerate confirm', async () => {
    const { container } = render(<LiveTrackingLink job={jobs[0]} />);
    const before = container.querySelector('[data-url]')!.textContent;
    expect(before).toMatch(/^https:\/\/track\.readyph\.example\/t\//);
    expect((await axe.run(container, axeOpts)).violations).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Show QR' }));
    expect(screen.getByText('Scan to follow your service')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await userEvent.click(screen.getByRole('button', { name: 'Regenerate link' }));
    await userEvent.click(screen.getByRole('button', { name: 'Make new link' }));
    expect(container.querySelector('[data-url]')!.textContent).not.toBe(before);
  });
  it('takes the url and callbacks as props and reports copy, SMS and regenerate', async () => {
    const onCopy = vi.fn(); const onSendSms = vi.fn(); const onRegenerate = vi.fn();
    render(<TrackingLink jobNumber="JO-0001" plate="ABC 123" customerName="Maria Santos" customerPhone="0917 000 0000" url="https://track.example/t/xyz" expiryDays={7}
      onCopy={onCopy} onSendSms={onSendSms} onRegenerate={onRegenerate} />);
    expect(screen.getByLabelText('Tracking link').textContent).toBe('https://track.example/t/xyz');
    expect(screen.getByText(/7 days after pick-up/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send by SMS' }));
    await userEvent.click(screen.getByRole('button', { name: 'Regenerate link' }));
    await userEvent.click(screen.getByRole('button', { name: 'Make new link' }));
    expect([onCopy.mock.calls.length, onSendSms.mock.calls.length, onRegenerate.mock.calls.length]).toEqual([1, 1, 1]);
  });
});
