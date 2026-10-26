import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Marketplace, type MarketplaceProps } from './Marketplace';
import { Button } from './Button';
import { sampleCatalog } from './Marketplace.sample';
import { Package } from '@phosphor-icons/react';

const meta: Meta<typeof Marketplace> = {
  title: 'Components/Overlays/Marketplace',
  component: Marketplace,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: [
          'Marketplace modal (C20) on `Modal size="marketplace"`: fixed **904 x 744** (window less 48px, full screen on a phone) in every filter, pick and state. Category filter (`SegmentedControl`), flat catalog tiles, the footer pinned with the pick summary and **Install {kind}** (disabled until a pick). Only the tiles scroll.',
          'Tiles are a `radiogroup`: one tab stop, arrows (and Home/End) move and pick, Space/Enter picks, a double click installs. "Coming soon" tiles are dashed, announced as disabled and skipped. A pick shows a check and a filled icon, never colour alone.',
          '`ledaNote` is a plain slot for the Leda note (C38) shown when Leda prefilled the pick. `status` = `loading` (tile skeletons) or `error` (inline error + Try again).',
          '',
          '```tsx',
          "import { Marketplace } from '@readyph/ui';",
          '',
          '<Marketplace open={open} onOpenChange={setOpen} items={catalog}',
          '  defaultPicked="pos" onInstall={(item) => router.push(`/platform?new=${item.key}`)} />',
          '```',
        ].join('\n'),
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Marketplace>;

function Demo(props: Partial<MarketplaceProps>) {
  const [open, setOpen] = useState(true);
  return (
    <main className="min-h-screen bg-surface p-pad text-text">
      <h1 className="text-title">Platforms</h1>
      <Button className="mt-4" variant="secondary" onClick={() => setOpen(true)}>Add a platform</Button>
      <Marketplace items={sampleCatalog} {...props} open={open} onOpenChange={setOpen} onInstall={() => setOpen(false)} />
    </main>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const PickedByLeda: Story = {
  name: 'Picked by Leda (note slot)',
  render: () => (
    <Demo
      defaultPicked="pos"
      ledaNote={
        <p className="rounded-card bg-accent-tint px-3 py-2 text-ui text-text">
          Picked from “Add a POS for the parts counter”. Nothing is added until you press Install and name it.
        </p>
      }
    />
  ),
};

export const FilterOperations: Story = { render: () => <Demo defaultCategory="operations" /> };
export const FilterMarketing: Story = { name: 'Filter: Marketing (Coming soon only)', render: () => <Demo defaultCategory="marketing" /> };
export const EmptyFilter: Story = {
  name: 'Filter with nothing in it',
  render: () => <Demo defaultCategory="finance" items={sampleCatalog.filter((i) => i.category !== 'finance')} />,
};
export const Loading: Story = { render: () => <Demo status="loading" /> };
export const ErrorState: Story = { name: 'Error', render: () => <Demo status="error" onRetry={() => {}} /> };

export const LongNames: Story = {
  render: () => (
    <Demo
      items={[
        { ...sampleCatalog[0], name: 'Inventory and Warehouse Management for Multi-branch Distributors', description: 'Track stock, movements, suppliers, purchase orders and returns across every branch, warehouse and consignment partner you work with.', shares: ['stock levels', 'product catalog', 'purchase prices', 'supplier lists'] },
        ...sampleCatalog.slice(1),
      ]}
    />
  ),
};

export const CustomTitle: Story = { render: () => <Demo icon={Package} title="Add a platform to Cebu Hub" /> };
