/**
 * Layout dimensions and standard control sizes.
 * 14px UI text, 32/36/40 controls, 16/20/24 icons.
 */
export const layout = {
  railWidth: '3.5rem',
  sidebarWidth: '15rem',
  rightPanelWidth: '18rem',
  topbarHeight: '3.25rem',
  contentMaxWidth: '48rem',
} as const;

/** Heights of buttons, inputs and selects (sm / md / lg). */
export const controlHeight = {
  sm: '2rem', // 32px
  md: '2.25rem', // 36px
  lg: '2.5rem', // 40px
} as const;

/** Icon sizes in px (icon components take numbers). */
export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const borderWidth = {
  thin: '1px',
  thick: '2px',
} as const;

export const zIndex = {
  dropdown: 30,
  drawer: 40,
  modal: 50,
  popover: 55,
  toast: 60,
  tooltip: 70,
} as const;

export type IconSize = keyof typeof iconSize;
export type ControlSize = keyof typeof controlHeight;
