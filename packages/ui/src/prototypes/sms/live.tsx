import { Fragment, type ReactNode } from 'react';

/**
 * Shared bits of the v2 Shop floor stories (Storybook structure, owner decision 2026-11-01): ONE live, clickable story per page;
 * every state is a control (toolbar Viewport / Theme + the Controls panel); docs sit BELOW the live page in the Docs tab (one Canvas, an iframe).
 */

/** Meta fields every live story shares: fullscreen, opens on Desktop 1440, each meta also sets tags: ['!autodocs'] literally (the MDX page is the docs), docs Canvas rendered as ONE iframe. */
export const liveMeta = {
  parameters: {
    layout: 'fullscreen' as const,
    viewport: { defaultViewport: 'desktop' },
    controls: { sort: 'none' },
    docs: { story: { inline: false, iframeHeight: 760 } },
  },
};

/** Test-only stories: set `tags: ['!dev', '!autodocs', 'test-only']` literally on the meta (see Flows.stories.tsx). */

/** Page state is "initial*" props, so a control change remounts the page with the new starting state. */
export function Remount({ on, children }: { on: unknown; children: ReactNode }) {
  return <Fragment key={JSON.stringify(on)}>{children}</Fragment>;
}

export const control = {
  select: (options: readonly string[], description: string, category = 'State') => ({ control: 'select' as const, options: [...options], description, table: { category } }),
  bool: (description: string, category = 'State') => ({ control: 'boolean' as const, description, table: { category } }),
};
