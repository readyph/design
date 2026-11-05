import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BulkBar, ServicesToolbar } from './ServicesToolbar';
import { NO_FILTERS, VIEWS, matches, type Filters, type SortId, type ViewId } from './sms/servicesModel';
import { everyService } from './sms/servicesData';

const meta = { title: 'Components/SMS/ServicesToolbar', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const counts = Object.fromEntries(VIEWS.map((v) => [v.id, everyService.filter((j) => matches(j, { ...NO_FILTERS, view: v.id })).length])) as Record<ViewId, number>;

function Live({ initial }: { initial?: Partial<Filters> }) {
  const [f, setF] = useState<Filters>({ ...NO_FILTERS, ...initial });
  const [sort, setSort] = useState<SortId>('attention');
  const results = everyService.filter((j) => matches(j, f)).length;
  return <ServicesToolbar f={f} onChange={(p) => setF((x) => ({ ...x, ...p }))} sort={sort} onSort={setSort} counts={counts} results={results} unpaidTotal={null} onClear={() => setF(NO_FILTERS)} onExport={() => {}} />;
}

export const Default: Story = { render: () => <Live /> };
export const Filtered: Story = { render: () => <Live initial={{ view: 'quotes', unpaid: true, q: 'dela' }} /> };
export const Bulk: Story = {
  render: () => <BulkBar selected={everyService.filter((j) => j.status === 'FOR_APPROVAL').slice(0, 2)} onClear={() => {}} onRemind={() => {}} onAssign={() => {}} onExport={() => {}} />,
};
export const BulkNoQuotes: Story = {
  render: () => <BulkBar selected={everyService.filter((j) => j.status === 'COMPLETED').slice(0, 2)} onClear={() => {}} onRemind={() => {}} onAssign={() => {}} onExport={() => {}} />,
};
