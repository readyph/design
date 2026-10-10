import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

export const tags = ['autodocs'];

/**
 * Toolbar globals:
 *  - Theme: light / dark (sets data-theme on <html>). Dark is the default.
 */
export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Design-system theme',
    defaultValue: 'dark',
    toolbar: {
      title: 'Theme',
      icon: 'circlehollow',
      items: [
        { value: 'light', title: 'Light', icon: 'sun' },
        { value: 'dark', title: 'Dark', icon: 'moon' },
      ],
      dynamicTitle: true,
    },
  },
};

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          ['Colors', 'Typography', 'Spacing', 'Radius', 'Shadows', 'Icons'],
          'Components',
          'Portal',
          'Inventory',
          'Patterns',
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as string) || 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.removeAttribute('data-skin');
      }
      return context.parameters.layout === 'fullscreen' ? (
        <Story />
      ) : (
        <div className="ds-root p-6 text-ink font-sans">
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
