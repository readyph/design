import type { Meta, StoryObj } from '@storybook/react';
import { Notice } from '../../components/Notice';
import { MISSING_IN_KIT, QuickSwitcherDemo, type QuickSwitcherDemoProps } from './QuickSwitcher';

/**
 * PROTOTYPE (RDY-176, epic RDY-173 feature 4) - Portal quick switcher (Cmd/Ctrl+K).
 * Every story is the full RDY-175 shell at the real viewport with the palette open on top, so
 * the modal and the 390 full-screen sheet behave as in the app. Press Cmd/Ctrl+K or click the
 * top-bar search to toggle; Up/Down, Enter, Esc work. "Ask Leda" is always the last option.
 */
const viewports = {
  w1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  w1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
  w390: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
};

const meta: Meta<QuickSwitcherDemoProps> = {
  title: 'Prototypes/Portal/Quick switcher',
  component: QuickSwitcherDemo,
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
    viewport: { viewports, defaultViewport: 'w1440' },
  },
  globals: { theme: 'light' },
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    role: { control: 'inline-radio', options: ['admin', 'member'] },
  },
  args: { theme: 'light', role: 'admin', open: true, initialQuery: '', loading: false },
};
export default meta;
type Story = StoryObj<QuickSwitcherDemoProps>;

const at = (v: keyof typeof viewports) => ({ viewport: { viewports, defaultViewport: v } });
const dark = { args: { theme: 'dark' as const }, globals: { theme: 'dark' } };

/* Desktop 1440 */
export const Empty: Story = { name: '1440 / Empty query (recent, suggested)' };
export const Results: Story = { name: '1440 / Results "in"', args: { initialQuery: 'in' } };
export const ResultsPerson: Story = { name: '1440 / Results "ana"', args: { initialQuery: 'ana' } };
export const NoMatch: Story = { name: '1440 / No match, Ask Leda', args: { initialQuery: 'why did sales drop on monday' } };
export const Loading: Story = { name: '1440 / Loading (remote groups)', args: { initialQuery: 'in', loading: true } };
export const Closed: Story = { name: '1440 / Closed (press Cmd/Ctrl+K)', args: { open: false } };

/* Dark */
export const DarkEmpty: Story = { name: '1440 / Dark, empty query', ...dark };
export const DarkResults: Story = { name: '1440 / Dark, results', ...dark, args: { ...dark.args, initialQuery: 'in' } };
export const DarkNoMatch: Story = {
  name: '1440 / Dark, no match',
  ...dark,
  args: { ...dark.args, initialQuery: 'why did sales drop on monday' },
};

/* 1024 */
export const Laptop: Story = { name: '1024 / Results', args: { initialQuery: 'in' }, parameters: at('w1024') };

/* 390: full-screen sheet */
export const PhoneEmpty: Story = { name: '390 / Empty query', parameters: at('w390') };
export const PhoneResults: Story = { name: '390 / Results', args: { initialQuery: 'in' }, parameters: at('w390') };
export const PhoneNoMatch: Story = {
  name: '390 / No match, Ask Leda',
  args: { initialQuery: 'why did sales drop on monday' },
  parameters: at('w390'),
};
export const PhoneLoading: Story = { name: '390 / Loading', args: { initialQuery: 'in', loading: true }, parameters: at('w390') };
export const PhoneDark: Story = { name: '390 / Dark, results', ...dark, args: { ...dark.args, initialQuery: 'in' }, parameters: at('w390') };

/* Notes for Leonardo */
const SPEC = [
  'Desktop: 640px wide, 12vh from the top, max 76vh high, radius-modal 8px, shadow-xl, overlay token.',
  'Input row 44px, borderless, hairline bottom border. Rows 32px (h-control), radius-control 4px, gap 8px, padding 8px; list padding 6px.',
  'Group heading 12px semibold ink-subtle. Label 14px ink with the match in semibold; meta 12px ink-subtle, truncated.',
  'Active row: surface-muted with an Enter key hint. Footer 12px hints on surface-subtle (desktop only).',
  'Groups (max 4 each): Pages, Platforms (status dot), Team members (avatar), Memories, Reports. Empty query: Recent (3) and Suggested.',
  'Loading: pages and platforms filter at once; team, memories and reports show skeleton rows and the input spinner.',
  'No match: one line of text and "Ask Leda: <query>" highlighted. Ask Leda is always the last option.',
  '390: full-screen sheet, no radius or border, rows at least 40px with meta on a second line, Cancel button, no key hints.',
];

export const Notes: Story = {
  name: 'Notes: spec and missing in kit',
  args: { open: false },
  render: () => (
    <div className="ds-root min-h-screen w-full bg-surface p-gutter font-sans text-ink">
      <div className="flex flex-col gap-3">
        <Notice tone="neutral" title="Spec">
          <ul className="list-disc pl-4">
            {SPEC.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Notice>
        <Notice tone="info" title="Missing in kit (for Leonardo)">
          <ul className="list-disc pl-4">
            {MISSING_IN_KIT.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Notice>
      </div>
    </div>
  ),
};
