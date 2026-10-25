import { forwardRef, useEffect, useState } from 'react';

export type PlatformLogoSize = 16 | 24 | 32;

export interface PlatformLogoProps {
  /** Platform name. Used for the alt text and to derive the monogram. */
  name: string;
  /** Uploaded logo URL (shown with object-fit cover). Falls back to the monogram when absent or failed. */
  src?: string;
  /** Position of the platform in platform order (1-based); picks the identity colour, cycling after 8. Ignored for HQ. */
  index?: number;
  /** HQ identity: slate tile with "HQ". */
  hq?: boolean;
  /** Override the generated initials (use `platformInitials` to keep a set collision-safe). */
  initials?: string;
  /** Tile size in px. */
  size?: PlatformLogoSize;
  className?: string;
}

const sizeClass: Record<PlatformLogoSize, string> = {
  16: 'h-4 w-4 text-[8px]',
  24: 'h-6 w-6 text-[10px]',
  32: 'h-8 w-8 text-[12px]',
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

const words = (name: string) => name.trim().split(/\s+/).filter(Boolean);

/** Candidate 2-letter codes for a name, best first: word initials, then first letters of the name. */
function candidates(name: string): string[] {
  const w = words(name);
  const letters = name.replace(/[^\p{L}\p{N}]/gu, '').toUpperCase();
  const out: string[] = [];
  if (w.length > 1) out.push((w[0][0] + w[1][0]).toUpperCase());
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

/** Platform identity tile: uploaded logo or generated monogram. Logo and name are the identity; never add coloured borders or stripes. */
export const PlatformLogo = forwardRef<HTMLSpanElement, PlatformLogoProps>(function PlatformLogo(
  { name, src, index = 1, hq = false, initials, size = 24, className },
  ref,
) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const showImage = !hq && !!src && !failed;
  const code = hq ? 'HQ' : (initials ?? platformInitials(name));
  const tone = hq ? 'bg-identity-hq' : identityClass[(((index - 1) % 8) + 8) % 8];

  return (
    <span
      ref={ref}
      role="img"
      aria-label={name}
      className={[
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-chip font-semibold leading-none',
        sizeClass[size],
        showImage ? 'bg-raised' : `${tone} text-identity-text`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showImage ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{code}</span>
      )}
    </span>
  );
});
