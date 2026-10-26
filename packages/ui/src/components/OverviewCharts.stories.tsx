import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { OverviewCharts, type OverviewPlatform } from './OverviewCharts';
import { WeekChart } from './WeekChart';
import { autoWorks, cafe, days, failed, hardware, loading, noHistory, stockroom } from './OverviewCharts.data';

const meta: Meta<typeof OverviewCharts> = {
  title: 'Components/Data/Overview charts',
  component: OverviewCharts,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: [
          'Overview charts (C31): each platform\'s last 7 days. Parts: `WeekChart` (`bars`: yesterday in `chart-1`, the others `chart-muted`, labelled y axis, true zero; `diverging`: In above the line, Out below), `ShareBar` (6px stacked bar + a legend with every label and value), and the per-platform block (identity, status, one figure, one chart, shares, facts).',
          '',
          '- 1 to 3 platforms: one column each. 4 or more: one compact row each (chart with 2-3 ticks). Below 760px of the component\'s **own** width (measured, `stackBelow`) columns stack and rows fold the chart under the figure.',
          '- Failed platform: `state="error"` shows "Couldn\'t load your {name} numbers. Retry"; the others still render. `state="loading"` shows skeletons in the final layout. `chart: null` shows "No 7-day history yet".',
          '- **Accessible.** Each chart is one image with a summary and has a visually hidden table of the values. Focus a chart and use Left/Right/Home/End to read each day in the tooltip; Escape clears. Bars carry their value as text where the slot allows (always on yesterday). No animation. Forced colours map marks to system colours.',
          '- **Formats are props.** `format`, `tickFormat`, `locale`; `chartNumberFormat({ locale, currency, compact })` builds them. Nothing is hard-coded to a currency.',
          '',
          '**Data for Leonardo.** `platforms[] { id, name, kind?, logo?, status? {tone,label,since?}, figure? {value,label}, sub?, chart? {title, note?, kind?, labels[], values[] | up[]/down[], format?, tickFormat?, unit?} | null, shares?[] {title,total,parts[] {label,value,tone?}}, facts?, state?, onRetry?, onOpen?, retrying? }`. Values are numbers, `null` = closed.',
          '',
          '```tsx',
          '<OverviewCharts locale="en-PH" platforms={[{ id, name, figure, chart: { title: "Revenue", labels, values, format } }]} />',
          '```',
        ].join('\n'),
      },
    },
  },
  args: { platforms: [autoWorks, stockroom, cafe] },
};
export default meta;
type Story = StoryObj<typeof OverviewCharts>;

export const ThreeColumns: Story = {};
export const OnePlatform: Story = { args: { platforms: [autoWorks] } };
export const FourRows: Story = { args: { platforms: [autoWorks, stockroom, cafe, hardware] } };
export const FailedPlatform: Story = {
  render: (args) => {
    const [bad, setBad] = useState(true);
    const list: OverviewPlatform[] = [autoWorks, bad ? { ...failed, id: cafe.id, name: 'Lia’s Cafe', onRetry: () => setBad(false) } : cafe, stockroom];
    return <OverviewCharts {...args} platforms={list} />;
  },
};
export const FailedInRows: Story = { args: { platforms: [autoWorks, stockroom, { ...failed, onRetry: () => {} }, hardware] } };
export const Loading: Story = { args: { platforms: [loading, { ...loading, id: 'l2', name: 'Second' }, { ...loading, id: 'l3', name: 'Third' }] } };
export const NoHistory: Story = { args: { platforms: [autoWorks, noHistory] } };
export const StackedNarrow: Story = { render: (args) => <div className="w-[375px]"><OverviewCharts {...args} /></div> };
export const RowsNarrow: Story = { render: (args) => <div className="w-[320px]"><OverviewCharts {...args} platforms={[autoWorks, stockroom, cafe, hardware]} /></div> };

const Edge = ({ title, values }: { title: string; values: (number | null)[] }) => (
  <div className="rounded-card border border-rule p-4"><WeekChart title={title} labels={days} values={values} /></div>
);
export const EdgeData: StoryObj = {
  render: () => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
      <Edge title="All zero" values={[0, 0, 0, 0, 0, 0, 0]} />
      <Edge title="All equal" values={[40, 40, 40, 40, 40, 40, 40]} />
      <Edge title="With negatives" values={[120, -40, 80, null, -10, 60, 90]} />
      <Edge title="Huge numbers" values={[1.2e9, 3.4e9, null, 2.2e9, 9.9e9, 5e9, 7.7e9]} />
      <Edge title="Empty" values={[]} />
      <Edge title="Single day" values={[12]} />
    </div>
  ),
};
