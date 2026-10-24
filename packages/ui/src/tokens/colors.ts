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
  /** Links carry the brand color. */
  link: '#1d4ed8',
  /**
   * Pastel status pills: background + readable foreground. Blue / green /
   * teal / gray round out the status set.
   */
  tint: {
    peach: { bg: '#fbe5de', fg: '#8f3d28' },
    green: { bg: '#e5f3e2', fg: '#2d6a27' },
    teal: { bg: '#ddf0f1', fg: '#1f6a73' },
    gray: { bg: '#efefef', fg: '#404040' },
  },
  /**
   * Scene colours for illustrated maps (the Lab town map): each token has a
   * light and a dark value, emitted as `--ds-scene-*`. Values are mixes of
   * existing palette families only (green tint/success, neutral, warning,
   * teal, peach, primary, error, surface). Dark `window-glow` is the plain
   * warning amber: the prototype's 45% mix is indistinguishable from the dark
   * shop wall.
   */
  scene: {
    'grass': { light: '#a3d9b1', dark: '#1b5d3a' },
    'grass-edge': { light: '#7ca386', dark: '#15402b' },
    'road': { light: '#a3a3a3', dark: '#373740' },
    'road-marking': { light: '#ffffff', dark: '#b4b4c0' },
    'footpath': { light: '#d6eedc', dark: '#4b7e63' },
    'window-glow': { light: '#eab476', dark: '#f0a33a' },
    'window-off': { light: '#292929', dark: '#26262c' },
    'warehouse-wall': { light: '#ddf0f1', dark: '#5eead4' },
    'warehouse-roof': { light: '#1f6a73', dark: '#38857b' },
    'shop-wall': { light: '#fbe5de', dark: '#f5be96' },
    'shop-roof': { light: '#8f3d28', dark: '#8b6d59' },
    'store-wall': { light: '#efefef', dark: '#cdcdd6' },
    'store-roof': { light: '#737373', dark: '#787884' },
    'hq-wall': { light: '#ffffff', dark: '#e4e4eb' },
    'hq-roof': { light: '#2563eb', dark: '#2563eb' },
    'awning': { light: '#dc2626', dark: '#f2615b' },
    'awning-stripe': { light: '#ffffff', dark: '#f3f3f6' },
  },
  /** Modal / drawer backdrop. */
  overlay: 'rgba(10, 10, 10, 0.4)',
} as const;

export type Colors = typeof colors;
