import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Notice } from '../../components/Notice';
import { PageHeader } from '../../components/PageHeader';
import { SegmentedControl } from '../../components/SegmentedControl';
import {
  ChromeFrame,
  MISSING_IN_KIT,
  SpecimenBoard,
  ThemePane,
  ThemePreferenceScreen,
  TokenBoard,
} from './Foundations';

/**
 * PROTOTYPE (RDY-174, epic RDY-173 features 6 and 7) - Portal foundations: light theme, ink chrome,
 * radius and density tokens, theme preference. Tokens are shared by Portal, Inventory, Repair shop
 * and SMS. Stories pin the Storybook theme to light so light and dark panes can sit side by side.
 */
const meta: Meta = {
  title: 'Prototypes/Portal/[For Review] Foundations',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
  globals: { theme: 'light' },
};
export default meta;
type Story = StoryObj;

function Page({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="ds-root flex min-h-screen min-w-0 flex-col gap-4 bg-surface-canvas p-4 font-sans text-ink">
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}

function SideBySide({ children, stack = false }: { children: (mode: 'light' | 'dark') => React.ReactNode; stack?: boolean }) {
  return (
    <div className={stack ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 gap-4 xl:grid-cols-2'}>
      <ThemePane mode="light" label="Light" className="rounded-md border border-border">{children('light')}</ThemePane>
      <ThemePane mode="dark" label="Dark" className="rounded-md border border-border">{children('dark')}</ThemePane>
    </div>
  );
}

export const Tokens: Story = {
  render: () => (
    <Page title="Foundations: tokens" description="Light palette, shape and density. Same tokens in light and dark.">
      <SideBySide>{() => <TokenBoard />}</SideBySide>
      <Notice tone="info" title="Missing in kit (for Leonardo)">
        <ul className="list-disc pl-4">
          {MISSING_IN_KIT.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Notice>
    </Page>
  ),
};

export const Specimen: Story = {
  name: 'Specimen board',
  render: () => (
    <Page title="Foundations: specimen board" description="Button, Input, Select, Badge, Card, Table and Menu in both themes. Menus open in the page theme (portal); use the toolbar to check dark menus.">
      <SideBySide>{() => <SpecimenBoard />}</SideBySide>
    </Page>
  ),
};

function ChromeVariants() {
  const [leda, setLeda] = useState<'launcher' | 'panel'>('panel');
  return (
    <Page title="Foundations: chrome variants" description="A: ink chrome (recommended, rail and sidebar dark in both themes). B: all-light chrome for comparison (epic open question 4).">
      <SegmentedControl
        size="sm"
        aria-label="Leda entry point"
        className="self-start"
        value={leda}
        onChange={(v) => setLeda(v as 'launcher' | 'panel')}
        options={[
          { value: 'panel', label: 'Leda panel' },
          { value: 'launcher', label: 'Leda launcher' },
        ]}
      />
      <SideBySide stack>
        {() => (
          <>
            <p className="text-sm font-semibold text-ink">A. Ink chrome</p>
            <ChromeFrame variant="ink" leda={leda} />
            <p className="text-sm font-semibold text-ink">B. All-light chrome</p>
            <ChromeFrame variant="light" leda={leda} />
          </>
        )}
      </SideBySide>
    </Page>
  );
}

export const Chrome: Story = {
  name: 'Chrome variants',
  render: () => <ChromeVariants />,
};

export const ThemePreference: Story = {
  name: 'Theme preference',
  render: () => (
    <Page title="Foundations: theme preference" description="System / Light / Dark in Account settings and the account menu. Persists to readyph.theme; no flash on load.">
      <ThemePreferenceScreen />
    </Page>
  ),
};
