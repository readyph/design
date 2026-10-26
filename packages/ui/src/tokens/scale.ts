/** Non-colour tokens (handover 4.5-4.7). Same in light and dark unless noted. */
export const fonts = {
  font: '"IBM Plex Sans", Inter, system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
};

/** Type scale: [font-size, line-height, weight?, letter-spacing?] */
export const type: Record<string, readonly [string, string, string?, string?]> = {
  'title': ['22px', '28px', '600', '-0.01em'],
  'case': ['20px', '28px', '600', '-0.01em'],
  'topic': ['24px', '32px', '600'],
  'header': ['18px', '25px', '600'],
  'dialog': ['16px', '22px', '600'],
  'leda-title': ['15px', '20px', '600'],
  'body': ['14px', '20px', '400'],
  'ui': ['13px', '18px'],
  'small': ['12px', '16px'],
  'tiny': ['11px', '16px'],
  'figure': ['36px', '44px', '500'],
  'figure-sm': ['30px', '36px', '500'],
  'overview-figure': ['22px', '28px'],
  'reading': ['16px', '27px'],
};

export const radius = { sheet: '8px', card: '6px', control: '5px', chip: '4px', row: '0px' };

export const spacing = {
  'row-y': '16px',
  'row-y-tight': '12px',
  'field-y': '24px',
  'group-y': '32px',
  'pad': '24px',
  'gap': '24px',
  'inset': '8px',
};

export const layout = {
  'rail': '52px',
  'place': '460px',
  'status': '34px',
  'leda-w': '320px',
  'leda-w-overview': '560px',
  'leda-panel-w': '440px',
  'sheet-bar': '48px',
  'map-h': 'clamp(240px, calc(34vh + 20px), 380px)',
  'reading-measure': '680px',
  'ctl-button': '32px',
  'ctl-dropdown': '40px',
  'ctl-dropdown-sm': '34px',
  'ctl-leda-bar': '34px',
  'ctl-chip': '30px',
  'ctl-touch': '44px',
};

/** Responsive overrides on :root (max-width media queries). */
export const responsive: { query: string; vars: Record<string, string> }[] = [
  { query: '(max-width: 1439px)', vars: { place: '400px' } },
  { query: '(max-width: 1180px)', vars: { place: '380px' } },
  { query: '(max-width: 960px)', vars: { place: '320px', 'map-h': '254px' } },
  { query: '(max-width: 640px)', vars: { pad: '16px', 'map-h': '160px', 'ctl-button': '40px', 'ctl-dropdown': '44px', 'ctl-dropdown-sm': '44px', 'fs-case': '18px', 'lh-case': '25px', 'fs-topic': '20px', 'lh-topic': '28px', 'fs-overview-figure': '20px' } },
];

export const shadow: Record<string, readonly [string, string]> = {
  'shadow-float': [
    '0 12px 36px rgba(18,23,34,.16), 0 2px 6px rgba(18,23,34,.08)',
    '0 16px 40px rgba(0,0,0,.5), 0 2px 6px rgba(0,0,0,.3)',
  ],
};

export const blur = {
  'blur-menu': 'blur(14px) saturate(1.2)',
  'blur-palette': 'blur(20px) saturate(1.4)',
};

export const motion = {
  'ease-subpage': 'cubic-bezier(0.22, 1, 0.36, 1)',
  'dur-subpage-in': '240ms',
  'dur-subpage-out': '220ms',
  'subpage-drift': '6%',
  'subpage-dim': '0.55',
  'dur-leda-open': '240ms',
  'dur-leda-close': '220ms',
  'dur-tab': '120ms',
  'dur-hover': '120ms',
  'dur-hover-slow': '150ms',
  'dur-reduced-fade': '140ms',
  'ease-halo': 'cubic-bezier(.45,0,.3,1)',
  'dur-halo': '2.8s',
  'dur-halo-reduced': '1.6s',
  'dur-scan': '2.4s',
  'dur-glint': '2.4s',
  'dur-aurora': '3s',
  'dur-aurora-settle': '300ms',
  'dur-stream-word': '160ms',
  'dur-stream-stagger': '24ms',
  'dur-stream-widget': '200ms',
  'dur-toast': '5000ms',
  'dur-row-flash': '1.6s',
};
