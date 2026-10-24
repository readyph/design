import type { Meta, StoryObj } from '@storybook/react';
import { HomeContentOptions, type HomeContentOptionsProps } from './HomeContentOptions';
import { HomeOptionsComparison } from './HomeOptionsComparison';
import { MAP_DEFAULT, MAP_EMPTY } from './home-data';

/**
 * RDY-217 (epic RDY-212): owner-choice content options for Portal Home. The owner picks one; see
 * "Comparison and recommendation" first.
 *
 * Shared rules: connections map stays the main content; no cards, and the KPI strip is flat
 * typography on hairline dividers (no tiles); Leda stays the fixed flush right column with the
 * previous chat. Built on the RDY-214 Home (shared ConnectionsMap, Needs attention strip) and the
 * revised RDY-213 shell.
 *
 * A KPI strip, B Pending approvals, C Combined, D Recent activity (needs a new activity API, out of
 * scope for v1). The slim label at the top of each page names the option; it is review-only.
 *
 * Leda entry points: option-specific suggested prompts in the panel; "Ask Leda" on every approval
 * and attention row prefills the panel; KPIs link into their platform.
 */
const viewports = {
  desktop1440: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' } },
  laptop1024: { name: 'Laptop 1024', styles: { width: '1024px', height: '768px' } },
  phone390: { name: 'Phone 390', styles: { width: '390px', height: '844px' } },
};
const at = (vp: keyof typeof viewports, theme: 'light' | 'dark') => ({
  parameters: { viewport: { viewports, defaultViewport: vp } },
  globals: { theme },
});

const meta: Meta<HomeContentOptionsProps> = {
  title: 'Prototypes/Portal/[For Review] HomeContentOptions',
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'desktop1440' } },
  args: { option: 'combined', map: MAP_DEFAULT, attention: 'ready', ledaOpen: true, ledaView: 'empty', member: false },
  argTypes: {
    option: { control: 'inline-radio', options: ['baseline', 'kpi', 'approvals', 'combined', 'activity'] },
    attention: { control: 'inline-radio', options: ['ready', 'loading', 'empty', 'degraded'] },
    map: { control: false },
    onNodeSelect: { action: 'node selected (opens platform detail, RDY-215)' },
  },
  render: (args) => <HomeContentOptions key={JSON.stringify({ ...args, onNodeSelect: undefined })} {...args} />,
};
export default meta;
type Story = StoryObj<HomeContentOptionsProps>;

export const Comparison: Story = {
  name: '0 · Comparison and recommendation',
  render: () => <HomeOptionsComparison />,
  parameters: { layout: 'fullscreen', viewport: { viewports, defaultViewport: 'desktop1440' } },
  globals: { theme: 'light' },
};
export const ComparisonDark: Story = { ...Comparison, name: '0 · Comparison (dark)', globals: { theme: 'dark' } };

// Option A
export const A_KpiStrip: Story = { name: 'A · KPI strip, 1440 light', args: { option: 'kpi' }, ...at('desktop1440', 'light') };
export const A_KpiStripDark: Story = { name: 'A · KPI strip, 1440 dark', args: { option: 'kpi' }, ...at('desktop1440', 'dark') };
export const A_KpiLaptop: Story = { name: 'A · KPI strip, 1024', args: { option: 'kpi' }, ...at('laptop1024', 'light') };
export const A_KpiPhone: Story = { name: 'A · KPI strip, 390', args: { option: 'kpi' }, ...at('phone390', 'light') };

// Option B
export const B_Approvals: Story = { name: 'B · Pending approvals, 1440 light', args: { option: 'approvals' }, ...at('desktop1440', 'light') };
export const B_ApprovalsDark: Story = { name: 'B · Pending approvals, 1440 dark', args: { option: 'approvals' }, ...at('desktop1440', 'dark') };
export const B_ApprovalsLaptop: Story = { name: 'B · Pending approvals, 1024', args: { option: 'approvals' }, ...at('laptop1024', 'light') };
export const B_ApprovalsPhone: Story = { name: 'B · Pending approvals, 390', args: { option: 'approvals' }, ...at('phone390', 'dark') };
export const B_ApprovalsEmpty: Story = { name: 'B · State, nothing to approve', args: { option: 'approvals', approvalsEmpty: true }, ...at('desktop1440', 'light') };

// Option C
export const C_Combined: Story = { name: 'C · Combined, 1440 light', args: { option: 'combined' }, ...at('desktop1440', 'light') };
export const C_CombinedDark: Story = { name: 'C · Combined, 1440 dark, Leda collapsed', args: { option: 'combined', ledaOpen: false }, ...at('desktop1440', 'dark') };
export const C_CombinedLaptop: Story = { name: 'C · Combined, 1024', args: { option: 'combined' }, ...at('laptop1024', 'light') };
export const C_CombinedPhone: Story = { name: 'C · Combined, 390', args: { option: 'combined' }, ...at('phone390', 'light') };

// Option D (needs API, out of scope for v1)
export const D_Activity: Story = { name: 'D · Activity feed (needs API, not v1), 1440 light', args: { option: 'activity' }, ...at('desktop1440', 'light') };
export const D_ActivityDark: Story = { name: 'D · Activity feed, 1440 dark', args: { option: 'activity' }, ...at('desktop1440', 'dark') };
export const D_ActivityPhone: Story = { name: 'D · Activity feed, 390', args: { option: 'activity' }, ...at('phone390', 'light') };

// Shared states
export const Baseline: Story = { name: 'Reference · RDY-214 baseline', args: { option: 'baseline' }, ...at('desktop1440', 'light') };
export const NoPlatforms: Story = { name: 'State · No platforms (all options hide the extras)', args: { option: 'combined', map: MAP_EMPTY }, ...at('desktop1440', 'light') };
