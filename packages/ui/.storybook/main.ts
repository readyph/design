import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import { phosphorPerIcon, usedIcons } from './phosphorPerIcon';
import { nonBlockingFonts } from './nonBlockingFonts';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(ts|tsx)',
  ],
  // Brand assets for the manager: favicon.svg (Storybook picks it up by name) and the lockup used as the sidebar brand image (RDY-363).
  staticDirs: ['./static'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    // Kept on purpose (RDY-355 measured it): `react-docgen` starts faster but resolves imports per file on the first story
    // (cold first story +4s, slower overall), and `false` loses the Controls and prop tables.
    reactDocgen: 'react-docgen-typescript',
  },
  core: {
    disableTelemetry: true,
    enableCrashReports: false,
    disableWhatsNewNotifications: true,
  },
  async viteFinal(viteConfig, { configType }) {
    const { mergeConfig } = await import('vite');
    const dev = configType === 'DEVELOPMENT';
    return mergeConfig(viteConfig, {
      plugins: [phosphorPerIcon(), nonBlockingFonts()],
      optimizeDeps: dev
        ? {
            // Pre-bundle everything the first story needs up front, so Vite does not discover deps mid-session and reload.
            exclude: ['@phosphor-icons/react'],
            include: [
              'react',
              'react-dom',
              'react-dom/client',
              'react/jsx-dev-runtime',
              '@storybook/blocks',
              '@storybook/theming',
              ...usedIcons(fileURLToPath(new URL('../src', import.meta.url))).map((n) => `@phosphor-icons/react/dist/csr/${n}`),
            ],
          }
        : undefined,
      server: dev
        ? {
            // Transform the preview entry and the shared styles as soon as the server starts, not on the first request.
            warmup: { clientFiles: ['./.storybook/preview.tsx', './src/styles/globals.css'] },
          }
        : undefined,
    });
  },
};

export default config;
