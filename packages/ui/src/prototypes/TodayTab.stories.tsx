import type { Meta, StoryObj } from '@storybook/react';
import { PlatformShell } from '../components/PlatformShell';
import { PlatformToday } from '../components/PlatformToday';
import { autoWorks, cafe, jobs, stock, stockroom } from '../components/PlatformToday.data';

/** [For Review] RDY-284 (C24). Prototype only: stories are not exported from the package. Blocks in the real PlatformShell place column. */
const meta: Meta = {
  title: 'Prototypes/Portal/[For Review] Today blocks',
  parameters: { layout: 'fullscreen' },
};
export default meta;

const blocks = (
  <div className="flex flex-col gap-10 px-3 pb-6">
    <PlatformToday platform={autoWorks} kind="Auto repair" onOpen={() => {}} leda="acts" facts={[{ value: 7, label: 'open jobs' }, { value: 2, label: 'late', tone: 'bad' }]} lists={[{ ...jobs, onViewAll: () => {} }]} />
    <PlatformToday platform={stockroom} kind="Inventory" onOpen={() => {}} leda="reads" facts={[{ value: 412, label: 'products' }]} lists={[{ ...stock, onViewAll: () => {} }]} />
    <PlatformToday platform={cafe} kind="Point of sale" onOpen={() => {}} leda="reads" facts={[{ value: 64, label: 'sales' }]} activity={[{ id: 'a', at: '10:12 AM', text: 'Closed shift for Lia Santos' }]} />
  </div>
);

export const InPlaceColumn: StoryObj = {
  render: () => (
    <PlatformShell place={blocks} placeLabel="Today">
      <div className="p-6 text-ui text-muted">Sheet</div>
    </PlatformShell>
  ),
};
