export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/** localStorage key holding the theme preference (per browser, not synced to the account). */
export const THEME_STORAGE_KEY = 'readyph.theme';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** Resolve a preference to a concrete theme given the current OS setting. */
export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (preference === 'system') return systemDark ? 'dark' : 'light';
  return preference;
}

/**
 * Inline script for `<head>`: sets `data-theme` on `<html>` before first paint so
 * there is no flash of the wrong theme. Self-contained (runs before React/bundles)
 * and mirrors `resolveTheme`; storage or matchMedia failures fall back to `system`.
 */
export const themeScript = `(function(){try{var p=null;try{p=window.localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}if(p!=="light"&&p!=="dark")p="system";var t=p;if(p==="system"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

/** Props to spread on a `<script>` element: `<script {...themeScriptProps} />`. */
export const themeScriptProps = { dangerouslySetInnerHTML: { __html: themeScript } } as const;
