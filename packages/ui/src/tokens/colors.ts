/** Colour tokens (handover 4.1-4.4). [light, dark]. Names are the CSS variable names without `--`. */
export type Pair = readonly [light: string, dark: string];

export const surfaces: Record<string, Pair> = {
  frame: ['#eceff4', '#212324'],
  'frame-hover': ['#e4e8ee', '#404142'],
  'frame-active': ['#dbe1ea', '#404142'],
  surface: ['#ffffff', '#17181a'],
  raised: ['#f4f6f9', '#2b2c2d'],
  'raised-2': ['#eaeef3', '#404142'],
  border: ['#e1e5eb', '#37393a'],
  rule: ['#edf0f3', '#313133'],
  control: ['#c6ccd6', '#4b4d50'],
  text: ['#121722', '#e6e8eb'],
  muted: ['#535d6c', '#a9aeb5'],
  faint: ['#636c7a', '#9a9fa6'],
  accent: ['#2a56c6', '#8eaaf6'],
  'accent-ink': ['#ffffff', '#0b1020'],
  'accent-hover': ['#2149b0', '#a3baf8'],
  'accent-tint': ['#e3eafa', '#22293d'],
  'accent-tint-2': ['#cfdbf6', '#2c3657'],
  hatch: ['#c7cfdb', '#4b4d50'],
  scrim: ['rgba(18,23,34,.28)', 'rgba(0,0,0,.5)'],
  overlay: ['rgba(255,255,255,.82)', 'rgba(43,44,45,.86)'],
  skeleton: ['#e6eaf0', '#2b2c2d'],
  'avatar-bg': ['#dfe7f7', '#233152'],
  'avatar-text': ['#1f3d86', '#c4d3f7'],
};

/** Status tones: text / dot / bg / ink. info has no dot. */
export const status: Record<string, Pair> = {
  'ok': ['#127567', '#5cc8b4'],
  'ok-dot': ['#1f9a86', '#3fb39e'],
  'ok-bg': ['#ddf2ee', '#14291f'],
  'ok-ink': ['#0a4a41', '#7fd8c8'],
  'warn': ['#8a6100', '#e2b75a'],
  'warn-dot': ['#c99413', '#d6a63c'],
  'warn-bg': ['#f8f0d9', '#2b2513'],
  'warn-ink': ['#5e4300', '#ecc978'],
  'bad': ['#b8204f', '#f78ba6'],
  'bad-dot': ['#d23763', '#e85d87'],
  'bad-bg': ['#fbe5ec', '#2e1a21'],
  'bad-ink': ['#7d1235', '#f6a0ba'],
  'info': ['#3b6889', '#93b9d9'],
  'info-bg': ['#e2ecf3', '#1a2530'],
  'info-ink': ['#24465f', '#b0cde4'],
};

export const dataviz: Record<string, Pair> = {
  'chart-1': ['var(--accent)', 'var(--accent)'],
  'chart-muted': ['#aabbe8', '#475272'],
  'share-1': ['#c6ccd6', '#4b4d50'],
  'share-2': ['#8d96a5', '#7a7f87'],
  'chart-grid': ['var(--rule)', 'var(--rule)'],
  'chart-axis': ['var(--faint)', 'var(--faint)'],
  'identity-hq': ['#4f6074', '#4f6074'],
  'identity-text': ['#ffffff', '#ffffff'],
  'map-top': ['#eceff4', '#1c1e21'],
  'map-side': ['#dbe1ea', '#141517'],
  'map-road': ['#c6ccd6', '#2a2d33'],
  'map-window': ['#FFD66B', '#FFD66B'],
  'map-window-soft': ['#FFE7A3', '#FFE7A3'],
};

/** Identity palette: generated monogram tiles, in platform order. Same in both themes. */
export const identity = ['#6d48c6', '#3a6d8c', '#85408f', '#5c6b22', '#52607a', '#4f6b4a', '#8c5866', '#9b4f2c'] as const;

/** Leda palette: separate from the UI; paints only Leda's marks and animations. */
export const leda: Record<string, Pair> = {
  'ld-lit': ['#8E9BEE', '#DCE4FF'],
  'ld-deep': ['#5753D6', '#8C88F2'],
  'ld-tlit': ['#6FD3C6', '#C9FFF4'],
  'ld-tdeep': ['#14968C', '#3ED3BE'],
  'ld-ink': ['#17183A', '#F1F3FC'],
  'ld-night-bg': ['#1F1D5C', '#1F1D5C'],
  'ld-night-lit': ['#DCE4FF', '#DCE4FF'],
  'ld-night-deep': ['#8C88F2', '#8C88F2'],
  'ld-night-tlit': ['#C9FFF4', '#C9FFF4'],
  'ld-night-tdeep': ['#3ED3BE', '#3ED3BE'],
  'ld-al0': ['#8E9BEE', '#DCE4FF'],
  'ld-al1': ['#69C3E3', '#C4F6FF'],
  'ld-al2': ['#63D3B4', '#C8FFE8'],
  'ld-al3': ['#86A8F2', '#D6E6FF'],
  'ld-al4': ['#8E9BEE', '#DCE4FF'],
  'ld-ad0': ['#5753D6', '#8C88F2'],
  'ld-ad1': ['#1F8FBF', '#47C9E0'],
  'ld-ad2': ['#129B85', '#3EDDB0'],
  'ld-ad3': ['#3B6FD8', '#6FA8FF'],
  'ld-ad4': ['#5753D6', '#8C88F2'],
  'ld-gl': ['#FFFFFF', '#5FEBD2'],
  'ld-gd': ['#E2FFF9', '#F2FFFC'],
  'ld-scl': ['#7FE0D2', '#7DF5DF'],
  'ld-scd': ['#1BB3A3', '#5FF2D9'],
  'hl0': ['#5753D6', '#8C88F2'],
  'hl1': ['#8E9BEE', '#DCE4FF'],
  'hl2': ['#1BB3A3', '#3ED3BE'],
  'hl3': ['#7FE0D2', '#7DF5DF'],
};
