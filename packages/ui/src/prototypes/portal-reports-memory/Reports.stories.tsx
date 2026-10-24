import type { Meta, StoryObj } from '@storybook/react';
import { Notice } from '../../components/Notice';
import { MISSING_IN_KIT } from './common';
import { ReportsPage, type ReportsPageProps } from './Reports';

/**
 * PROTOTYPE (RDY-179) - Portal Reports on the RDY-175 shell. Every story is the full shell at the
 * real viewport (1440 / 1024 / 390 in the viewport toolbar). Click a row to open a report; the
 * back arrow returns to the list. "Generate with Leda" and "Ask Leda about this" open the Leda panel.
 */
const viewports = {
  w1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
  w1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' }, type: 'desktop' },
  w390: { name: 'Phone 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
};

const meta: Meta<ReportsPageProps> = {
  title: 'Prototypes/Portal/[For Review] Reports',
  component: ReportsPage,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'w1440' } },
  globals: { theme: 'light' },
  argTypes: {
    theme: { control: 'inline-radio', options: ['light', 'dark'] },
    state: { control: 'inline-radio', options: ['ready', 'loading', 'error', 'empty'] },
    reportId: { control: 'select', options: [undefined, 'weekly-sales', 'low-stock', 'customer-growth', 'service-jobs', 'draft'] },
    leda: { control: 'inline-radio', options: ['closed', 'empty', 'conversation', 'confirm'] },
  },
  args: { theme: 'light', state: 'ready' },
};
export default meta;
type Story = StoryObj<ReportsPageProps>;

const at = (v: keyof typeof viewports) => ({ viewport: { viewports, defaultViewport: v } });
const dark = { args: { theme: 'dark' as const }, globals: { theme: 'dark' } };

/* 1440 */
export const List: Story = { name: '1440 / List' };
export const ListDark: Story = { name: '1440 / List, dark', ...dark };
export const Detail: Story = { name: '1440 / Report detail', args: { reportId: 'weekly-sales' } };
export const DetailDark: Story = { name: '1440 / Report detail, dark', args: { reportId: 'weekly-sales', theme: 'dark' }, globals: { theme: 'dark' } };
export const DetailWideKpis: Story = { name: '1440 / Detail: 4 KPIs, trend + table', args: { reportId: 'service-jobs' } };
export const DetailTableOnly: Story = { name: '1440 / Detail: table only', args: { reportId: 'low-stock' } };
export const DetailLeda: Story = { name: '1440 / Detail + Leda panel', args: { reportId: 'weekly-sales', leda: 'conversation' } };

/* States */
export const Empty: Story = { name: 'State / No reports yet', args: { state: 'empty' } };
export const NoResults: Story = { name: 'State / No matching reports', args: { query: 'payroll' } };
export const Loading: Story = { name: 'State / Loading list', args: { state: 'loading' } };
export const ErrorState: Story = { name: 'State / Error', args: { state: 'error' } };
export const DetailLoading: Story = { name: 'State / Loading detail', args: { state: 'loading', reportId: 'weekly-sales' } };
export const DetailNoData: Story = { name: 'State / Detail with no data', args: { reportId: 'draft' } };

/* 1024 */
export const Laptop: Story = { name: '1024 / List', parameters: at('w1024') };
export const LaptopDetail: Story = { name: '1024 / Report detail', args: { reportId: 'weekly-sales' }, parameters: at('w1024') };
export const LaptopDetailDark: Story = {
  name: '1024 / Report detail, dark',
  args: { reportId: 'service-jobs', theme: 'dark' },
  globals: { theme: 'dark' },
  parameters: at('w1024'),
};

/* 390 */
export const Phone: Story = { name: '390 / List', parameters: at('w390') };
export const PhoneDark: Story = { name: '390 / List, dark', ...dark, parameters: at('w390') };
export const PhoneDetail: Story = { name: '390 / Report detail', args: { reportId: 'service-jobs' }, parameters: at('w390') };
export const PhoneDetailDark: Story = {
  name: '390 / Report detail, dark',
  args: { reportId: 'weekly-sales', theme: 'dark' },
  globals: { theme: 'dark' },
  parameters: at('w390'),
};

/* Notes for Leonardo */
export const KitGaps: Story = {
  name: 'Notes: missing in kit',
  render: () => (
    <div className="ds-root min-h-screen bg-surface p-gutter font-sans text-ink">
      <Notice tone="info" title="Missing in kit (for Leonardo; shared with Memory)">
        <ul className="list-disc pl-4">
          {MISSING_IN_KIT.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Notice>
    </div>
  ),
};
