import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LedaSidePanel } from './LedaSidePanel';
import { Chat } from './Chat';

function mockViewport(desktop: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: desktop,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const body = <Chat.Input aria-label="Message Leda" />;

beforeEach(() => {
  window.localStorage.clear();
  mockViewport(true);
});
afterEach(() => vi.restoreAllMocks());

describe('LedaSidePanel (desktop)', () => {
  it('renders a labelled complementary region with the context tag when open', () => {
    render(
      <LedaSidePanel open onOpenChange={() => {}} context="Home">
        {body}
      </LedaSidePanel>,
    );
    expect(screen.getByRole('complementary', { name: 'Leda panel' })).toBeInTheDocument();
    expect(screen.getByText('On this page')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collapse Leda' })).toBeInTheDocument();
  });

  it('renders only the Open Leda tab when closed and toggles via onOpenChange', async () => {
    const onOpenChange = vi.fn();
    render(
      <LedaSidePanel open={false} onOpenChange={onOpenChange} context="Home">
        {body}
      </LedaSidePanel>,
    );
    expect(screen.queryByRole('complementary', { name: 'Leda panel' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Message Leda')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open Leda' }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('collapses through the header button', async () => {
    const onOpenChange = vi.fn();
    render(
      <LedaSidePanel open onOpenChange={onOpenChange}>
        {body}
      </LedaSidePanel>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Leda' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('manages its own state when uncontrolled', async () => {
    render(<LedaSidePanel context="Home">{body}</LedaSidePanel>);
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Leda' }));
    expect(screen.getByRole('button', { name: 'Open Leda' })).toBeInTheDocument();
  });

  it('writes open/closed when persistKey is set', async () => {
    render(
      <LedaSidePanel persistKey="readyph.leda_panel" context="Home">
        {body}
      </LedaSidePanel>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Leda' }));
    expect(window.localStorage.getItem('readyph.leda_panel')).toBe('closed');
    await userEvent.click(screen.getByRole('button', { name: 'Open Leda' }));
    expect(window.localStorage.getItem('readyph.leda_panel')).toBe('open');
  });

  it('honours a stored value on mount (uncontrolled and controlled)', () => {
    window.localStorage.setItem('readyph.leda_panel', 'closed');
    const { unmount } = render(<LedaSidePanel persistKey="readyph.leda_panel">{body}</LedaSidePanel>);
    expect(screen.getByRole('button', { name: 'Open Leda' })).toBeInTheDocument();
    unmount();

    const onOpenChange = vi.fn();
    render(
      <LedaSidePanel open onOpenChange={onOpenChange} persistKey="readyph.leda_panel">
        {body}
      </LedaSidePanel>,
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not break when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<LedaSidePanel persistKey="readyph.leda_panel">{body}</LedaSidePanel>);
    expect(screen.getByRole('complementary', { name: 'Leda panel' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Collapse Leda' }));
    expect(screen.getByRole('button', { name: 'Open Leda' })).toBeInTheDocument();
  });

  it('renders custom header actions in place of New conversation', () => {
    render(
      <LedaSidePanel open headerActions={<button type="button">History</button>}>
        {body}
      </LedaSidePanel>,
    );
    expect(screen.getByRole('button', { name: 'History' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New conversation' })).not.toBeInTheDocument();
  });
});

describe('LedaSidePanel (below lg)', () => {
  beforeEach(() => mockViewport(false));

  it('renders no dialog when closed (no focus trap)', () => {
    render(<LedaSidePanel open={false}>{body}</LedaSidePanel>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a drawer, focuses the composer and closes on Escape', async () => {
    const onOpenChange = vi.fn();
    render(
      <LedaSidePanel open onOpenChange={onOpenChange} context="Home">
        {body}
      </LedaSidePanel>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close Leda' })).toBeInTheDocument();
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(screen.getByLabelText('Message Leda')).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('starts closed uncontrolled even when a desktop value was stored', () => {
    window.localStorage.setItem('readyph.leda_panel', 'open');
    render(<LedaSidePanel persistKey="readyph.leda_panel">{body}</LedaSidePanel>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
