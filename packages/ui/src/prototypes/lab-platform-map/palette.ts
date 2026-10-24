/**
 * PROTOTYPE (RDY-224) - town colours, read from the live `--ds-*` tokens at
 * render time (so the scene follows light/dark). No hex values: every colour is
 * a token or a mix of two tokens.
 */

export type RGB = [number, number, number];

/** Tokens this scene needs that the kit does not have yet. Shown with the nearest mix for now. */
export const MISSING_IN_KIT = [
  { token: 'scene.grass / grass-edge', now: 'mix(tint-green-bg, success); edge = mix(success, ink-dark)' },
  { token: 'scene.road / road-marking', now: 'neutral-400 (light) / neutral-300 (dark); marking = surface' },
  { token: 'scene.footpath', now: 'mix(grass, surface 55%) light / mix(grass, ink 22%) dark' },
  { token: 'scene.window-glow', now: 'mix(warning, surface 45%) - warm yellow, same in both themes' },
  { token: 'scene.window-off', now: 'darker of ink/canvas, mixed 20% toward neutral-500' },
  { token: 'scene.building-* (warehouse teal, shop peach, store gray, HQ blue)', now: 'tint-*-bg walls, tint-*-fg roofs, primary-600 HQ roof' },
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
  grass: RGB;
  grassEdge: RGB;
  grassShadow: RGB;
  footpath: RGB;
  road: RGB;
  roadMark: RGB;
  windowOn: RGB;
  windowOff: RGB;
  door: RGB;
  warehouseWall: RGB;
  warehouseRoof: RGB;
  shopWall: RGB;
  shopRoof: RGB;
  shopSign: RGB;
  storeWall: RGB;
  storeRoof: RGB;
  awning: RGB;
  awningAlt: RGB;
  hqWall: RGB;
  hqRoof: RGB;
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
  const success = v('success');
  const warning = v('warning');
  const grass = dark ? mix(v('tint-green-bg'), success, 0.25) : mix(v('tint-green-bg'), success, 0.32);
  const font = getComputedStyle(el).getPropertyValue('--ds-font-sans').trim() || 'sans-serif';
  return {
    dark,
    shade,
    grass,
    grassEdge: mix(grass, shade, dark ? 0.35 : 0.28),
    grassShadow: mix(grass, shade, 0.18),
    footpath: dark ? mix(grass, ink, 0.22) : mix(grass, surface, 0.55),
    road: dark ? v('neutral-300') : v('neutral-400'),
    roadMark: dark ? v('neutral-600') : surface,
    windowOn: mix(warning, dark ? ink : surface, 0.45),
    windowOff: mix(shade, v('neutral-500'), 0.2),
    door: dark ? v('neutral-400') : v('neutral-500'),
    warehouseWall: dark ? v('tint-teal-fg') : v('tint-teal-bg'),
    warehouseRoof: dark ? mix(v('tint-teal-fg'), shade, 0.45) : v('tint-teal-fg'),
    shopWall: dark ? v('tint-peach-fg') : v('tint-peach-bg'),
    shopRoof: dark ? mix(v('tint-peach-fg'), shade, 0.45) : v('tint-peach-fg'),
    shopSign: v('primary-500'),
    storeWall: dark ? v('neutral-700') : v('surface-muted'),
    storeRoof: dark ? v('neutral-400') : v('neutral-500'),
    awning: v('error'),
    awningAlt: dark ? ink : surface,
    hqWall: dark ? v('neutral-800') : surface,
    hqRoof: v('primary-600'),
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
