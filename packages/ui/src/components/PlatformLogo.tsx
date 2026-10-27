import { forwardRef, useEffect, useState } from 'react';
import { identity } from '../tokens/colors';
import { cn } from '../utils/cn';

export type PlatformLogoSize = 14 | 16 | 20 | 24 | 32;

export interface PlatformLogoProps {
  /** Platform name. Used for the alt text and to derive the monogram. */
  name: string;
  /** Uploaded logo URL (shown with object-fit cover). Falls back to the monogram when absent or failed. */
  src?: string;
  /** Position of the platform in platform order (1-based); picks the identity colour, cycling after 8. Ignored for HQ. */
  index?: number;
  /** Stored identity colour (§7.7): a palette hex (`identity_color`) or slot 1-8. Overrides `index`; unknown values fall back to `index`. */
  color?: string | number;
  /** Tile sits next to a visible name: hides it from screen readers (no role, aria-hidden). */
  decorative?: boolean;
  /** HQ identity: slate tile with "HQ". */
  hq?: boolean;
  /** Override the generated initials (use `platformInitials` to keep a set collision-safe). */
  initials?: string;
  /** Tile size in px (default 16). */
  size?: PlatformLogoSize;
  className?: string;
}

const sizeClass: Record<PlatformLogoSize, string> = {
  14: 'size-[14px] text-[7px]',
  16: 'size-4 text-[8px]',
  20: 'size-5 text-[10px]',
  24: 'size-6 text-[12px]',
  32: 'size-8 text-[16px]',
};

// Full class names so Tailwind can see them.
const identityClass = [
  'bg-identity-1',
  'bg-identity-2',
  'bg-identity-3',
  'bg-identity-4',
  'bg-identity-5',
  'bg-identity-6',
  'bg-identity-7',
  'bg-identity-8',
];

const STOP_WORDS = new Set(['of', 'the', 'and', '&', 'ng', 'at']);

const allWords = (name: string) => name.trim().split(/\s+/).filter(Boolean);
const words = (name: string) => {
  const w = allWords(name);
  const kept = w.filter((x) => !STOP_WORDS.has(x.toLowerCase()));
  return kept.length ? kept : w;
};

/** Candidate 2-letter codes for a name, best first: word initials, then first letters of the name. */
function candidates(name: string): string[] {
  const w = words(name);
  const first = w.join('').replace(/[^\p{L}\p{N}]/gu, '').toUpperCase();
  const letters = first || name.replace(/[^\p{L}\p{N}]/gu, '').toUpperCase();
  const out: string[] = [];
  if (w.length > 1) out.push((w[0].replace(/[^\p{L}\p{N}]/gu, '')[0] + w[1].replace(/[^\p{L}\p{N}]/gu, '')[0]).toUpperCase());
  if (letters.length > 1) out.push(letters.slice(0, 2));
  for (let i = 2; i < letters.length; i++) out.push(letters[0] + letters[i]);
  out.push((letters[0] ?? '?') + '?');
  return out;
}

/** Two-letter monogram for `name`, avoiding any code already in `taken`. */
export function platformInitials(name: string, taken: readonly string[] = []): string {
  const used = new Set(taken.map((t) => t.toUpperCase()));
  const list = candidates(name);
  return list.find((c) => !used.has(c)) ?? list[0];
}

/** Collision-safe monograms for a list of names, in order: a name keeps its code unless an earlier one took it. */
export function platformInitialsFor(names: readonly string[]): string[] {
  const taken: string[] = [];
  return names.map((n) => {
    const code = platformInitials(n, taken);
    taken.push(code);
    return code;
  });
}

const slotOf = (color: string | number | undefined): number | undefined => {
  if (color === undefined) return undefined;
  if (typeof color === 'number') return color >= 1 && color <= 8 ? color : undefined;
  const i = identity.findIndex((h) => h.toLowerCase() === color.trim().toLowerCase());
  return i >= 0 ? i + 1 : undefined;
};

/**
 * Next free identity colour (hex, store it as `identity_color`): the first palette colour not in `used`
 * (hex or slot 1-8). When all eight are taken it reuses the least-used one, lowest slot first.
 */
export function nextIdentityColor(used: ReadonlyArray<string | number | undefined | null> = []): string {
  const counts = new Array(8).fill(0);
  for (const u of used) {
    const s = slotOf(u ?? undefined);
    if (s) counts[s - 1]++;
  }
  const min = Math.min(...counts);
  return identity[counts.indexOf(min)];
}

/** Platform identity tile: uploaded logo or generated monogram. Logo and name are the identity; never add coloured borders or stripes. */
export const PlatformLogo = forwardRef<HTMLSpanElement, PlatformLogoProps>(function PlatformLogo(
  { name, src, index = 1, color, decorative = false, hq = false, initials, size = 16, className },
  ref,
) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const showImage = !hq && !!src && !failed;
  const code = hq ? 'HQ' : (initials ?? platformInitials(name));
  const tone = hq ? 'bg-identity-hq' : identityClass[(slotOf(color) ?? ((((index - 1) % 8) + 8) % 8) + 1) - 1];

  return (
    <span
      ref={ref}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name })}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-chip font-semibold leading-none',
        sizeClass[size],
        showImage ? 'bg-raised' : `${tone} text-identity-text`,
        className,
      )}
    >
      {showImage ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{code}</span>
      )}
    </span>
  );
});
