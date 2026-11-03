import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { TrackingLink } from './TrackingLink';
import { jobs } from './sms/data';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };

describe('TrackingLink', () => {
  it('shows the link, the QR modal and the regenerate confirm', async () => {
    const { container } = render(<TrackingLink job={jobs[0]} />);
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
});
