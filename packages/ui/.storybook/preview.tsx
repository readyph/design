import { useEffect, useState, type ComponentProps } from 'react';
import { DocsContainer } from '@storybook/blocks';
import { themes } from '@storybook/theming';
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

/**
 * Docs pages follow the same switch: the docs chrome (page, tables, code) uses Storybook's dark theme when the
 * document is dark, so the dark components never sit on a white page. Watches `data-theme` and the OS setting (System).
 */
function useIsDark() {
  const read = () => {
    const t = document.documentElement.getAttribute('data-theme');
    return t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  };
  const [dark, setDark] = useState(read);
  useEffect(() => {
    const update = () => setDark(read());
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);
    update();
    return () => { mo.disconnect(); mq.removeEventListener('change', update); };
  }, []);
  return dark;
}

const ThemedDocsContainer = (props: ComponentProps<typeof DocsContainer>) => {
  const dark = useIsDark();
  return <DocsContainer {...props} theme={dark ? themes.dark : themes.light} />;
};

/**
 * Toolbar viewport menu (RDY-355). Keeps Storybook's three built-ins under their own ids (`mobile1`, `mobile2`, `tablet`:
 * stories force them with `parameters.viewport.defaultViewport`) and adds the shell breakpoint boundaries and the
 * desktop sizes. Component stories stay on "Responsive"; the five Prototypes pages open on `desktop` (their own files).
 */
const viewports = {
  mobile1: { name: 'Small mobile (320 x 568)', styles: { width: '320px', height: '568px' }, type: 'mobile' },
  mobile2: { name: 'Large mobile (414 x 896)', styles: { width: '414px', height: '896px' }, type: 'mobile' },
  tablet: { name: 'Tablet (834 x 1112)', styles: { width: '834px', height: '1112px' }, type: 'tablet' },
  bp320: { name: 'Shell 320 (narrowest)', styles: { width: '320px', height: '640px' }, type: 'mobile' },
  bp375: { name: 'Shell 375 (phone)', styles: { width: '375px', height: '812px' }, type: 'mobile' },
  bp640: { name: 'Shell 640 (last phone width)', styles: { width: '640px', height: '900px' }, type: 'tablet' },
  bp641: { name: 'Shell 641 (first desktop width)', styles: { width: '641px', height: '900px' }, type: 'tablet' },
  laptop: { name: 'Laptop (1280 x 800)', styles: { width: '1280px', height: '800px' }, type: 'desktop' },
  desktop: { name: 'Desktop (1440 x 900)', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  largeDesktop: { name: 'Large desktop (1920 x 1080)', styles: { width: '1920px', height: '1080px' }, type: 'desktop' },
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
    // RDY-355: axe no longer runs on every story render in the browser (it was the slowest part of opening a story). It
    // runs from the Accessibility panel ("Run test") and, for CI, from the vitest axe tests.
    a11y: { manual: true },
    viewport: { viewports },
    docs: { container: ThemedDocsContainer },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Foundations',
          'Components',
          ['Actions', 'Charts', 'Data display', 'Feedback', 'Forms', 'Identity', 'Layout', 'Leda', 'Lists', 'Navigation', 'Overlays'],
          'Prototypes',
          ['Home', 'Platforms', 'Platform', 'Team', 'Memory'],
        ],
      },
    },
  },
};

export default preview;
