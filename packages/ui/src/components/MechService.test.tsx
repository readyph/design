import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { useState } from 'react';
import { MechServiceBody, type ServiceDialog } from './MechService';
import { jobs, mechanics } from './sms/data';
import { feedOf, getMech } from './sms/mechModel';
import { MechFeed } from './MechFeed';
import { MechPartsSample } from './MechParts';

afterEach(cleanup);
const axeOpts = { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } };
const me = mechanics[0];
const noop = () => {};

function Screen({ status, open = null }: { status: (typeof jobs)[number]['status']; open?: ServiceDialog }) {
  const [dialog, setDialog] = useState<ServiceDialog>(open);
  return <MechServiceBody job={jobs.find((j) => j.status === status)!} s={getMech()} me={me} flash={noop} onNeedPart={noop} dialog={dialog} setDialog={setDialog} onSentDone={noop} />;
}

describe('MechService', () => {
  it('shows Start work for a not-started service and Mark done + Pause when working', () => {
    const a = render(<Screen status="TODO" />);
    expect(screen.getByRole('button', { name: 'Start work' })).toBeTruthy();
    a.unmount();
    render(<Screen status="IN_PROGRESS" />);
    expect(screen.getByRole('button', { name: 'Mark done' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });
  it('opens the pause reason and mark-done confirm', () => {
    render(<Screen status="IN_PROGRESS" />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByText('Why are you stopping?')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark done' }));
    expect(screen.getByText('Is this service finished?')).toBeTruthy();
  });
  it('has no axe violations (screen, pause dialog, parts, feed)', async () => {
    for (const ui of [<Screen status="IN_PROGRESS" />, <Screen status="IN_PROGRESS" open="pause" />, <Screen status="PENDING" />]) {
      const { container, unmount } = render(ui);
      expect((await axe.run(document.body, axeOpts)).violations).toEqual([]);
      void container; unmount();
    }
    const job = jobs.find((j) => j.status === 'IN_PROGRESS' && j.parts.length)!;
    const { unmount } = render(<><MechPartsSample job={job} s={getMech()} readOnly={false} onRequest={noop} /><MechFeed posts={feedOf(getMech(), job)} me={me} readOnly={false} onPost={noop} flash={noop} /></>);
    expect((await axe.run(document.body, axeOpts)).violations).toEqual([]);
    unmount();
  });
});
