/**
 * PROTOTYPE (RDY-224) - town colours, read from the live `--ds-*` tokens at
 * render time (so the scene follows light/dark). No hex values: every colour is
 * a token or a mix of tokens, softened toward the surface (light) or canvas (dark)
 * for the pastel look.
 */

export type RGB = [number, number, number];

/** Tokens this scene needs that the kit does not have yet. Shown with the nearest mix for now. */
export const MISSING_IN_KIT = [
  { token: 'scene.sky-top / sky-bottom', now: 'info and success, softened 80% toward surface' },
  { token: 'scene.grass / tree / bush', now: 'tint-green-bg and success, mixed' },
  { token: 'scene.street / route / sidewalk', now: 'neutral-300 + primary-100; route = primary-300; sidewalk = tint-peach-bg' },
  { token: 'scene.building-pastel-* (yellow, pink, lavender, mint, sky)', now: 'warning, error, primary-200, success, info softened 55-70% toward surface' },
  { token: 'scene.window-glow / window-off', now: 'mix(warning, surface 45%); darker of ink/canvas mixed 20% toward neutral-500' },
] as const;

function readVar(el: Element, name: string): RGB {
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const parts = raw.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
  return parts.length >= 3 ? [parts[0], parts[1], parts[2]] : [128, 128, 128];
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;
}

export function css(c: RGB, alpha = 1): string {
  return alpha >= 1 ? `rgb(${c[0]}, ${c[1]}, ${c[2]})` : `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
}

function luminance(c: RGB): number {
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export interface TownPalette {
  dark: boolean;
  /** Theme-stable near-black (darker of ink / canvas) used for shading. */
  shade: RGB;
  /** Cool dark used to shade side faces (bluish, like the reference). */
  cool: RGB;
  /** Highlight used to lighten tops. */
  lite: RGB;
  skyTop: RGB;
  skyBottom: RGB;
  grass: RGB;
  grassSide: RGB;
  earth: RGB;
  sidewalk: RGB;
  street: RGB;
  route: RGB;
  routeMark: RGB;
  tree: RGB;
  treeLite: RGB;
  trunk: RGB;
  water: RGB;
  windowOn: RGB;
  windowOff: RGB;
  frame: RGB;
  door: RGB;
  steel: RGB;
  crate: RGB;
  warehouseWall: RGB;
  warehouseRoof: RGB;
  shopWall: RGB;
  shopRoof: RGB;
  shopSign: RGB;
  storeWall: RGB;
  storeRoof: RGB;
  awning: RGB;
  awningAlt: RGB;
  bag: RGB;
  houses: RGB[];
  lamp: Record<'ACTIVE' | 'DEGRADED' | 'OFFLINE', RGB>;
  badge: RGB;
  badgeText: RGB;
  signFill: RGB;
  signBorder: RGB;
  signText: RGB;
  focus: RGB;
  font: string;
}

export function readPalette(el: Element): TownPalette {
  const v = (n: string) => readVar(el, `--ds-${n}`);
  const ink = v('ink');
  const canvas = v('canvas');
  const surface = v('surface');
  const dark = luminance(canvas) < luminance(ink);
  const shade = dark ? canvas : ink;
  const base = dark ? mix(canvas, v('neutral-700'), 0.25) : surface;
  /** Pastel: a token softened toward the surface (light) or sunk toward the canvas (dark). */
  const pst = (c: RGB, amt: number) => mix(c, base, dark ? amt * 0.62 + 0.18 : amt);
  const success = v('success');
  const warning = v('warning');
  const grass = pst(mix(v('tint-green-bg'), success, 0.35), 0.18);
  const font = getComputedStyle(el).getPropertyValue('--ds-font-sans').trim() || 'sans-serif';
  return {
    dark,
    shade,
    cool: mix(shade, v('primary-700'), dark ? 0.2 : 0.55),
    lite: dark ? v('neutral-300') : surface,
    skyTop: pst(v('info'), 0.78),
    skyBottom: pst(success, 0.8),
    grass,
    grassSide: mix(grass, shade, dark ? 0.4 : 0.22),
    earth: pst(v('tint-peach-fg'), 0.55),
    sidewalk: pst(v('tint-peach-bg'), 0.2),
    street: pst(mix(v('neutral-400'), v('primary-200'), 0.35), 0.28),
    route: pst(v('primary-300'), 0.15),
    routeMark: pst(surface, 0),
    tree: pst(success, 0.5),
    treeLite: pst(success, 0.72),
    trunk: pst(v('tint-peach-fg'), 0.3),
    water: pst(v('info'), 0.55),
    windowOn: mix(warning, dark ? ink : surface, 0.45),
    windowOff: dark ? mix(shade, v('neutral-500'), 0.35) : pst(v('info'), 0.35),
    frame: pst(surface, 0),
    door: pst(v('primary-600'), 0.35),
    steel: pst(v('neutral-400'), 0.2),
    crate: pst(v('tint-peach-fg'), 0.4),
    warehouseWall: pst(warning, 0.6),
    warehouseRoof: pst(v('info'), 0.45),
    shopWall: pst(v('error'), 0.7),
    shopRoof: pst(v('primary-200'), 0.1),
    shopSign: pst(v('primary-500'), 0.2),
    storeWall: pst(v('primary-200'), 0.35),
    storeRoof: pst(v('neutral-400'), 0.35),
    awning: pst(success, 0.35),
    awningAlt: pst(surface, 0),
    bag: pst(v('tint-peach-fg'), 0.45),
    houses: [
      pst(v('primary-200'), 0.35),
      pst(success, 0.62),
      pst(v('tint-peach-fg'), 0.55),
      pst(v('info'), 0.65),
      pst(v('error'), 0.78),
    ],
    lamp: { ACTIVE: success, DEGRADED: warning, OFFLINE: v('ink-subtle') },
    badge: v('error'),
    badgeText: dark ? shade : surface,
    signFill: surface,
    signBorder: v('border-strong'),
    signText: ink,
    focus: v('focus'),
    font,
  };
}
