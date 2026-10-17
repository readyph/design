/** Shared story parameters. Mobile stories use the 390x844 critique viewport; desktop is the 1280x800 canvas. */
export const fullscreen = { layout: 'fullscreen' } as const;

export const mobile = {
  layout: 'fullscreen',
  viewport: {
    viewports: { rs390: { name: 'Mobile 390', styles: { width: '390px', height: '844px' } } },
    defaultViewport: 'rs390',
  },
} as const;
