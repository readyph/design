import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { useServiceFlow, type FlowHost } from './useServiceFlow';
import { jobs } from './sms/data';

const host = (over: Partial<FlowHost> = {}): FlowHost => ({ count: 0, items: [], find: (id) => jobs.find((j) => j.id === id), add: vi.fn(), patch: vi.fn(), remove: vi.fn(), ...over });

function Probe({ h }: { h: FlowHost }) {
  const f = useServiceFlow(h);
  return <><button onClick={() => f.openNew()}>open new</button><button onClick={() => f.viewQuote(jobs[0]!)}>open view</button><span data-testid="kind">{f.state?.kind ?? 'none'}</span>{f.node}</>;
}

describe('useServiceFlow', () => {
  afterEach(cleanup);
  it('opens the New service wizard and closes it', () => {
    render(<Probe h={host()} />);
    expect(screen.getByTestId('kind').textContent).toBe('none');
    fireEvent.click(screen.getByText('open new'));
    expect(screen.getByTestId('kind').textContent).toBe('new');
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
  it('opens a quotation for viewing', () => {
    render(<Probe h={host()} />);
    fireEvent.click(screen.getByText('open view'));
    expect(screen.getByTestId('kind').textContent).toBe('view');
  });
  it('starts from the host initial state', () => {
    render(<Probe h={host({ initial: { kind: 'new' } })} />);
    expect(screen.getByTestId('kind').textContent).toBe('new');
  });
});
