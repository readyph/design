import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ServiceCard, ServicesTable } from './ServicesTable';
import { everyService } from './sms/servicesData';

const rows = everyService.slice(0, 20);
const noop = () => {};

const meta = { title: 'Components/SMS/ServicesTable', parameters: { layout: 'fullscreen' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Live({ inventory, onViewQuote }: { inventory?: 'ok' | 'slow' | 'down'; onViewQuote?: () => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set([rows[1].id]));
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <div className="overflow-x-auto">
      <ServicesTable rows={rows} selected={selected} onToggle={toggle} onToggleAll={(on) => setSelected(on ? new Set(rows.map((r) => r.id)) : new Set())}
        openId={rows[2].id} onOpen={noop} onOpenCustomer={noop} inventory={inventory} onViewQuote={onViewQuote} />
    </div>
  );
}

export const Default: Story = { render: () => <Live /> };
export const InventorySlow: Story = { render: () => <Live inventory="slow" /> };
export const InventoryDown: Story = { render: () => <Live inventory="down" /> };
export const WithQuotationLink: Story = { render: () => <Live onViewQuote={noop} /> };
export const Loading: Story = {
  render: () => <div className="overflow-x-auto"><ServicesTable rows={[]} loading selected={new Set()} onToggle={noop} onToggleAll={noop} onOpen={noop} onOpenCustomer={noop} /></div>,
};
export const LoadingMore: Story = {
  render: () => <div className="overflow-x-auto"><ServicesTable rows={rows.slice(0, 6)} loadingMore selected={new Set()} onToggle={noop} onToggleAll={noop} onOpen={noop} onOpenCustomer={noop} /></div>,
};
export const PhoneCards: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <div className="px-4">{rows.slice(0, 5).map((j) => <ServiceCard key={j.id} job={j} onOpen={noop} />)}</div>,
};
export const PhoneSelectMode: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <div className="px-4">{rows.slice(0, 5).map((j, i) => <ServiceCard key={j.id} job={j} onOpen={noop} selectMode checked={i === 1} onToggle={noop} />)}</div>,
};
