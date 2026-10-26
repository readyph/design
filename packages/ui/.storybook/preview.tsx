import type { Decorator, Preview } from '@storybook/react';
import '../src/styles/globals.css';

export const tags = ['autodocs'];

/**
 * Toolbar theme switch (RDY-354). Uses the same mechanism as the tokens: `data-theme="light|dark"` on <html>
 * (globals.css). "System" removes the attribute so the tokens follow `prefers-color-scheme`.
 * It is set on the iframe root, not a wrapper, so portalled content (Modal, Menu, Toaster, Select list) switches too.
 * The attribute is written while rendering (before any effect), so stories that force a theme in their own effect
 * (the "Dark" stories) still win, and restore the toolbar value when they unmount.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as string | undefined;
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
  }
  return <Story />;
};

const preview: Preview = {
  decorators: [withTheme],
  initialGlobals: { theme: 'system' },
  globalTypes: {
    theme: {
      description: 'Colour theme (light, dark, or follow the system)',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        dynamicTitle: true,
        items: [
          { value: 'system', icon: 'browser', title: 'System' },
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
      },
    },
  },
  parameters: {
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          'Components',
          'Prototypes',
          ['Home', 'Platforms', 'Platform', 'Team', 'Memory'],
        ],
      },
    },
  },
};

export default preview;
