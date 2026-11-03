import type { Meta, StoryObj } from '@storybook/react';
import { CatalogueTable } from './CatalogueTable';
import { STRESS_ROWS, getCatalogue } from './sms/catalogue';

const rows = getCatalogue().slice(0, 12);
const meta: Meta<typeof CatalogueTable> = {
  title: 'Components/SMS/Catalogue table',
  component: CatalogueTable,
  tags: ['autodocs'],
  args: { rows, canEdit: true, onEdit: () => {}, onToggle: () => {} },
};
export default meta;
type S = StoryObj<typeof CatalogueTable>;

export const Wide: S = { decorators: [(Story) => <div className="w-[1000px] max-w-full"><Story /></div>] };
export const Compact: S = { name: 'Compact (narrow list)', decorators: [(Story) => <div className="w-[480px] max-w-full"><Story /></div>] };
export const ReadOnly: S = { name: 'Read only (mechanic)', args: { canEdit: false }, decorators: [(Story) => <div className="w-[1000px] max-w-full"><Story /></div>] };
export const Loading: S = { args: { loading: true }, decorators: [(Story) => <div className="w-[1000px] max-w-full"><Story /></div>] };
export const LoadingMore: S = { name: 'Loading more', args: { loadingMore: true }, decorators: [(Story) => <div className="w-[1000px] max-w-full"><Story /></div>] };
export const LoadingCompact: S = { name: 'Loading (narrow list)', args: { loading: true }, decorators: [(Story) => <div className="w-[480px] max-w-full"><Story /></div>] };
export const Stress: S = { name: 'Awkward rows', args: { rows: STRESS_ROWS }, decorators: [(Story) => <div className="w-[1000px] max-w-full"><Story /></div>] };
export const StressCompact: S = { name: 'Awkward rows (narrow list)', args: { rows: STRESS_ROWS }, decorators: [(Story) => <div className="w-[480px] max-w-full"><Story /></div>] };
