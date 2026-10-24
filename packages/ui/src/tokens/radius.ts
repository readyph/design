/** Border-radius scale. */
export const radius = {
  none: '0',
  sm: '0.25rem',
  base: '0.375rem',
  md: '0.5rem',
  lg: '0.5rem',
  xl: '0.625rem',
  '2xl': '0.875rem',
  full: '9999px',
} as const;

/**
 * Semantic radius roles: controls 4, cards and panels 6, modals 8. Pills
 * (`full`) are only for avatars, status dots and count badges.
 */
export const radiusRole = {
  control: radius.sm,
  panel: radius.base,
  modal: radius.md,
} as const;

export type Radius = typeof radius;
