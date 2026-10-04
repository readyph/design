const preset = require('./preset.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx,mdx}',
    './.storybook/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
