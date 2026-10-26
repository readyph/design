import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RevenueChart, type RevenueSeries } from './RevenueChart';

const meta: Meta<typeof RevenueChart> = {
  title: 'Components/Data/RevenueChart',
  component: RevenueChart,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof RevenueChart>;


const datasets: Record<string, RevenueSeries[]> = {
  Month: [
    { label: 'Storefront', value: '₱1.77k', amount: 1.77 },
    { label: 'POS', value: '₱0.88k', amount: 0.88 },
    { label: 'Mobile app', value: '₱3.53k', amount: 3.53 },
    { label: 'Wholesale', value: '₱2.65k', amount: 2.65 },
  ],
  Week: [
    { label: 'Storefront', value: '₱0.42k', amount: 0.42 },
    { label: 'POS', value: '₱0.21k', amount: 0.21 },
    { label: 'Mobile app', value: '₱0.91k', amount: 0.91 },
    { label: 'Wholesale', value: '₱0.63k', amount: 0.63 },
  ],
  Quarter: [
    { label: 'Storefront', value: '₱5.1k', amount: 5.1 },
    { label: 'POS', value: '₱2.6k', amount: 2.6 },
    { label: 'Mobile app', value: '₱10.4k', amount: 10.4 },
    { label: 'Wholesale', value: '₱7.9k', amount: 7.9 },
  ],
};

function total(series: RevenueSeries[]) {
  const sum = series.reduce((a, s) => a + s.amount, 0);
  return `₱${sum.toFixed(2)}K`;
}

export const Default: Story = {
  render: () => {
    const [sort, setSort] = useState('Month');
    const series = datasets[sort];
    return (
      <div style={{ maxWidth: 760 }}>
        <RevenueChart
          title="Revenue Sources"
          total={total(series)}
          caption={`Revenue by channel this ${sort.toLowerCase()}`}
          series={series}
          delta={{ label: 'better than last month', value: '+72.4%' }}
          sortOptions={['Month', 'Week', 'Quarter']}
          sortValue={sort}
          onSortChange={setSort}
        />
      </div>
    );
  },
};

export const Compact: Story = {
  render: () => {
    const [sort, setSort] = useState('Month');
    const series = datasets[sort];
    return (
      <div style={{ maxWidth: 340 }}>
        <RevenueChart
          compact
          title="Revenue Sources"
          total={total(series)}
          caption={`Revenue by channel this ${sort.toLowerCase()}`}
          series={series}
          delta={{ label: 'better than last month', value: '+72.4%' }}
          sortOptions={['Month', 'Week', 'Quarter']}
          sortValue={sort}
          onSortChange={setSort}
        />
      </div>
    );
  },
};
