/**
 * Color palette — white base, blue primary.
 *
 * Source of truth for the CSS-variable theme and the Tailwind preset
 * (see `kbase/concept/06-Design-system.md` §4). White surfaces, near-black
 * ink text, blue as the single brand/action color.
 */
export const colors = {
  /** Blue — brand + action color. */
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // brand
    600: '#2563eb', // solid buttons / links
    700: '#1d4ed8', // hover / link text
    800: '#1e40af',
    900: '#1e3a8a',
  },
  /** Ink / gray. */
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#efefef',
    300: '#e5e5e5',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  semantic: {
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#2f5bd3',
  },
  /**
   * Semantic colors as text on tinted/neutral surfaces (4.5:1 on white,
   * canvas and the 10-15% tints). Use these for text; keep the base
   * semantic colors for fills, dots and borders.
   */
  semanticText: {
    success: '#166534',
    warning: '#92400e',
    error: '#b91c1c',
  },
  /** Surfaces (white base). */
  surface: {
    DEFAULT: '#ffffff',
    subtle: '#f7f7f7',
    muted: '#efefef',
    /** App backdrop behind the window. */
    canvas: '#ececed',
  },
  /** Text / ink. */
  ink: {
    DEFAULT: '#171717',
    muted: '#525252',
    subtle: '#6b6b6b',
  },
  /** Borders. */
  border: {
    DEFAULT: '#e5e5e5',
    strong: '#d4d4d4',
  },
  /**
   * Chrome (rail + sidebar): ink in both themes. A light chrome variant can
   * override these variables on a scope.
   */
  chrome: {
    DEFAULT: '#111114',
    fg: '#f3f3f6',
    muted: '#a0a0ac',
    hover: '#202026',
    active: '#2a2a32',
    border: '#26262e',
  },
  /** Links carry the brand color. */
  link: '#1d4ed8',
  /**
   * Status pills: background + readable foreground. Blue (primary tint) /
   * green / teal / gray make up the status set.
   */
  tint: {
    blue: { bg: '#eff6ff', fg: '#1d4ed8' },
    green: { bg: '#e5f3e2', fg: '#2d6a27' },
    teal: { bg: '#ddf0f1', fg: '#1f6a73' },
    gray: { bg: '#efefef', fg: '#404040' },
  },
  /** Modal / drawer backdrop. */
  overlay: 'rgba(10, 10, 10, 0.4)',
} as const;

export type Colors = typeof colors;
