/**
 * Color palette — white base, tangerine-orange primary.
 *
 * Source of truth for the CSS-variable theme and the Tailwind preset
 * (see `kbase/concept/06-Design-system.md` §4). White surfaces, near-black
 * ink text, tangerine as the single brand/action color.
 */
export const colors = {
  /** Tangerine — brand + action color. */
  primary: {
    50: '#fff5ec',
    100: '#ffe8d2',
    200: '#ffcfa0',
    300: '#ffb26b',
    400: '#ff9640',
    500: '#f5841f', // brand
    600: '#e06d0c', // solid buttons / links
    700: '#b85309', // hover / link text
    800: '#933f0e',
    900: '#78350f',
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
    muted: '#6b6b6b',
    subtle: '#a3a3a3',
  },
  /** Borders. */
  border: {
    DEFAULT: '#e5e5e5',
    strong: '#d4d4d4',
  },
  /** Links carry the brand color. */
  link: '#e06d0c',
  /**
   * Pastel status pills: background + readable foreground. Peach reads as the
   * warm tangerine family; green / teal / gray round out the set.
   */
  tint: {
    peach: { bg: '#fbe5de', fg: '#8f3d28' },
    green: { bg: '#e5f3e2', fg: '#2d6a27' },
    teal: { bg: '#ddf0f1', fg: '#1f6a73' },
    gray: { bg: '#efefef', fg: '#404040' },
  },
  /** Modal / drawer backdrop. */
  overlay: 'rgba(10, 10, 10, 0.4)',
} as const;

export type Colors = typeof colors;
