import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '../providers/ThemeProvider';

/** Theme preference (`system` | `light` | `dark`), the resolved theme and a persisting setter. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
