/**
 * PROTOTYPE (RDY-224) - Lab platform map colours.
 *
 * The scene is drawn in light-mode colours and remapped for dark mode on the way into the
 * DOM (`themed`). Primary scale, ink and surface equal the `--ds-*` tokens' light values
 * (verified by palette.test.ts against styles/theme.css); labels and page chrome read the
 * live tokens instead. Everything with no token is listed in MISSING_IN_KIT.
 */

/** Primary scale: equals --ds-primary-50 ... --ds-primary-900 (light). */
export const P50 = '#EFF6FF', P100 = '#DBEAFE', P200 = '#BFDBFE', P300 = '#93C5FD', P400 = '#60A5FA',
  P500 = '#3B82F6', P600 = '#2563EB', P700 = '#1D4ED8', P800 = '#1E40AF', P900 = '#1E3A8A';
/** Equals --ds-ink and --ds-ink-muted (light). */
export const INK = '#171717', INK_M = '#525252';
/** No token yet (see MISSING_IN_KIT). */
export const AMBER = '#D97706', PEACH_BG = '#FBE5DE', TEAL = '#1F6A73';
export const LIT = '#FFD66B', LIT_SOFT = '#FFE7A3';
export const LINK_COLORS = ['#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4'];

/** Tokens and colours the scene needs that the kit does not have yet, for Leonardo and RDY-229. */
export const MISSING_IN_KIT = [
  { token: 'scene.lamp / lamp-soft (warm window and street light)', now: '#FFD66B and #FFE7A3; the old scene-window-glow is a muted mix and does not read as light' },
  { token: 'scene.amber (door trim, awning stripe, forklift)', now: '#D97706 (close to --ds-warning-fg)' },
  { token: 'scene.peach-bg (shop door, awning panels)', now: '#FBE5DE (= --ds-tint-peach-bg)' },
  { token: 'scene.teal (clinic accent, parked car)', now: '#1F6A73 (= --ds-tint-teal-fg)' },
  { token: 'scene.clay-* (white wall, concrete yard, grey roof unit; each as top / left / right)', now: 'hand-picked blues derived from primary, see WHITE, CONCRETE, GREY in palette.ts' },
  { token: 'scene.island-top / island-left / island-right', now: '#FFFFFD, #C9DCF7, #A9C6F0' },
  { token: 'scene.link-1 ... link-6 (connection colours, theme-stable)', now: 'LINK_COLORS: amber, emerald, pink, violet, red, cyan' },
  { token: 'scene.tree-crown / tree-crown-lite / tree-trunk', now: '#5FAE7A, #7DC793, #A0634E' },
  { token: 'scene.vehicle-* (tyre #26355F, hub #C9D3E3, toolbox red #DC2626, neutral van greys)', now: 'literals in vehicles.ts and props.ts' },
  { token: 'scene dark ramp (NIGHT map)', now: 'dark mode remaps each light colour (NIGHT table plus a lightness curve) instead of reading dark tokens' },
] as const;

// ------------------------------------------------------------------ colour maths

export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k));
  return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export interface Tone {
  top: string;
  left: string;
  right: string;
}
export const tone = (hex: string, up = 0.32, dn = -0.2): Tone => ({ top: shade(hex, up), left: hex, right: shade(hex, dn) });
export const WHITE: Tone = { top: '#FFFFFF', left: '#F3F7FD', right: '#D5E3F6' };
export const CONCRETE: Tone = { top: '#F4F7FC', left: '#DCE6F5', right: '#C3D4EE' };
export const GREY = tone('#E5E5E5', 0.4, -0.18);

// ------------------------------------------------------------------ dark theme

const NIGHT: Record<string, string> = {
  '#FFFFFD': '#111A2C',
  '#FFFFFC': '#1E293B',
  '#FFFFFF': '#34425C', '#F3F7FD': '#2B3A55', '#D5E3F6': '#22304A',
  '#F4F7FC': '#172238', '#DCE6F5': '#1E2A42', '#C3D4EE': '#18233A',
  '#EFF6FF': '#16203A', '#DBEAFE': '#1B2740', '#BFDBFE': '#2A4470', '#93C5FD': '#3B5B92',
  '#C9DCF7': '#0E1626', '#A9C6F0': '#0A111F',
  '#D6E4F8': '#26344F', '#E3ECF8': '#25324C', '#CAD9EF': '#1F2B44', '#E7EEF9': '#2A3852',
  '#5FAE7A': '#2F6B4B', '#7DC793': '#3E8560',
  '#171717': '#F1F5F9', '#525252': '#94A3B8',
  '#E5E5E5': '#64748B', '#F1F5F9': '#334155', '#F8FAFC': '#475569', '#CBD5E1': '#475569', '#E2E8F0': '#3A475E',
  '#A3A3A3': '#475569', '#C9D3E3': '#64748B',
};
const KEEP = new Set(['#FFFFFE', '#2563EB', '#FFD66B', '#FFE7A3', '#FFE38A', '#FCE7B0', '#FFF7D6', '#FEF3C7', '#F59E0B', '#B45309', ...LINK_COLORS.map((c) => c.toUpperCase())]);
const nightCache: Record<string, string> = {};

export function nightColor(hex: string): string {
  let h = hex.toUpperCase();
  if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
  if (KEEP.has(h)) return h;
  if (NIGHT[h]) return NIGHT[h];
  if (nightCache[h]) return nightCache[h];
  const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let H = 0, Sa = 0, L = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    Sa = L > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    H = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    H /= 6;
  }
  L = L > 0.75 ? 0.16 + (L - 0.75) * 0.6 : L * 0.82;
  Sa *= 0.85;
  const q = L < 0.5 ? L * (1 + Sa) : L + Sa - L * Sa, pp = 2 * L - q;
  const hue = (t: number) => {
    t = (t + 1) % 1;
    return t < 1 / 6 ? pp + (q - pp) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? pp + (q - pp) * (2 / 3 - t) * 6 : pp;
  };
  return (nightCache[h] = '#' + [hue(H + 1 / 3), hue(H), hue(H - 1 / 3)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join(''));
}

/** Remaps every hex colour (and the blue shadow rgba) of an SVG string for dark mode. */
export const themed = (svg: string, dark: boolean): string =>
  !dark
    ? svg
    : svg
        .replace(/#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g, nightColor)
        .replace(/rgba\(30,58,138,([\d.]+)\)/g, (_m, a) => `rgba(0,4,16,${Math.min(0.55, a * 3.2).toFixed(2)})`);
