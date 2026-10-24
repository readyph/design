import type { Meta, StoryObj } from '@storybook/react';
import { Desktop, Moon, Sun } from '@phosphor-icons/react';
import { SegmentedControl } from '../components/SegmentedControl';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from '../hooks/useTheme';
import type { ThemePreference } from '../utils/themeScript';

const options = [
  { value: 'system', label: 'System', icon: Desktop },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

function ThemeSwitcher() {
  const { preference, resolved, setPreference } = useTheme();
  return (
    <div className="flex max-w-md flex-col gap-3 rounded-base border border-border bg-surface p-4 text-ink">
      <p className="text-sm font-medium">Theme</p>
      <SegmentedControl
        aria-label="Theme"
        options={options}
        value={preference}
        onChange={(v) => setPreference(v as ThemePreference)}
      />
      <p className="text-xs text-ink-muted">
        Preference <code>{preference}</code>, resolved <code>{resolved}</code>. Saved on this browser as{' '}
        <code>readyph.theme</code>.
      </p>
    </div>
  );
}

const meta: Meta = {
  title: 'Components/Providers/ThemeProvider',
  parameters: {
    docs: {
      description: {
        component: `\`\`\`tsx
import { ThemeProvider, useTheme, themeScriptProps } from '@readyph/ui';

// <head>: <script {...themeScriptProps} />  (sets data-theme before first paint)
<ThemeProvider><App /></ThemeProvider>

const { preference, resolved, setPreference } = useTheme();
\`\`\``,
      },
    },
  },
};
export default meta;
type Story = StoryObj;

/** A SegmentedControl bound to `useTheme` switches the canvas theme (the Storybook toolbar theme is overridden while the provider is mounted). */
export const Switcher: Story = {
  render: () => (
    <ThemeProvider>
      <ThemeSwitcher />
    </ThemeProvider>
  ),
};
