import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { type, radius, spacing } from '../tokens/scale';

/**
 * Merge class names so a consumer's `className` wins over the package's utilities.
 *
 * twMerge's default config treats unknown `text-*` values (text-ui, text-small, ...) as
 * colours, so it drops them when a text-colour class sits beside them. We register our
 * custom type steps as font sizes, and our spacing/radius keys, derived from the tokens.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: Object.keys(spacing),
      borderRadius: Object.keys(radius),
    },
    classGroups: {
      'font-size': [{ text: Object.keys(type) }],
      // Preset width keys (leda-w, leda-w-overview) are widths and max-widths, not colours or spacing.
      w: [{ w: ['leda-w', 'leda-w-overview', 'rail', 'place', 'leda-w-overview'] }],
      'max-w': [{ 'max-w': ['leda-w-overview'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** The single focus-visible treatment shared by interactive components. */
export const focusRing =
  'outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface';
