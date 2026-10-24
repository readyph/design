import { useState, type ReactNode } from 'react';
import { ThemeProvider } from '../../providers/ThemeProvider';
import { THEME_STORAGE_KEY, type ThemePreference } from '../../utils/themeScript';

/**
 * Prototype-only: writes a stored theme preference before mounting the real `ThemeProvider`,
 * so a story can open in light, dark or system exactly as a returning user would. Changing the
 * preference afterwards goes through `useTheme` and persists, like the app. Remount with a `key`
 * to re-seed.
 */
export function ThemeSeed({ preference, children }: { preference: ThemePreference; children: ReactNode }) {
  useState(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      /* storage blocked: the provider falls back to system */
    }
    return true;
  });
  return <ThemeProvider>{children}</ThemeProvider>;
}
