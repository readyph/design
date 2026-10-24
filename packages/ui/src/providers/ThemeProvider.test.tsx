import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from '../hooks/useTheme';
import { THEME_STORAGE_KEY, themeScript } from '../utils/themeScript';

type Listener = (e: { matches: boolean }) => void;

function mockMatchMedia(initialDark: boolean) {
  let matches = initialDark;
  const listeners = new Set<Listener>();
  window.matchMedia = vi.fn().mockImplementation(() => ({
    get matches() {
      return matches;
    },
    addEventListener: (_: string, l: Listener) => listeners.add(l),
    removeEventListener: (_: string, l: Listener) => listeners.delete(l),
  })) as unknown as typeof window.matchMedia;
  return (dark: boolean) => {
    matches = dark;
    listeners.forEach((l) => l({ matches: dark }));
  };
}

function Probe() {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <div>
      <span data-testid="pref">{preference}</span>
      <span data-testid="resolved">{resolved}</span>
      <button onClick={() => setPreference('dark')}>dark</button>
      <button onClick={() => setPreference('light')}>light</button>
    </div>
  );
}

const html = () => document.documentElement.getAttribute('data-theme');

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});
afterEach(() => vi.restoreAllMocks());

describe('ThemeProvider / useTheme', () => {
  it('persists the preference and updates data-theme', async () => {
    mockMatchMedia(false);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('pref')).toHaveTextContent('system');
    expect(html()).toBe('light');
    await userEvent.click(screen.getByRole('button', { name: 'dark' }));
    expect(screen.getByTestId('pref')).toHaveTextContent('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(html()).toBe('dark');
  });

  it('follows prefers-color-scheme live while on system', () => {
    const setSystemDark = mockMatchMedia(false);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(html()).toBe('light');
    act(() => setSystemDark(true));
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
    expect(html()).toBe('dark');
  });

  it('ignores OS changes when the preference is explicit', async () => {
    const setSystemDark = mockMatchMedia(false);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'light' }));
    act(() => setSystemDark(true));
    expect(html()).toBe('light');
  });

  it('falls back to system for missing or invalid stored values', () => {
    mockMatchMedia(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('pref')).toHaveTextContent('system');
    expect(html()).toBe('dark');
  });

  it('falls back to system when localStorage throws', async () => {
    mockMatchMedia(false);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('pref')).toHaveTextContent('system');
    await userEvent.click(screen.getByRole('button', { name: 'dark' }));
    expect(html()).toBe('dark');
  });

  it('throws outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/);
  });
});

describe('themeScript', () => {
  const run = () => new Function(themeScript)();

  it('uses the stored preference', () => {
    mockMatchMedia(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    run();
    expect(html()).toBe('dark');
  });

  it('uses the media query for system / missing / invalid values', () => {
    mockMatchMedia(true);
    run();
    expect(html()).toBe('dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, 'nope');
    document.documentElement.removeAttribute('data-theme');
    mockMatchMedia(false);
    run();
    expect(html()).toBe('light');
  });

  it('does not throw when storage throws', () => {
    mockMatchMedia(true);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(run).not.toThrow();
    expect(html()).toBe('dark');
  });
});
