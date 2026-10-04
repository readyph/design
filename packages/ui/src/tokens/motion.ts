/**
 * Motion tokens. A single standard transition (~150ms ease) covers most
 * interactive state changes; all motion must respect `prefers-reduced-motion`
 * (handled in the theme stylesheet).
 */
export const motion = {
  duration: {
    fast: '100ms',
    base: '150ms',
    slow: '250ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    ease: 'ease',
  },
  /** Ready-to-use transition shorthand. */
  transition: {
    base: '150ms cubic-bezier(0.2, 0, 0, 1)',
  },
} as const;

export type Motion = typeof motion;
