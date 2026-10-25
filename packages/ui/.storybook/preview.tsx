import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

export const tags = ['autodocs'];

const preview: Preview = {
  parameters: {
    backgrounds: { disable: true },
    options: {
      storySort: { order: ['Introduction', 'Foundations', 'Components', 'Prototypes'] },
    },
  },
};

export default preview;
